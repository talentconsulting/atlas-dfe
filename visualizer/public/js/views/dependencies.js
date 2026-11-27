// A repository's Dependencies view: the diagram, PlantUML views and dependency details.
import { $, content, toolbar } from '../dom.js';
import { destroyCy, diagramControlsHtml, markCySelection, mountCy, positionFor, ringLayout, scrollDetailIntoView, wireDiagramControls, wireNodeHoverTooltip } from '../graph.js';
import { c4Type, isPlatformDependency, mergeDependencyGroup, PLATFORM_KINDS, relationshipLabel, usesRedis } from '../model.js';
import { encodePlantUml, pumlUrls } from '../plantuml.js';
import { state } from '../state.js';
import { alphabetical, escapeHtml, getText, githubFileUrl, orgName, sourceLink, splitPascalCase, titleCase } from '../util.js';
import { searchControl, wireSearch } from './source.js';

export function depViewToggleHtml() {
  return `<div class="segmented" role="group" aria-label="Dependency view">
    <button data-dep-view="diagram" aria-pressed="${state.depView === 'diagram'}">Diagram</button>
    <button data-dep-view="puml" aria-pressed="${state.depView === 'puml'}">PlantUML source</button>
    <button data-dep-view="puml-live" aria-pressed="${state.depView === 'puml-live'}">Live PlantUML</button>
  </div>`;
}

export function wireDepViewToggle() {
  document.querySelectorAll('[data-dep-view]').forEach((button) => {
    button.onclick = async () => {
      state.depView = button.dataset.depView;
      if (state.depView !== 'diagram' && state.pumlEncoded === null) {
        destroyCy();
        content.innerHTML = '<div class="loading">Loading PlantUML source…</div>';
        try {
          state.pumlSource = await getText(`/api/sources/${encodeURIComponent(state.source.id)}/dependency-diagram`);
          state.pumlEncoded = await encodePlantUml(state.pumlSource);
        } catch (error) {
          content.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
          return;
        }
      }
      renderDependencies(true);
    };
  });
}

export function pumlSourceView(source, encoded) {
  const { svg, edit } = pumlUrls(encoded);
  return `<div class="dependency-view">
    <p class="toolbar-meta">Generated C4 PlantUML source for this service. Rendering it sends this text to the public PlantUML server at plantuml.com — nothing is sent unless you open one of the links below.</p>
    <div class="puml-actions"><a class="plain-button" href="${svg}" target="_blank" rel="noopener noreferrer">Render diagram on plantuml.com ↗</a><a class="plain-button" href="${edit}" target="_blank" rel="noopener noreferrer">Open in PlantUML editor ↗</a></div>
    <pre class="puml-source"><code>${escapeHtml(source)}</code></pre>
  </div>`;
}

export function pumlLiveView(source, encoded) {
  const { svg, edit } = pumlUrls(encoded);
  return `<div class="dependency-view">
    <p class="toolbar-meta">Live C4 diagram rendered by the public PlantUML server at plantuml.com from the generated source below — the source is sent there automatically to produce this image.</p>
    <div class="puml-render-wrap">
      <a href="${svg}" target="_blank" rel="noopener noreferrer" title="Open full-size"><img class="puml-render" src="${svg}" alt="Live PlantUML C4 diagram for ${escapeHtml(titleCase(state.source.name))}" onerror="this.closest('.puml-render-wrap').classList.add('puml-render-error')"></a>
      <p class="puml-render-fallback muted">Couldn't reach the PlantUML server. <a class="plain-button" href="${edit}" target="_blank" rel="noopener noreferrer">Open in PlantUML editor ↗</a></p>
    </div>
    <details class="puml-source-details">
      <summary>View PlantUML source</summary>
      <pre class="puml-source"><code>${escapeHtml(source)}</code></pre>
    </details>
  </div>`;
}

export function renderDependencies(resetToolbar = true) {
  const hasDiagramSource = state.source.capabilities.dependencyDiagram;
  if (!state.depView) state.depView = 'diagram';
  if (resetToolbar && state.depView !== 'diagram') {
    toolbar.innerHTML = `${depViewToggleHtml()}`;
    wireDepViewToggle();
  }
  if (state.depView !== 'diagram') {
    destroyCy();
    const view = state.depView === 'puml-live' ? pumlLiveView : pumlSourceView;
    content.innerHTML = state.pumlSource ? view(state.pumlSource, state.pumlEncoded) : '<div class="empty-state"><h2>PlantUML diagram unavailable</h2></div>';
    return;
  }

  // Multi-container services (see the containers block below) report the same downstream
  // dependency once per container that calls it — e.g. six containers all reading the same
  // database yields six near-identical "Provider Commitments Database" entries. Group by
  // targetId (or kind+name when there's none, e.g. message-based entries) into one node per
  // real dependency, keeping every raw entry so a dedicated edge is still drawn from each
  // container that actually uses it.
  const rawDependencies = state.data.dependencies || [];
  const targetKeyFor = (dependency) => dependency.targetId || `${dependency.kind || 'dependency'}:${dependency.name}`;
  const dependencyGroups = new Map();
  rawDependencies.forEach((dependency) => {
    const key = targetKeyFor(dependency);
    if (!dependencyGroups.has(key)) dependencyGroups.set(key, []);
    dependencyGroups.get(key).push(dependency);
  });
  const dependencies = alphabetical([...dependencyGroups.entries()].map(([id, members]) => mergeDependencyGroup(id, members)));
  const operations = dependencies.reduce((sum, dependency) => sum + (dependency.operations?.length || 0), 0);
  const internalCount = dependencies.filter((dependency) => dependency.classification === 'internal').length;
  const messageCount = dependencies.filter((dependency) => dependency.kind === 'message').length;
  const redisCount = dependencies.filter(usesRedis).length;
  const platformCount = dependencies.filter(isPlatformDependency).length;
  if (resetToolbar) {
    toolbar.innerHTML = `${searchControl('Filter dependencies')}${hasDiagramSource ? depViewToggleHtml() : ''}${diagramControlsHtml()}<span class="spacer"></span><span class="toolbar-meta">${dependencies.length} dependencies · ${internalCount} internal · ${dependencies.length - internalCount} external · ${messageCount} message-based${redisCount ? ` · ${redisCount} using Redis` : ''}${platformCount ? ` · ${platformCount} platform` : ''} · ${operations} operations</span>`;
    if (hasDiagramSource) wireDepViewToggle();
  }
  const filtered = dependencies.filter((dependency) => `${dependency.name} ${dependency.kind} ${dependency.classification} ${dependency.direction} ${dependency.client} ${dependency.technology}`.toLowerCase().includes(state.filter));
  if (!dependencies.length) {
    content.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>No service dependencies recorded</h2><p>The generated dependency catalogue is empty.</p></div>';
    return;
  }
  if (!filtered.length) {
    content.innerHTML = '<div class="empty-state"><h2>No matching dependencies</h2><p>Try a different search term.</p></div>';
    wireSearch();
    return;
  }
  if (!state.selected || !filtered.some((item) => item.id === state.selected)) state.selected = filtered[0].id;
  const VIEW_W = 1400, VIEW_H = 800;
  const center = { x: VIEW_W / 2, y: VIEW_H / 2 };
  const nodeHalfW = 98, nodeHalfH = 48, pad = 26;

  // The commitments-style schema is the pattern being adopted for every service: a top-level
  // `containers` array plus `sourceId` on each dependency pointing at the container it came
  // from. Only that top-level array is used to draw the C4 boxes — older sources without it
  // fall back to a single node representing the whole service, as before. A multi-container
  // service needs its own ring, sized so the boxes don't overlap each other, and the
  // dependency ring around it pushed out so it clears that cluster.
  const topLevelContainers = state.data.containers || [];
  const hasContainers = topLevelContainers.length > 0;
  const containerBoxHalfW = 105, containerBoxHalfH = 49, containerGap = 40;
  const multiContainer = topLevelContainers.length > 1;
  const containerRadius = multiContainer
    ? Math.max(180, (containerBoxHalfW * 2 + containerGap) / (2 * Math.sin(Math.PI / topLevelContainers.length)))
    : 0;
  const containerClearance = multiContainer ? containerRadius + containerBoxHalfH + nodeHalfH + pad : 0;
  const internalRx = 270 + containerClearance, internalRy = 150 + containerClearance;
  const boundaryRx = internalRx + nodeHalfW + pad;
  const boundaryRy = internalRy + nodeHalfH + pad;
  const externalScale = 1.4;
  const internal = ringLayout(filtered.filter((d) => d.classification === 'internal'), center, internalRx, internalRy, 0);
  const external = ringLayout(filtered.filter((d) => d.classification !== 'internal'), center, boundaryRx * externalScale, boundaryRy * externalScale, Math.PI / 5);
  const nodes = [...internal, ...external];
  if (!state.diagramPositions) state.diagramPositions = new Map();
  const positions = state.diagramPositions;

  const containerNodes = hasContainers
    ? (multiContainer ? ringLayout(topLevelContainers, center, containerRadius, containerRadius, 0) : [{ ...topLevelContainers[0], x: center.x, y: center.y }])
    : [{ id: 'center', name: state.source.name, x: center.x, y: center.y }];
  const containerIds = new Set(containerNodes.map((node) => node.id));
  containerNodes.forEach((node) => positionFor(positions, node.id, node));
  nodes.forEach((node) => positionFor(positions, node.id, node));
  const containerIdFor = (dependency) => (containerIds.has(dependency.sourceId) ? dependency.sourceId : containerNodes[0].id);

  const orgLabel = orgName(state.data.repository);
  const elements = [
    { data: { id: 'boundary', label: orgLabel.toUpperCase() } },
    ...containerNodes.map((node) => ({
      data: {
        id: node.id, parent: 'boundary', isLeaf: true, isContainer: true, isSystem: !hasContainers,
        width: 210, height: 98, label: hasContainers ? titleCase(node.name) : titleCase(state.source.name),
        containerType: node.type
      },
      position: positions.get(node.id)
    })),
    ...nodes.map((node) => ({
      data: {
        id: node.id, isLeaf: true, width: 196, height: 96,
        ...(node.classification === 'internal' ? { parent: 'boundary' } : {}),
        kind: node.kind, classification: node.classification, name: node.name,
        technology: node.technology, opsCount: node.operations?.length || 0, isRedis: usesRedis(node)
      },
      position: positions.get(node.id)
    })),
    // One edge per original entry (per container that actually depends on it), not per merged
    // node — that's what shows the fan-in when several containers share the same dependency.
    ...nodes.flatMap((node) => node.members.map((member, memberIndex) => {
      const inbound = member.direction === 'inbound';
      const containerId = containerIdFor(member);
      return { data: { id: `edge-${node.id}-${memberIndex}`, source: inbound ? node.id : containerId, target: inbound ? containerId : node.id, label: relationshipLabel(member) }, classes: inbound ? 'inbound' : '' };
    }))
  ];

  content.innerHTML = `<div class="dependency-view">
    <div class="c4-legend">
      <span class="c4-legend-item"><span class="c4-swatch focus"></span>${hasContainers ? 'Container (this service)' : 'Software system (this service)'}</span>
      <span class="c4-legend-item"><span class="c4-swatch internal"></span>Container — internal</span>
      <span class="c4-legend-item"><span class="c4-swatch external"></span>External system</span>
      <span class="c4-legend-item"><span class="c4-swatch cache"></span>Uses Redis</span>
      <span class="c4-legend-item"><span class="c4-boundary-swatch"></span>${escapeHtml(orgLabel)} system boundary</span>
      <span class="c4-legend-item">Drag to rearrange · scroll to zoom · drag background to pan</span>
    </div>
    <div id="dep-cy" class="cy-container" role="group" aria-label="C4 container diagram for ${escapeHtml(titleCase(state.source.name))}"></div>
    <div id="dep-detail">${dependencyDetail(dependencies.find((item) => item.id === state.selected))}</div>
  </div>`;
  wireSearch();

  const cy = mountCy({
    container: $('#dep-cy'),
    elements,
    layout: { name: 'preset' },
    htmlLabels: [{
      query: 'node[?isLeaf]',
      halign: 'center', valign: 'center', halignBox: 'center', valignBox: 'center',
      tpl: (data) => {
        if (data.isContainer) {
          const typeLabel = data.isSystem ? 'Software System' : `Container${data.containerType ? ` · ${escapeHtml(titleCase(data.containerType))}` : ''}`;
          return `<div class="cy-node service-node" data-node-id="${escapeHtml(data.id)}"><span class="c4-type">${typeLabel}</span><strong>${escapeHtml(data.label)}</strong></div>`;
        }
        const nodeClass = data.isRedis ? 'cache' : (data.kind === 'message' ? 'message' : (PLATFORM_KINDS.has(data.kind) ? 'platform' : (data.classification === 'internal' ? 'internal' : 'external')));
        const typeLabel = PLATFORM_KINDS.has(data.kind) ? 'Platform' : (data.classification === 'internal' ? 'Container' : 'External System');
        const alreadyMentionsRedis = (data.technology || '').toLowerCase().includes('redis');
        return `<div class="cy-node ${nodeClass}" data-node-id="${escapeHtml(data.id)}"><span class="c4-type">${escapeHtml(typeLabel)}</span><strong>${escapeHtml(splitPascalCase(data.name))}</strong><span class="c4-meta">${escapeHtml(data.technology || data.kind || 'service')} · ${data.opsCount} op${data.opsCount === 1 ? '' : 's'}${data.isRedis && !alreadyMentionsRedis ? ' · Redis' : ''}</span></div>`;
      }
    }],
    onTapNode: (node) => {
      if (containerIds.has(node.id())) return;
      state.selected = node.id();
      markCySelection($('#dep-cy'), state.selected);
      $('#dep-detail').innerHTML = dependencyDetail(dependencies.find((item) => item.id === state.selected));
      scrollDetailIntoView('dep-detail');
    },
    onDragFree: (node) => { positions.set(node.id(), node.position()); }
  });
  markCySelection($('#dep-cy'), state.selected);
  wireDiagramControls(() => { positions.clear(); renderDependencies(false); });
  wireNodeHoverTooltip(cy, $('#dep-cy'), (node) => {
    if (node.id() === 'center') return null;
    const dependency = dependencies.find((item) => item.id === node.id());
    return dependency ? dependencyTooltipContent(dependency) : null;
  });
}

export function dependencyDetail(dependency, context = null) {
  const authentication = dependency.authentication || {};
  const scanKind = dependency.kind === 'message' ? 'eventcatalog' : 'service-dependencies';
  const facts = [
    dependency.description ? ['Relationship', dependency.description] : null,
    ['Type', c4Type(dependency)],
    ['Client', dependency.client],
    ['Technology', dependency.technology],
    ['Authentication', authentication.type],
    ['Confidence', dependency.confidence]
  ].filter(Boolean);
  return `<article class="dependency-detail">
    <p class="eyebrow">${escapeHtml(dependency.direction || 'Unknown')} dependency</p>
    <h2>${escapeHtml(dependency.name)}</h2>
    <div class="badges"><span class="badge blue">${escapeHtml(dependency.kind || 'service')}</span><span class="badge ${dependency.classification === 'unknown' ? 'amber' : ''}">${escapeHtml(dependency.classification || 'unknown')}</span>${usesRedis(dependency) ? '<span class="badge danger">Redis</span>' : ''}</div>
    <dl class="dependency-facts">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value || 'Not recorded')}</dd></div>`).join('')}</dl>
    <h3>Operations</h3>${dependencyOperations(dependency.operations || [], scanKind, context)}
    <h3>Configuration</h3>${dependencyKeys([...(dependency.configurationKeys || []), ...(authentication.configurationKeys || [])])}
    ${(dependency.resources || []).length ? `<h3>Resources</h3>${dependencyResources(dependency.resources)}` : ''}
    <h3>Evidence</h3>${dependencyEvidence(dependency.evidence || [], scanKind, context)}
  </article>`;
}

export function dependencyOperations(operations, scanKind = 'service-dependencies', context = null) {
  if (!operations.length) return '<p class="muted">No operations recorded.</p>';
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Method</th><th>Path</th><th>Source</th></tr></thead><tbody>${operations.map((operation) => `<tr><td><span class="method ${escapeHtml((operation.method || '').toLowerCase())}">${escapeHtml(operation.methodName || operation.method || '—')}</span></td><td><code>${escapeHtml(operation.path || 'Not resolved')}</code></td><td>${sourceLink(operation.sourceFile, scanKind, context)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function dependencyKeys(keys) {
  const unique = [...new Set(keys)].sort((a, b) => a.localeCompare(b));
  return unique.length ? `<ul class="code-list">${unique.map((key) => `<li><code>${escapeHtml(key)}</code></li>`).join('')}</ul>` : '<p class="muted">No configuration keys recorded.</p>';
}

export function dependencyResources(resources) {
  return `<table class="data-table"><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody>${resources.map((resource) => `<tr><td>${escapeHtml(resource.name || resource.path || 'Unnamed')}</td><td>${escapeHtml(resource.type || resource.kind || 'Not recorded')}</td></tr>`).join('')}</tbody></table>`;
}

export function dependencyEvidence(evidence, scanKind = 'service-dependencies', context = null) {
  if (!evidence.length) return '<p class="muted">No source evidence recorded.</p>';
  return `<ol class="evidence-list">${evidence.map((item) => `<li><p>${escapeHtml(item.reason || 'Dependency reference')}</p>${sourceLink(item.sourceFile, scanKind, context)}</li>`).join('')}</ol>`;
}

export function dependencyTooltipContent(dependency) {
  const ops = dependency.operations || [];
  const title = `<div class="node-tooltip-title">${escapeHtml(splitPascalCase(dependency.name))}${usesRedis(dependency) ? ' <span class="badge danger">Redis</span>' : ''}</div>`;
  const subtitle = dependency.description ? `<p class="node-tooltip-subtitle">${escapeHtml(dependency.description)}</p>` : '';
  if (!ops.length) return `${title}${subtitle}<p class="node-tooltip-empty">No operations recorded — click the box for full details.</p>`;
  const scanKind = dependency.kind === 'message' ? 'eventcatalog' : 'service-dependencies';
  const shown = ops.slice(0, 8);
  return `${title}${subtitle}<ul class="node-tooltip-list">${shown.map((operation) => {
    const url = githubFileUrl(operation.sourceFile, scanKind);
    const label = operation.path && operation.path !== 'Not resolved' ? operation.path : (operation.methodName || operation.method || 'operation');
    return `<li><span class="method ${escapeHtml((operation.method || '').toLowerCase())}">${escapeHtml(operation.methodName || operation.method || '—')}</span>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : `<span class="muted">${escapeHtml(label)}</span>`}</li>`;
  }).join('')}</ul>${ops.length > shown.length ? `<p class="node-tooltip-more">+${ops.length - shown.length} more — click the box for full details</p>` : ''}`;
}

export function messageNamesFor(dependency) {
  if (dependency?.kind !== 'message') return null;
  const names = (dependency.operations || []).map((operation) => operation.path).filter(Boolean);
  return [...new Set(names)];
}

export function dependencyDetailSuffix(dependency) {
  const messageNames = messageNamesFor(dependency);
  if (messageNames?.length) {
    const shown = messageNames.slice(0, 3);
    return shown.join(', ') + (messageNames.length > shown.length ? ` +${messageNames.length - shown.length} more` : '');
  }
  return dependency.technology || dependency.kind || dependency.name;
}
