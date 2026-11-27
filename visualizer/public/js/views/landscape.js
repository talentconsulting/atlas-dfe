// The System landscape page.
import { $, content, toolbar } from '../dom.js';
import { destroyCy, diagramControlsHtml, markCySelection, mountCy, positionFor, ringLayout, scrollDetailIntoView, wireDiagramControls, wireNodeHoverTooltip } from '../graph.js';
import { addQueueMessageDependencies, buildLandscape, combineDependencies, edgeLabel, edgeVerb } from '../model.js';
import { state } from '../state.js';
import { alphabetical, escapeHtml, getJson, orgFromRepoUrl, splitPascalCase, titleCase } from '../util.js';
import { dependencyDetail, dependencyDetailSuffix, messageNamesFor } from './dependencies.js';
import { jumpToSource } from './source.js';

export function setLandscapeHero() {
  $('#mode-eyebrow').textContent = 'Architecture inventory';
  $('#source-title').textContent = 'System landscape';
  $('#source-stats').innerHTML = '';
}

// Shared by the landscape and topics pages: every source's dependencies, matched into one graph,
// from a single request. Also keeps each source's topics for the topics page.
export async function fetchLandscapeGraph() {
  const { sources } = await getJson('/api/landscape');
  const byId = new Map(sources.map((entry) => [entry.id, entry]));
  state.landscapeTopicsBySource = new Map(sources.filter((entry) => entry.topics).map((entry) => [entry.id, entry.topics]));
  // A gateway an overlay routes through (e.g. DfE's APIM) is drawn as proxy areas or edge labels, not as a system.
  const landscapeCatalog = state.catalog.filter((source) => !byId.get(source.id)?.dependencies?.hideInLandscape);
  state.landscapeSources = landscapeCatalog.map((source) => {
    const entry = byId.get(source.id);
    const data = combineDependencies(source, entry?.dependencies, entry?.messages);
    return data.dependencies?.length ? { source, ref: data.ref, dependencies: data.dependencies } : null;
  }).filter(Boolean);
  addQueueMessageDependencies(state.landscapeSources, (sourceId) => byId.get(sourceId)?.messages);
  state.landscapeInputs = [landscapeCatalog, state.landscapeSources];
  return buildLandscape(landscapeCatalog, state.landscapeSources);
}

export async function loadLandscape() {
  destroyCy();
  toolbar.innerHTML = '';
  content.innerHTML = '<div class="loading">Reading catalogue data…</div>';
  state.selected = null;
  state.landscapePositions = null;
  state.landscapeChecked = null;
  state.landscapeEventFilter = '';
  state.landscapeHighlights = new Set();   // "Uses …" filters; none ticked shows every system
  if (state.landscapeProxy === undefined) state.landscapeProxy = true;   // draw gateway areas as proxies when an overlay provides them
  try {
    await fetchLandscapeGraph();
    state.landscape = buildLandscape(...state.landscapeInputs, { proxy: state.landscapeProxy });
    renderLandscape();
  } catch (error) {
    content.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

export function landscapeChecklistGroup(title, nodes, formatLabel) {
  const checkedCount = nodes.filter((node) => state.landscapeChecked.has(node.id)).length;
  return `<div class="checklist-group">
    <h4>${escapeHtml(title)} <span class="count">${checkedCount}/${nodes.length}</span></h4>
    <ul class="checklist">${alphabetical(nodes, (node) => formatLabel(node.name)).map((node) => `
      <li><label><input type="checkbox" data-landscape-toggle="${escapeHtml(node.id)}" ${state.landscapeChecked.has(node.id) ? 'checked' : ''}><span>${escapeHtml(formatLabel(node.name))}</span></label></li>`).join('') || '<li class="muted">None recorded.</li>'}</ul>
  </div>`;
}

export function allLandscapeMessageNames(graph) {
  const names = new Set();
  graph.edges.forEach((edge) => {
    (edge.references || []).forEach((reference) => {
      const resolved = resolveLandscapeReference(reference);
      (messageNamesFor(resolved?.dependency) || []).forEach((name) => names.add(name));
    });
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function eventFilterControlHtml(eventNames, selected) {
  return `<label class="source-picker" for="landscape-event-filter"><span>Event/command</span><select id="landscape-event-filter"><option value="">All</option>${eventNames.map((name) => `<option value="${escapeHtml(name)}" ${selected === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></label>`;
}

export function edgeMatchesEventFilter(edge, eventFilter) {
  if (!eventFilter) return true;
  return (edge.references || []).some((reference) => {
    const resolved = resolveLandscapeReference(reference);
    return (messageNamesFor(resolved?.dependency) || []).includes(eventFilter);
  });
}

// Nodes at either end of a relationship that carries the event/command, i.e. its publishers and handlers.
export function eventParticipantIds(graph, eventFilter) {
  return new Set(graph.edges.filter((edge) => edgeMatchesEventFilter(edge, eventFilter)).flatMap((edge) => [edge.from, edge.to]));
}

export function filterMembersByEvent(members, eventFilter) {
  if (!eventFilter) return members;
  return members.filter((member) => (messageNamesFor(member.dependency) || []).includes(eventFilter));
}

export function landscapeHighlightLegendItem(key, swatchClass, label) {
  const checked = state.landscapeHighlights.has(key);
  return `<label class="c4-legend-item toggleable"><input type="checkbox" data-landscape-highlight="${escapeHtml(key)}" ${checked ? 'checked' : ''}><span class="c4-swatch ${swatchClass}"></span>${escapeHtml(label)}</label>`;
}

export function wireLandscapeProxyToggle() {
  const toggle = $('#landscape-proxy');
  if (!toggle) return;
  toggle.onchange = () => {
    state.landscapeProxy = toggle.checked;
    state.landscape = buildLandscape(...state.landscapeInputs, { proxy: state.landscapeProxy });
    state.landscapeChecked = null;     // the set of nodes changed; start with everything shown again
    state.landscapePositions = null;
    renderLandscape();
  };
}

export function wireLandscapeHighlightToggles() {
  document.querySelectorAll('[data-landscape-highlight]').forEach((checkbox) => {
    checkbox.onchange = () => {
      const key = checkbox.dataset.landscapeHighlight;
      if (checkbox.checked) state.landscapeHighlights.add(key); else state.landscapeHighlights.delete(key);
      renderLandscape();
    };
  });
}

export function renderLandscape() {
  const graph = state.landscape;
  const gatewayNodes = graph.gateways || [];
  const allNodes = [...graph.systems, ...gatewayNodes, ...graph.externals];
  const redisSystemCount = graph.systems.filter((node) => node.isRedis).length;
  const sqlServerSystemCount = graph.systems.filter((node) => node.isSqlServer).length;
  const serviceBusSystemCount = graph.systems.filter((node) => node.isServiceBus).length;
  const eventNames = allLandscapeMessageNames(graph);
  if (state.landscapeEventFilter && !eventNames.includes(state.landscapeEventFilter)) state.landscapeEventFilter = '';
  const eventFilter = state.landscapeEventFilter || '';
  const edgeMatchesFilter = (edge) => edgeMatchesEventFilter(edge, eventFilter);

  $('#source-stats').innerHTML = `
    <div class="stat"><dt>Systems</dt><dd>${graph.systems.length}</dd></div>
    ${gatewayNodes.length ? `<div class="stat"><dt>${escapeHtml(graph.gatewayLabel)} areas</dt><dd>${gatewayNodes.length}</dd></div>` : ''}
    <div class="stat"><dt>External</dt><dd>${graph.externals.length}</dd></div>
    <div class="stat"><dt>Relationships</dt><dd>${graph.edges.length}</dd></div>`;
  toolbar.innerHTML = `${diagramControlsHtml()}${eventNames.length ? eventFilterControlHtml(eventNames, eventFilter) : ''}<span class="spacer"></span><span class="toolbar-meta">Inferred by matching each repository's outbound service dependencies and handled events/commands against the catalogue, clustering the rest as external systems${redisSystemCount ? ` · ${redisSystemCount} using Redis` : ''}${sqlServerSystemCount ? ` · ${sqlServerSystemCount} using SQL Server` : ''}${serviceBusSystemCount ? ` · ${serviceBusSystemCount} using Service Bus` : ''}${eventFilter ? ` · Showing only containers that publish or consume “${escapeHtml(eventFilter)}”` : ''}</span>`;
  const eventFilterSelect = $('#landscape-event-filter');
  if (eventFilterSelect) {
    eventFilterSelect.onchange = (event) => {
      // Picking an event resets the checklist to just its publishers and handlers (still editable
      // afterwards); going back to "All" restores everything.
      state.landscapeEventFilter = event.target.value;
      state.landscapeChecked = state.landscapeEventFilter
        ? eventParticipantIds(graph, state.landscapeEventFilter)
        : new Set(allNodes.map((node) => node.id));
      renderLandscape();
    };
  }
  if (!allNodes.length) {
    destroyCy();
    content.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>No dependency data available</h2><p>None of the cataloged repositories publish service-dependencies data.</p></div>';
    return;
  }
  if (!state.landscapeChecked) state.landscapeChecked = new Set(allNodes.map((node) => node.id));
  // Ticking "Uses Redis/SQL Server/Service Bus" keeps only systems using at least one ticked technology, plus the
  // external systems they connect to. The checklist on the left still applies on top.
  const usage = { redis: 'isRedis', sqlServer: 'isSqlServer', serviceBus: 'isServiceBus' };
  const usageKeys = [...state.landscapeHighlights];
  const passesUsage = new Set(graph.systems
    .filter((node) => !usageKeys.length || usageKeys.some((key) => node[usage[key]]))
    .map((node) => node.id));
  if (usageKeys.length) {
    const nonSystems = new Set([...graph.externals, ...gatewayNodes].map((node) => node.id));
    for (let pass = 0; pass < 2; pass++) {   // a kept system's gateway areas, then what those areas reach
      graph.edges.forEach((edge) => {
        if (passesUsage.has(edge.from) && nonSystems.has(edge.to)) passesUsage.add(edge.to);
        if (passesUsage.has(edge.to) && nonSystems.has(edge.from)) passesUsage.add(edge.from);
      });
    }
  } else {
    [...graph.externals, ...gatewayNodes].forEach((node) => passesUsage.add(node.id));
  }
  const isNodeVisible = (node) => state.landscapeChecked.has(node.id) && passesUsage.has(node.id);
  const visibleNodes = allNodes.filter(isNodeVisible);
  if (!state.selected || !visibleNodes.some((node) => node.id === state.selected)) state.selected = visibleNodes[0]?.id || null;

  const checklistHtml = `<aside class="landscape-checklist" aria-label="Services to show">
    <div class="checklist-controls">
      <button id="landscape-select-all" type="button" class="plain-button">Select all</button>
      <button id="landscape-deselect-all" type="button" class="plain-button">Deselect all</button>
    </div>
    ${landscapeChecklistGroup('Systems', graph.systems, titleCase)}
    ${gatewayNodes.length ? landscapeChecklistGroup(`${graph.gatewayLabel} areas`, gatewayNodes, (name) => name) : ''}
    ${landscapeChecklistGroup('External systems', graph.externals, splitPascalCase)}
  </aside>`;

  const usageFiltersHtml = `${landscapeHighlightLegendItem('redis', 'cache-outline', 'Uses Redis')}
        ${landscapeHighlightLegendItem('sqlServer', 'sql-outline', 'Uses SQL Server')}
        ${landscapeHighlightLegendItem('serviceBus', 'service-outline', 'Uses Service Bus')}`;

  if (!visibleNodes.length) {
    destroyCy();
    const emptyMessage = usageKeys.length
      ? '<h2>No matching systems</h2><p>None of the checked systems use the ticked technology. Untick a "Uses …" filter or check more services.</p>'
      : eventFilter
        ? `<h2>Nothing selected</h2><p>Check at least one service on the left, or choose a different event/command to reset the selection.</p>`
        : '<h2>Nothing selected</h2><p>Check at least one service on the left to see it on the diagram.</p>';
    // Keep the "Uses …" filters on screen so a filter that hides everything can be unticked.
    content.innerHTML = `<div class="landscape-layout">${checklistHtml}<div class="dependency-view"><div class="c4-legend">${usageFiltersHtml}</div><div class="empty-state">${emptyMessage}</div></div></div>`;
    wireLandscapeChecklist(allNodes);
    wireLandscapeHighlightToggles();
    return;
  }

  const VIEW_W = 1440, VIEW_H = 880;
  const center = { x: VIEW_W / 2, y: VIEW_H / 2 };
  const nodeHalfW = 98, nodeHalfH = 48, pad = 26;
  const systemsRx = 300, systemsRy = 190;
  const boundaryRx = systemsRx + nodeHalfW + pad;
  const boundaryRy = systemsRy + nodeHalfH + pad;
  // With gateway areas drawn, they take their own ring just outside the systems (still inside the boundary) and the
  // external systems move further out.
  const gatewayScale = 1.3;
  const externalScale = gatewayNodes.length ? 1.85 : 1.4;
  const systemNodes = ringLayout(graph.systems, center, systemsRx, systemsRy, 0).filter(isNodeVisible);
  const externalNodes = ringLayout(graph.externals, center, boundaryRx * externalScale, boundaryRy * externalScale, graph.externals.length ? Math.PI / graph.externals.length : 0).filter(isNodeVisible);
  const gatewayRing = ringLayout(gatewayNodes, center, boundaryRx * gatewayScale, boundaryRy * gatewayScale, gatewayNodes.length ? Math.PI / gatewayNodes.length : 0).filter(isNodeVisible);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = graph.edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to) && edgeMatchesFilter(edge));
  if (!state.landscapePositions) state.landscapePositions = new Map();
  const positions = state.landscapePositions;
  [...systemNodes, ...gatewayRing, ...externalNodes].forEach((node) => positionFor(positions, node.id, node));
  const orgLabel = orgFromRepoUrl(graph.systems[0]?.repository);

  const elements = [
    { data: { id: 'boundary', label: orgLabel.toUpperCase() } },
    ...systemNodes.map((node) => ({
      data: { id: node.id, parent: 'boundary', isLeaf: true, width: 210, height: 98, name: node.name, relCount: visibleEdges.filter((edge) => edge.from === node.id || edge.to === node.id).length, isRedis: node.isRedis, isSqlServer: node.isSqlServer, isServiceBus: node.isServiceBus },
      position: positions.get(node.id)
    })),
    ...gatewayRing.map((node) => ({
      data: { id: node.id, parent: 'boundary', isLeaf: true, isGateway: true, width: 170, height: 78, name: node.name, area: node.area, gatewayLabel: node.label,
              relCount: visibleEdges.filter((edge) => edge.from === node.id || edge.to === node.id).length },
      position: positions.get(node.id)
    })),
    ...externalNodes.map((node) => {
      const memberCount = filterMembersByEvent(node.members, eventFilter).length;
      return {
        data: { id: node.id, isLeaf: true, width: 196, height: 96, name: node.name, memberCount },
        position: positions.get(node.id)
      };
    }),
    ...visibleEdges.map((edge, index) => {
      const reference = edge.references[0];
      return { data: { id: `land-edge-${index}`, source: edge.from, target: edge.to, label: edgeLabel(edge), jumpSourceId: reference?.sourceId || '', jumpIndex: reference?.dependencyIndex ?? '' }, classes: reference ? 'jumpable' : '' };
    })
  ];

  content.innerHTML = `<div class="landscape-layout">
    ${checklistHtml}
    <div class="dependency-view">
      <div class="c4-legend">
        <span class="c4-legend-item"><span class="c4-swatch internal"></span>Software system (cataloged)</span>
        <span class="c4-legend-item"><span class="c4-swatch external"></span>External system</span>
        ${graph.gatewayLabel ? `<label class="c4-legend-item toggleable"><input type="checkbox" id="landscape-proxy" ${state.landscapeProxy ? 'checked' : ''}><span class="c4-swatch gateway"></span>Show ${escapeHtml(graph.gatewayLabel)} as a proxy</label>` : ''}
        ${usageFiltersHtml}
        <span class="c4-legend-item"><span class="c4-boundary-swatch"></span>${escapeHtml(orgLabel)} system boundary</span>
        <span class="c4-legend-item">Click a relationship line to open its dependency</span>
      </div>
      <div id="land-cy" class="cy-container" role="group" aria-label="C4 system landscape diagram"></div>
      <div id="land-detail">${landscapeDetail(allNodes.find((node) => node.id === state.selected), graph)}</div>
    </div>
  </div>`;

  const cy = mountCy({
    container: $('#land-cy'),
    elements,
    layout: { name: 'preset' },
    htmlLabels: [{
      query: 'node[?isLeaf]',
      halign: 'center', valign: 'center', halignBox: 'center', valignBox: 'center',
      tpl: (data) => {
        if (data.isGateway) {
          return `<div class="cy-node gateway" data-node-id="${escapeHtml(data.id)}"><span class="c4-type">${escapeHtml(data.gatewayLabel)} area · proxy</span><strong>${escapeHtml(data.area)}</strong><span class="c4-meta">${data.relCount} relationship(s)</span></div>`;
        }
        if (data.parent === 'boundary') {
          const showRedis = data.isRedis && state.landscapeHighlights.has('redis');
          const showSql = data.isSqlServer && state.landscapeHighlights.has('sqlServer');
          const showServiceBus = data.isServiceBus && state.landscapeHighlights.has('serviceBus');
          const modifierClass = [showRedis ? 'uses-redis' : '', showSql ? 'uses-sql' : '', showServiceBus ? 'uses-servicebus' : ''].filter(Boolean).join(' ');
          const modifierMeta = [showRedis ? 'Redis' : '', showSql ? 'SQL Server' : '', showServiceBus ? 'Service Bus' : ''].filter(Boolean).join(', ');
          return `<div class="cy-node internal${modifierClass ? ` ${modifierClass}` : ''}" data-node-id="${escapeHtml(data.id)}"><span class="c4-type">Software System</span><strong>${escapeHtml(titleCase(data.name))}</strong><span class="c4-meta">${data.relCount} relationship(s)${modifierMeta ? ` · ${modifierMeta}` : ''}</span></div>`;
        }
        return `<div class="cy-node external" data-node-id="${escapeHtml(data.id)}"><span class="c4-type">External System</span><strong>${escapeHtml(splitPascalCase(data.name))}</strong><span class="c4-meta">${data.memberCount} reference(s)</span></div>`;
      }
    }],
    onTapNode: (node) => {
      state.selected = node.id();
      markCySelection($('#land-cy'), state.selected);
      $('#land-detail').innerHTML = landscapeDetail(allNodes.find((item) => item.id === state.selected), graph);
      document.querySelectorAll('#land-detail [data-jump]').forEach((button) => { button.onclick = () => jumpToSource(button.dataset.jump); });
      wireLandscapeRefToggles();
      scrollDetailIntoView('land-detail');
    },
    onTapEdge: (edge) => {
      const sourceId = edge.data('jumpSourceId');
      if (sourceId) jumpToSource(sourceId, edge.data('jumpIndex'));
    },
    onDragFree: (node) => { positions.set(node.id(), node.position()); }
  });
  markCySelection($('#land-cy'), state.selected);
  wireNodeHoverTooltip(cy, $('#land-cy'), (node) => {
    const item = allNodes.find((candidate) => candidate.id === node.id());
    return item ? landscapeTooltipContent(item, graph) : null;
  });
  document.querySelectorAll('[data-jump]').forEach((button) => { button.onclick = () => jumpToSource(button.dataset.jump); });
  wireLandscapeRefToggles();
  wireDiagramControls(() => { positions.clear(); renderLandscape(); });
  wireLandscapeChecklist(allNodes);
  wireLandscapeHighlightToggles();
  wireLandscapeProxyToggle();
}

export function wireLandscapeChecklist(allNodes) {
  document.querySelectorAll('[data-landscape-toggle]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const id = checkbox.dataset.landscapeToggle;
      if (checkbox.checked) {
        // Checking a system brings in everything it has a relationship with, in either direction,
        // so it can be seen in context; unchecking still removes only that one system.
        state.landscapeChecked.add(id);
        (state.landscape?.edges || []).forEach((edge) => {
          if (edge.from === id) state.landscapeChecked.add(edge.to);
          if (edge.to === id) state.landscapeChecked.add(edge.from);
        });
      } else {
        state.landscapeChecked.delete(id);
      }
      renderLandscape();
    });
  });
  const selectAll = $('#landscape-select-all');
  if (selectAll) selectAll.onclick = () => { state.landscapeChecked = new Set(allNodes.map((node) => node.id)); renderLandscape(); };
  const deselectAll = $('#landscape-deselect-all');
  if (deselectAll) deselectAll.onclick = () => { state.landscapeChecked = new Set(); renderLandscape(); };
}

export function contextForSource(sourceId) {
  const entry = (state.landscapeSources || []).find((item) => item.source.id === sourceId);
  if (!entry) return null;
  return { repository: entry.source.repository, ref: entry.ref, scans: entry.source.scans };
}

export function resolveLandscapeReference(reference) {
  if (!reference) return null;
  const entry = (state.landscapeSources || []).find((item) => item.source.id === reference.sourceId);
  const dependency = entry?.dependencies?.[reference.dependencyIndex];
  return dependency ? { dependency, context: contextForSource(reference.sourceId) } : null;
}

export function landscapeRefDetailRow(rowId, items, colspan) {
  if (!items.length) return '';
  return `<tr class="land-ref-detail-row" data-land-ref="${escapeHtml(rowId)}" hidden><td colspan="${colspan}"><div class="landscape-edge-detail">${items.map((item) => dependencyDetail(item.dependency, item.context)).join('')}</div></td></tr>`;
}

export function wireLandscapeRefToggles() {
  document.querySelectorAll('[data-toggle-land-ref]').forEach((button) => {
    button.addEventListener('click', () => {
      const row = document.querySelector(`[data-land-ref="${button.dataset.toggleLandRef}"]`);
      if (row) row.hidden = !row.hidden;
    });
  });
}

export function landscapeDetail(node, graph) {
  if (!node) return '';
  const isGateway = node.id.startsWith('gateway:');
  const isSystem = node.id.startsWith('sys:') || isGateway;
  const eventFilter = state.landscapeEventFilter || '';
  const lookup = (id) => graph.systems.find((item) => item.id === id) || (graph.gateways || []).find((item) => item.id === id) || graph.externals.find((item) => item.id === id);
  if (isSystem) {
    const outbound = graph.edges.filter((edge) => edge.from === node.id && edgeMatchesEventFilter(edge, eventFilter));
    const inbound = graph.edges.filter((edge) => edge.to === node.id && edgeMatchesEventFilter(edge, eventFilter));
    const rows = (list, otherKey, groupKey, isOutbound) => list.map((edge, index) => {
      const other = lookup(edge[otherKey]);
      const resolved = (edge.references || []).map(resolveLandscapeReference).filter(Boolean);
      const rowId = `${groupKey}-${index}`;
      const dependenciesCell = resolved.length
        ? `<button class="as-link" type="button" data-toggle-land-ref="${rowId}">${edge.names.length} dependenc${edge.names.length === 1 ? 'y' : 'ies'} ▾</button>`
        : `${edge.names.length} dependenc${edge.names.length === 1 ? 'y' : 'ies'}`;
      return `<tr><td>${escapeHtml(other ? titleCase(other.name) : 'Unknown')}</td><td>${escapeHtml(edgeLabel(edge, isOutbound))}</td><td>${dependenciesCell}</td></tr>${landscapeRefDetailRow(rowId, resolved, 3)}`;
    }).join('');
    return `<article class="dependency-detail">
      <p class="eyebrow">${isGateway ? `${escapeHtml(node.label)} area (proxy)` : 'Software system'}</p>
      <h2>${escapeHtml(isGateway ? node.area : titleCase(node.name))}</h2>
      <p class="detail-subtitle">${isGateway ? `The ${escapeHtml(node.area)} area of ${escapeHtml(node.repo || node.label)}: calls these APIs and sends these messages for the services that call it.` : escapeHtml((node.repository || '').replace('https://github.com/', 'github.com/'))}</p>
      ${isGateway ? '' : `<div class="badges"><button class="badge blue as-link" type="button" data-jump="${escapeHtml(node.sourceId)}">View full dependencies →</button></div>`}
      <h3>${isGateway ? 'Reaches' : 'Calls out to'}</h3>${outbound.length ? `<table class="data-table"><thead><tr><th>Target</th><th>Relationship</th><th>Dependencies</th></tr></thead><tbody>${rows(outbound, 'to', 'out', true)}</tbody></table>` : '<p class="muted">No outbound relationships recorded.</p>'}
      <h3>Called by</h3>${inbound.length ? `<table class="data-table"><thead><tr><th>Source</th><th>Relationship</th><th>Dependencies</th></tr></thead><tbody>${rows(inbound, 'from', 'in', false)}</tbody></table>` : '<p class="muted">No inbound relationships recorded.</p>'}
    </article>`;
  }
  const members = filterMembersByEvent(node.members, eventFilter);
  return `<article class="dependency-detail">
    <p class="eyebrow">External system</p>
    <h2>${escapeHtml(splitPascalCase(node.name))}</h2>
    <p class="detail-subtitle">Not present in the catalogue — inferred from dependency names that didn't match a cataloged repository.</p>
    <h3>Referenced by</h3>
    ${members.length ? `<table class="data-table"><thead><tr><th>Source</th><th>Dependency</th><th>Technology</th><th>Confidence</th></tr></thead><tbody>${members.map((member, index) => `<tr>
      <td><button class="as-link" type="button" data-jump="${escapeHtml(member.source.id)}">${escapeHtml(titleCase(member.source.name))}</button></td>
      <td><button class="as-link" type="button" data-toggle-land-ref="ext-${index}">${escapeHtml(member.dependency.name)} ▾</button></td>
      <td>${escapeHtml(member.dependency.technology || member.dependency.kind || '—')}</td>
      <td>${escapeHtml(member.dependency.confidence || '—')}</td>
    </tr>${landscapeRefDetailRow(`ext-${index}`, [{ dependency: member.dependency, context: contextForSource(member.source.id) }], 4)}`).join('')}</tbody></table>` : '<p class="muted">No matching references.</p>'}
  </article>`;
}

// The landscape narrowed to one event/command: only the services that publish or handle it and
// only the relationships that carry it.
export function landscapeForEvent(landscape, eventFilter) {
  if (!eventFilter) return landscape;
  const participants = eventParticipantIds(landscape, eventFilter);
  return {
    ...landscape,
    systems: landscape.systems.filter((system) => participants.has(system.id)),
    edges: landscape.edges.filter((edge) => edgeMatchesEventFilter(edge, eventFilter))
  };
}

export function edgeDetailSuffix(edge) {
  const isMessage = edge.kinds.includes('message') && !edge.kinds.includes('http-api');
  if (isMessage) {
    const resolved = (edge.references || []).map(resolveLandscapeReference).filter(Boolean);
    const messageNames = [...new Set(resolved.flatMap((item) => messageNamesFor(item.dependency) || []))];
    if (messageNames.length) {
      const shown = messageNames.slice(0, 3);
      return shown.join(', ') + (messageNames.length > shown.length ? ` +${messageNames.length - shown.length} more` : '');
    }
  }
  return edge.technologies.join('/');
}

export function landscapeTooltipContent(node, graph) {
  const isGateway = node.id.startsWith('gateway:');
  const isSystem = node.id.startsWith('sys:') || isGateway;
  const eventFilter = state.landscapeEventFilter || '';
  const lookup = (id) => graph.systems.find((item) => item.id === id) || (graph.gateways || []).find((item) => item.id === id) || graph.externals.find((item) => item.id === id);
  if (isSystem) {
    const title = `<div class="node-tooltip-title">${escapeHtml(titleCase(node.name))}${node.isRedis ? ' <span class="badge danger">Redis</span>' : ''}${node.isSqlServer ? ' <span class="badge success">SQL Server</span>' : ''}${node.isServiceBus ? ' <span class="badge amber">Service Bus</span>' : ''}</div>`;
    const rows = [
      ...graph.edges.filter((edge) => edge.from === node.id && edgeMatchesEventFilter(edge, eventFilter)).map((edge) => ({ verb: edgeVerb(edge, true), other: lookup(edge.to), edge })),
      ...graph.edges.filter((edge) => edge.to === node.id && edgeMatchesEventFilter(edge, eventFilter)).map((edge) => ({ verb: edgeVerb(edge, false), other: lookup(edge.from), edge }))
    ];
    if (!rows.length) return `${title}<p class="node-tooltip-empty">No relationships recorded — click the box for full details.</p>`;
    const shown = rows.slice(0, 8);
    return `${title}<ul class="node-tooltip-list">${shown.map(({ verb, other, edge }) => {
      const detail = edgeDetailSuffix(edge);
      return `<li><span class="method">${escapeHtml(verb)}</span><span>${escapeHtml(other ? titleCase(other.name) : 'Unknown')}${detail ? ` <span class="muted">[${escapeHtml(detail)}]</span>` : ''}</span></li>`;
    }).join('')}</ul>${rows.length > shown.length ? `<p class="node-tooltip-more">+${rows.length - shown.length} more — click the box for full details</p>` : ''}`;
  }
  const title = `<div class="node-tooltip-title">${escapeHtml(splitPascalCase(node.name))}</div>`;
  const members = filterMembersByEvent(node.members || [], eventFilter);
  if (!members.length) return `${title}<p class="node-tooltip-empty">No references recorded — click the box for full details.</p>`;
  const shown = members.slice(0, 8);
  return `${title}<ul class="node-tooltip-list">${shown.map((member) => `<li><span>${escapeHtml(titleCase(member.source.name))}</span><span class="muted">${escapeHtml(dependencyDetailSuffix(member.dependency))}</span></li>`).join('')}</ul>${members.length > shown.length ? `<p class="node-tooltip-more">+${members.length - shown.length} more — click the box for full details</p>` : ''}`;
}
