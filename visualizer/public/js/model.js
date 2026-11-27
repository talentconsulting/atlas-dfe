// Catalogue logic with no page output: combining a repository's dependencies and messages, matching names to systems, and building the system landscape.
import { state } from './state.js';
import { alphabetical, getJson, orgRepoSlug, splitPascalCase, titleCase } from './util.js';

export async function loadDependenciesFor(source) {
  const dependencies = source.capabilities.dependencies ? await getJson(`/api/sources/${encodeURIComponent(source.id)}/dependencies`) : null;
  const messages = source.capabilities.messages
    ? await getJson(`/api/sources/${encodeURIComponent(source.id)}/messages`).catch(() => null) // supplementary; ignore failures
    : null;
  return combineDependencies(source, dependencies, messages);
}

// One source's service dependencies with its handled events/commands appended as message dependencies.
export function combineDependencies(source, dependencies, messages) {
  const data = dependencies || { repository: orgRepoSlug(source.repository), dependencies: [] };
  if (!messages) return data;
  try {
    return { ...data, dependencies: [...(data.dependencies || []), ...messageDependencies(source, messages, data)] };
  } catch {
    return data;
  }
}

// Two services joined only through a Service Bus queue or topic often each define their own copy of the
// message class (das-funding-projection-api's and das-employer-finance-jobs' ImportLearnersCostEvent), so
// no shared namespace links them. Their service-dependency catalogues do: the sender lists the entity as an
// outbound message-broker resource and the receiver as an inbound one. For each such entity this adds a
// message dependency from each sender to each receiver, named for the events and commands both repositories'
// catalogues define (the entity name when they share none), so the landscape draws the edge and its event
// filter lists those messages. Returns the number of dependencies added.
export function addQueueMessageDependencies(entries, messagesBySourceId) {
  const entities = new Map();
  for (const { source, dependencies } of entries) {
    for (const dependency of dependencies) {
      if (dependency.kind !== 'message-broker') continue;
      for (const resource of dependency.resources || []) {
        if (!resource.name || !['queue', 'topic', 'subscription'].includes(resource.type)) continue;
        const key = resource.name.toLowerCase();
        if (!entities.has(key)) entities.set(key, { name: resource.name, type: resource.type, senders: new Map(), receivers: new Set() });
        const entity = entities.get(key);
        if (resource.direction === 'inbound') entity.receivers.add(source.id);
        else if (resource.direction === 'outbound') entity.senders.set(source.id, resource.sourceFile || null);
      }
    }
  }
  const messageNames = (sourceId) => {
    const messages = messagesBySourceId(sourceId) || {};
    return new Map([
      ...(messages.events || []).map((message) => [message.name, 'EVENT']),
      ...(messages.commands || []).map((message) => [message.name, 'COMMAND'])
    ]);
  };
  const byId = new Map(entries.map((entry) => [entry.source.id, entry]));
  let added = 0;
  for (const entity of entities.values()) {
    for (const [senderId, sourceFile] of entity.senders) {
      for (const receiverId of entity.receivers) {
        if (receiverId === senderId || !byId.has(receiverId)) continue;
        const receiverMessages = messageNames(receiverId);
        const shared = [...messageNames(senderId)].filter(([name]) => receiverMessages.has(name));
        const operations = shared.length
          ? shared.map(([name, method]) => ({ method, path: name, sourceFile }))
          : [{ method: 'QUEUE', path: entity.name, sourceFile }];
        byId.get(senderId).dependencies.push({
          name: titleCase(byId.get(receiverId).source.name),
          kind: 'message',
          targetRepo: receiverId,
          classification: 'internal',
          direction: 'outbound',
          description: 'Sends messages to',
          client: null,
          technology: `Service Bus ${entity.type}`,
          configurationKeys: [],
          authentication: { type: null, configurationKeys: [] },
          operations,
          resources: [{ type: entity.type, name: entity.name, direction: 'outbound', sourceFile }],
          evidence: [{ sourceFile, reason: `Sends to the ${entity.type} ${entity.name}, which ${byId.get(receiverId).source.name} receives from` }],
          confidence: 'medium'
        });
        added += 1;
      }
    }
  }
  return added;
}

export function namespaceServiceSegment(namespace) {
  const orgPrefixes = new Set(['sfa', 'esfa', 'das']);
  const parts = String(namespace || '').split('.');
  let index = 0;
  while (index < parts.length && orgPrefixes.has(parts[index].toLowerCase())) index++;
  return parts[index] || null;
}

// Some commands/events don't handle the message named in their own `name` field — they wrap
// another message as a field (e.g. a generic sync command carrying an `InnerEvent` payload) and
// really represent handling of that inner type. Surface those wrapped names too, so a repo that
// only consumes an event indirectly through such a wrapper still shows up connected to it.
export function wrappedMessageNames(message) {
  return (message.fields || [])
    .map((field) => field.type)
    .filter((type) => typeof type === 'string' && /(Event|Command)$/.test(type) && type !== message.name);
}

// Another service's messages in this repo's catalogue: handled ones mean that service sends them here (inbound);
// ones with no handler here mean this repo sends them to that service (outbound), e.g. a job sending
// SFA.DAS.Notifications.Messages.Commands.SendEmailCommand to das-notifications.
// When the repo also calls that service's API (e.g. events from SFA.DAS.RoATPService and an "RoATP Service"
// HTTP dependency), the messages share the API dependency's targetId, so the service view draws one node.
// Messages under the repo's own name, system name or a container's name (e.g. in-process commands in
// SFA.DAS.PAS.Account.Application.Commands for the "PAS Account" container) are its own, not another service's.
export function messageDependencies(source, messages, { dependencies = [], systemName, containers = [] } = {}) {
  const apiDependencies = dependencies.filter((dependency) => dependency.kind === 'http-api' && dependency.targetId);
  const events = (messages.events || []).map((m) => ({ ...m, messageKind: 'event' }));
  const commands = (messages.commands || []).map((m) => ({ ...m, messageKind: 'command' }));
  const ownTokenSets = [source.name, systemName, ...containers.map((container) => container.name)]
    .filter(Boolean)
    .map((name) => new Set(tokenize(name)));
  const groups = new Map();
  for (const message of [...events, ...commands].filter((m) => m.namespace)) {
    const segment = namespaceServiceSegment(message.namespace);
    if (!segment) continue;
    const segmentTokens = new Set(tokenize(segment));
    if (ownTokenSets.some((ownTokens) => canRelate(segmentTokens, ownTokens))) continue;
    const direction = message.handlers?.length ? 'inbound' : 'outbound';
    const key = `${direction}:${segment.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, { label: segment, tokens: segmentTokens, direction, messages: [] });
    groups.get(key).messages.push(message);
  }
  return [...groups.values()].map((group) => {
    const matchedSystem = bestMatchingSystem(group.tokens, state.catalog.filter((candidate) => candidate.id !== source.id), (candidate) => new Set(tokenize(candidate.name)));
    const matchedApi = bestMatchingSystem(group.tokens, apiDependencies, (dependency) => new Set(tokenize(dependency.name)));
    const sends = group.direction === 'outbound';
    return {
      ...(matchedApi ? { targetId: matchedApi.targetId } : {}),
      name: matchedSystem ? titleCase(matchedSystem.name) : splitPascalCase(group.label),
      kind: 'message',
      classification: matchedSystem ? 'internal' : 'unknown',
      direction: group.direction,
      description: sends ? 'Sends messages to' : 'Consumes events from',
      client: null,
      technology: 'Event',
      configurationKeys: [],
      authentication: { type: null, configurationKeys: [] },
      operations: group.messages.flatMap((message) => [message.name, ...wrappedMessageNames(message)].map((name) => ({ method: message.messageKind === 'command' ? 'COMMAND' : 'EVENT', path: name, sourceFile: message.handlers?.[0]?.sourceFile || message.sourceFile }))),
      resources: [],
      evidence: group.messages.flatMap((message) => {
        const wrapped = wrappedMessageNames(message);
        const suffix = wrapped.length ? ` (wrapping ${wrapped.join(', ')})` : '';
        if (sends) return [{ sourceFile: message.sourceFile, reason: `Sends ${message.messageKind} '${message.name}' from namespace '${message.namespace}' without handling it here.` }];
        return message.handlers.map((handler) => ({ sourceFile: handler.sourceFile, reason: `Handles ${message.messageKind} '${message.name}'${suffix} published under namespace '${message.namespace}'.` }));
      }),
      confidence: 'medium'
    };
  });
}

export function c4Type(dependency) {
  return dependency.classification === 'internal' ? 'Container' : 'External System';
}

export function mergeDependencyGroup(id, members) {
  const first = members[0];
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const directions = unique(members.map((member) => member.direction));
  const technologies = unique(members.map((member) => member.technology));
  const clients = unique(members.map((member) => member.client));
  const authTypes = unique(members.map((member) => member.authentication?.type));
  return {
    ...first,
    id,
    direction: directions.length === 1 ? directions[0] : 'mixed',
    technology: technologies.join(' / ') || null,
    client: clients.join(' / ') || null,
    authentication: {
      type: authTypes.join(' / ') || null,
      configurationKeys: unique(members.flatMap((member) => member.authentication?.configurationKeys || []))
    },
    configurationKeys: unique(members.flatMap((member) => member.configurationKeys || [])),
    operations: members.flatMap((member) => member.operations || []),
    resources: members.flatMap((member) => member.resources || []),
    evidence: members.flatMap((member) => member.evidence || []),
    members
  };
}

export function usesRedis(dependency) {
  const haystack = [
    dependency.name, dependency.technology, dependency.client, dependency.kind,
    ...(dependency.configurationKeys || []),
    ...((dependency.resources || []).flatMap((resource) => [resource.type, resource.name, resource.kind]))
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes('redis');
}

// The `technology` field alone is often just "Entity Framework Core" (provider-agnostic), so
// unlike usesRedis this also searches evidence text, where the scanner tends to note the
// concrete database engine (e.g. "registered with SQL Server", "UseSqlServer").
export function usesSqlServer(dependency) {
  const haystack = [
    dependency.name, dependency.technology, dependency.client, dependency.kind,
    ...(dependency.configurationKeys || []),
    ...((dependency.resources || []).flatMap((resource) => [resource.type, resource.name, resource.kind])),
    ...((dependency.evidence || []).map((item) => item.reason))
  ].filter(Boolean).join(' ').toLowerCase();
  return /sql\s*server|sqlclient|mssql/.test(haystack);
}

// Matched on the dependency's own name rather than a broader haystack: a message-broker
// dependency literally named "Service Bus"/"NServiceBus"/etc. is a generic infrastructure
// reference, but one named for a specific event (e.g. "Learning Paused Events") that happens
// to use NServiceBus as its technology is a real, meaningful cross-service edge that must stay.
export function usesServiceBus(dependency) {
  if (dependency.kind !== 'message-broker') return false;
  return /^(azure\s+|microsoft\s+)?service\s*bus$|^nservicebus$/i.test((dependency.name || '').trim());
}

// Configuration stores, telemetry and identity providers: nearly every service has one of each, so
// they are shown on a repository's own dependency view but kept off the system-wide landscape, where
// they would become hubs joined to every system.
export const PLATFORM_KINDS = new Set(['configuration-store', 'telemetry', 'identity-provider']);

export function isPlatformDependency(dependency) {
  return PLATFORM_KINDS.has(dependency?.kind);
}

export function relationshipLabel(dependency) {
  const verb = dependency.description || (dependency.direction === 'inbound' ? 'Called by' : 'Calls');
  const kindLabel = dependency.kind === 'http-api' ? 'HTTP' : dependency.kind;
  const seen = new Set();
  const parts = [kindLabel, dependency.technology].filter(Boolean).filter((value) => {
    const key = value.toString().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return `${verb}${parts.length ? ` [${parts.join('/')}]` : ''}`;
}

export const LANDSCAPE_STOPWORDS = new Set(['das', 'sfa', 'api', 'apis', 'client', 'clients', 'service', 'services', 'http', 'https', 'httpclient', 'httphelper', 'httpservice', 'wrapper', 'outer', 'inner', 'the', 'a', 'an', 'i', 'v1', 'v2', 'v3']);

// Light stemming so word forms of one name agree, e.g. "Certificates" and "certification".
export function stemToken(word) {
  const base = word.length > 6 && word.endsWith('ion') ? word.slice(0, -3) : word;
  return base.length > 5 && base.endsWith('e') ? base.slice(0, -1) : base;
}

export function tokenize(value) {
  return splitPascalCase(String(value || ''))
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.toLowerCase())
    .map((word) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word))
    .filter((word) => word.length > 1 && !LANDSCAPE_STOPWORDS.has(word))
    .map(stemToken);
}

export function isSubset(small, big) {
  for (const token of small) if (!big.has(token)) return false;
  return true;
}

// Repo slugs often run words together ("das-findapprenticeship-api") where dependency names
// keep them apart ("Find Apprenticeship API"), so a token set also matches the joined form of
// any run of adjacent tokens.
export function expandTokens(tokens) {
  const list = [...tokens];
  const expanded = new Set(list);
  for (let start = 0; start < list.length; start++) {
    let joined = list[start];
    for (let end = start + 1; end < list.length; end++) {
      joined += list[end];
      expanded.add(joined);
      expanded.add(stemToken(joined));
    }
  }
  return expanded;
}

export function canRelate(a, b) {
  return a.size > 0 && b.size > 0 && (isSubset(a, expandTokens(b)) || isSubset(b, expandTokens(a)));
}

// When several catalogued systems relate to a name, pick the closest one. A system whose whole
// name appears in the dependency name wins, the longest such name first ("Provider Commitments"
// is das-providercommitments, not das-commitments); otherwise the system with the fewest words
// the dependency name doesn't mention ("Accounts" is das-employer-accounts, not
// das-apprentice-accounts-web). Ties keep manifest order.
export function bestMatchingSystem(tokens, candidates, tokensFor) {
  const expanded = expandTokens(tokens);
  let best = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const candidateTokens = tokensFor(candidate);
    if (!canRelate(tokens, candidateTokens)) continue;
    const extra = [...candidateTokens].filter((token) => !expanded.has(token));
    const score = extra.length ? -extra.length : 1000 + [...candidateTokens].join('').length;
    if (score > bestScore) { best = candidate; bestScore = score; }
  }
  return best;
}

export function edgeVerb(edge, isOutboundFromNode) {
  const isMessage = edge.kinds.includes('message') && !edge.kinds.includes('http-api');
  if (isOutboundFromNode) return isMessage ? 'Publishes to' : 'Calls';
  return isMessage ? 'Consumes from' : 'Called by';
}

export function edgeLabel(edge, isOutboundFromNode = true) {
  const technology = edge.technologies.join('/');
  const verb = edgeVerb(edge, isOutboundFromNode);
  const via = edge.via?.length ? ` via ${edge.via.join(', ')}` : '';
  return `${verb}${technology ? ` [${technology}]` : ''}${via}${edge.count > 1 ? ` ×${edge.count}` : ''}`;
}

// A dependency routed through a gateway area (dependency.via, written by an overlay such as dfe-overlay/) is drawn,
// with proxy on, as caller -> gateway area -> target instead of one caller -> target line labelled "via <gateway> (area)".
// Without an overlay no dependency has a via, so there is nothing to proxy and the toggle is not offered.
export function buildLandscape(sources, dependencySets, { proxy = false } = {}) {
  const systemTokenMap = new Map(sources.map((s) => [s.id, new Set(tokenize(s.name))]));
  const edgeMap = new Map();
  const gateways = new Map();
  const routedVia = dependencySets.flatMap(({ dependencies }) => dependencies).find((dependency) => dependency.via && !dependency.via.unresolved)?.via;
  const gatewayLabel = routedVia?.label || null;

  function addEdge(from, to, dependency, reference) {
    const key = `${from}|${to}`;
    if (!edgeMap.has(key)) edgeMap.set(key, { from, to, count: 0, operations: 0, technologies: new Set(), names: new Set(), kinds: new Set(), via: new Set(), references: [] });
    const edge = edgeMap.get(key);
    edge.count += 1;
    edge.operations += dependency.operations?.length || 0;
    const kindLabel = dependency.kind === 'http-api' ? 'HTTP' : dependency.kind;
    [kindLabel, dependency.technology].filter(Boolean).forEach((value) => edge.technologies.add(value));
    edge.names.add(dependency.name);
    if (dependency.kind) edge.kinds.add(dependency.kind);
    if (dependency.via) edge.via.add(`${dependency.via.label} (${dependency.via.area})`);
    if (reference) edge.references.push(reference);
  }

  function routeEdge(from, to, dependency, reference) {
    const via = dependency.via;
    if (!proxy || !via || via.unresolved) {
      addEdge(from, to, dependency, reference);
      return;
    }
    const areas = via.areas || String(via.area).split(', ');
    for (const area of areas) {
      const id = `gateway:${area}`;
      if (!gateways.has(id)) gateways.set(id, { id, name: `${via.label} ${area}`, area, label: via.label, repo: via.repo });
      addEdge(from, id, { name: `${via.label} ${area}`, kind: 'http-api', technology: null, operations: via.operations || [] }, reference);
      addEdge(id, to, { ...dependency, via: undefined }, reference);
    }
  }

  // Redis, SQL Server, and Service Bus are used by nearly every system and clutter the diagram
  // as their own external nodes with an edge from every system — instead of drawing them, just
  // flag the system itself so its own box can be marked (a colored outline) as using one.
  //
  // The same underlying dependency is sometimes scanned into more than one entry sharing a
  // `targetId` — one entry names the concrete technology, another is a weaker generic hit with
  // no technology mentioned. Pre-scan for which targetIds are confirmed for each flag so every
  // entry sharing one is treated the same way, instead of the weakly-evidenced duplicate
  // leaking through as its own external node.
  const INFRA_FLAGS = [
    { key: 'redis', test: usesRedis },
    { key: 'sqlServer', test: usesSqlServer },
    { key: 'serviceBus', test: usesServiceBus }
  ];
  const infraTargetIds = new Map(INFRA_FLAGS.map((flag) => [flag.key, new Map()]));
  for (const { source, dependencies } of dependencySets) {
    for (const dependency of dependencies) {
      if (!dependency.targetId) continue;
      for (const flag of INFRA_FLAGS) {
        if (!flag.test(dependency)) continue;
        const bySource = infraTargetIds.get(flag.key);
        if (!bySource.has(source.id)) bySource.set(source.id, new Set());
        bySource.get(source.id).add(dependency.targetId);
      }
    }
  }

  const infraSourceIds = new Map(INFRA_FLAGS.map((flag) => [flag.key, new Set()]));
  const externalEntries = [];
  for (const { source, dependencies } of dependencySets) {
    const ownTokens = systemTokenMap.get(source.id);
    for (const [dependencyIndex, dependency] of dependencies.entries()) {
      if (isPlatformDependency(dependency)) continue;
      const matchedFlag = INFRA_FLAGS.find((flag) => flag.test(dependency) || infraTargetIds.get(flag.key).get(source.id)?.has(dependency.targetId));
      if (matchedFlag) { infraSourceIds.get(matchedFlag.key).add(source.id); continue; }
      // Pinned by an overlay (e.g. dfe-overlay/resolve-dependencies.mjs); beats name matching.
      const pinnedSystem = dependency.targetRepo ? sources.find((candidate) => candidate.id === dependency.targetRepo) : null;
      const depTokens = new Set(tokenize(dependency.name));
      if (!pinnedSystem && canRelate(depTokens, ownTokens)) continue;
      const matchedSystem = pinnedSystem
        || bestMatchingSystem(depTokens, sources.filter((candidate) => candidate.id !== source.id), (candidate) => systemTokenMap.get(candidate.id));
      if (matchedSystem) {
        const [from, to] = dependency.direction === 'inbound' ? [`sys:${matchedSystem.id}`, `sys:${source.id}`] : [`sys:${source.id}`, `sys:${matchedSystem.id}`];
        routeEdge(from, to, dependency, { sourceId: source.id, dependencyIndex });
        continue;
      }
      if (depTokens.size === 0) continue;
      externalEntries.push({ source, dependency, dependencyIndex, tokens: depTokens });
    }
  }

  const parent = externalEntries.map((_, index) => index);
  const find = (i) => { while (parent[i] !== i) i = parent[i]; return i; };
  for (let i = 0; i < externalEntries.length; i++) {
    for (let j = i + 1; j < externalEntries.length; j++) {
      if (canRelate(externalEntries[i].tokens, externalEntries[j].tokens)) parent[find(i)] = find(j);
    }
  }

  const clusters = new Map();
  externalEntries.forEach((entry, index) => {
    const root = find(index);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(entry);
  });

  const externals = [];
  let extIndex = 0;
  for (const members of clusters.values()) {
    const id = `ext:${extIndex++}`;
    const name = members.reduce((best, member) => (member.dependency.name.length > best.length ? member.dependency.name : best), members[0].dependency.name);
    members.forEach((member) => {
      const [from, to] = member.dependency.direction === 'inbound' ? [id, `sys:${member.source.id}`] : [`sys:${member.source.id}`, id];
      routeEdge(from, to, member.dependency, { sourceId: member.source.id, dependencyIndex: member.dependencyIndex });
    });
    externals.push({ id, name, members });
  }

  const systems = sources.map((s) => ({
    id: `sys:${s.id}`, sourceId: s.id, name: s.name, repository: s.repository,
    isRedis: infraSourceIds.get('redis').has(s.id),
    isSqlServer: infraSourceIds.get('sqlServer').has(s.id),
    isServiceBus: infraSourceIds.get('serviceBus').has(s.id)
  }));
  const edges = [...edgeMap.values()].map((edge) => ({ ...edge, technologies: [...edge.technologies], names: [...edge.names], kinds: [...edge.kinds], via: [...edge.via] }));
  return { systems, externals, gateways: alphabetical([...gateways.values()], (gateway) => gateway.area), gatewayLabel, edges };
}
