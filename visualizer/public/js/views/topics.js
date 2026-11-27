// The Topics page: services grouped by GitHub topic.
import { $, content, toolbar } from '../dom.js';
import { destroyCy, diagramControlsHtml, markCySelection, mountCy, positionFor, ringLayout, scrollDetailIntoView, wireDiagramControls, wireNodeHoverTooltip } from '../graph.js';
import { edgeLabel } from '../model.js';
import { state } from '../state.js';
import { escapeHtml, titleCase } from '../util.js';
import { allLandscapeMessageNames, eventFilterControlHtml, fetchLandscapeGraph, landscapeForEvent, wireLandscapeRefToggles } from './landscape.js';
import { jumpToSource } from './source.js';

export const OTHER_TOPIC_ID = 'topic:__other';

export function setTopicsHero() {
  $('#mode-eyebrow').textContent = 'Architecture inventory';
  $('#source-title').textContent = 'Topics';
  $('#source-stats').innerHTML = '';
}

export async function loadTopics() {
  destroyCy();
  toolbar.innerHTML = '';
  content.innerHTML = '<div class="loading">Reading catalogue data…</div>';
  state.topicSelected = null;
  state.topicPositions = null;
  state.topicShowOther = true;
  state.topicEventFilter = '';
  try {
    state.topicsLandscape = await fetchLandscapeGraph();
    state.topicsBySource = state.landscapeTopicsBySource;
    // A topic every tagged repo shares (e.g. the org-wide one) would put every service in one box,
    // so it starts unticked; everything else starts ticked.
    const counts = topicCounts();
    const taggedCount = [...state.topicsBySource.values()].filter((topics) => topics.length).length;
    state.topicDefaultChecked = new Set([...counts.keys()].filter((topic) => taggedCount < 2 || counts.get(topic) < taggedCount));
    state.topicChecked = new Set(state.topicDefaultChecked);
    renderTopics();
  } catch (error) {
    content.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

export function topicCounts() {
  const counts = new Map();
  state.topicsBySource.forEach((topics) => topics.forEach((topic) => counts.set(topic, (counts.get(topic) || 0) + 1)));
  return new Map([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

// Groups the landscape's catalogued systems by their ticked topics and rolls the system-to-system
// relationships up between topics. A service with several ticked topics sits in each of them, so
// one service relationship can feed more than one topic relationship. External systems are left
// out — topics only describe catalogued repositories.
export function buildTopicGraph(landscape, topicsBySource, checked, showOther) {
  const topicsFor = new Map(landscape.systems.map((system) => {
    const topics = (topicsBySource.get(system.sourceId) || []).filter((topic) => checked.has(topic)).map((topic) => `topic:${topic}`);
    return [system.id, topics.length ? topics : (showOther ? [OTHER_TOPIC_ID] : [])];
  }));
  const nodes = new Map();
  landscape.systems.forEach((system) => topicsFor.get(system.id).forEach((id) => {
    if (!nodes.has(id)) nodes.set(id, { id, name: id === OTHER_TOPIC_ID ? 'Other services' : id.slice('topic:'.length), isOther: id === OTHER_TOPIC_ID, services: [], internal: [] });
    nodes.get(id).services.push(system);
  }));

  const edgeMap = new Map();
  landscape.edges.filter((edge) => topicsFor.has(edge.from) && topicsFor.has(edge.to)).forEach((edge) => {
    topicsFor.get(edge.from).forEach((from) => topicsFor.get(edge.to).forEach((to) => {
      if (from === to) { nodes.get(from).internal.push(edge); return; }
      const key = `${from}|${to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, { from, to, count: 0, technologies: new Set(), kinds: new Set(), serviceEdges: [] });
      const topicEdge = edgeMap.get(key);
      topicEdge.count += 1;
      edge.technologies.forEach((value) => topicEdge.technologies.add(value));
      edge.kinds.forEach((value) => topicEdge.kinds.add(value));
      topicEdge.serviceEdges.push(edge);
    }));
  });

  const sortedNodes = [...nodes.values()].sort((a, b) => Number(a.isOther) - Number(b.isOther) || a.name.localeCompare(b.name));
  sortedNodes.forEach((node) => node.services.sort((a, b) => a.name.localeCompare(b.name)));
  const edges = [...edgeMap.values()].map((edge) => ({ ...edge, technologies: [...edge.technologies], kinds: [...edge.kinds] }));
  return { nodes: sortedNodes, edges };
}

export function systemName(id) {
  const system = state.topicsLandscape.systems.find((item) => item.id === id);
  return system ? titleCase(system.name) : 'Unknown';
}

export function topicNodeName(graph, id) {
  return graph.nodes.find((node) => node.id === id)?.name || 'Unknown';
}

export function servicePairRows(serviceEdges) {
  return serviceEdges.map((edge) => `<tr>
    <td><button class="as-link" type="button" data-jump="${escapeHtml(edge.from.slice('sys:'.length))}">${escapeHtml(systemName(edge.from))}</button></td>
    <td>${escapeHtml(edgeLabel(edge))}</td>
    <td><button class="as-link" type="button" data-jump="${escapeHtml(edge.to.slice('sys:'.length))}">${escapeHtml(systemName(edge.to))}</button></td>
  </tr>`).join('');
}

export function servicePairTable(serviceEdges) {
  return `<table class="data-table"><thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead><tbody>${servicePairRows(serviceEdges)}</tbody></table>`;
}

export function topicDetail(graph, selected) {
  if (!selected) return '';
  if (selected.startsWith('edge:')) {
    const edge = graph.edges[Number(selected.slice('edge:'.length))];
    if (!edge) return '';
    return `<article class="dependency-detail">
      <p class="eyebrow">Topic relationship</p>
      <h2>${escapeHtml(topicNodeName(graph, edge.from))} → ${escapeHtml(topicNodeName(graph, edge.to))}</h2>
      <p class="detail-subtitle">${edge.count} service relationship(s) between services tagged with these topics.</p>
      ${servicePairTable(edge.serviceEdges)}
    </article>`;
  }
  const node = graph.nodes.find((item) => item.id === selected);
  if (!node) return '';
  const relationshipRows = (list, otherKey, isOutbound, groupKey) => list.map((edge, index) => {
    const rowId = `${groupKey}-${index}`;
    return `<tr><td>${escapeHtml(topicNodeName(graph, edge[otherKey]))}</td><td>${escapeHtml(edgeLabel(edge, isOutbound))}</td><td><button class="as-link" type="button" data-toggle-land-ref="${rowId}">${edge.count} service pair(s) ▾</button></td></tr>
      <tr class="land-ref-detail-row" data-land-ref="${rowId}" hidden><td colspan="3"><div class="landscape-edge-detail">${servicePairTable(edge.serviceEdges)}</div></td></tr>`;
  }).join('');
  const outbound = graph.edges.filter((edge) => edge.from === node.id);
  const inbound = graph.edges.filter((edge) => edge.to === node.id);
  return `<article class="dependency-detail">
    <p class="eyebrow">${node.isOther ? 'Ungrouped services' : 'Topic'}</p>
    <h2>${escapeHtml(node.name)}</h2>
    <p class="detail-subtitle">${node.isOther ? 'Services that carry none of the ticked topics.' : `${node.services.length} service(s) tagged with this GitHub topic.`}</p>
    <h3>Services</h3>
    <div class="badges">${node.services.map((service) => `<button class="badge blue as-link" type="button" data-jump="${escapeHtml(service.sourceId)}">${escapeHtml(titleCase(service.name))}</button>`).join('')}</div>
    <h3>Calls out to</h3>${outbound.length ? `<table class="data-table"><thead><tr><th>Topic</th><th>Relationship</th><th>Services</th></tr></thead><tbody>${relationshipRows(outbound, 'to', true, 'topic-out')}</tbody></table>` : '<p class="muted">No outbound relationships to other topics.</p>'}
    <h3>Called by</h3>${inbound.length ? `<table class="data-table"><thead><tr><th>Topic</th><th>Relationship</th><th>Services</th></tr></thead><tbody>${relationshipRows(inbound, 'from', false, 'topic-in')}</tbody></table>` : '<p class="muted">No inbound relationships from other topics.</p>'}
    <h3>Within this topic</h3>${node.internal.length ? servicePairTable(node.internal) : '<p class="muted">No relationships between services in this topic.</p>'}
  </article>`;
}

export function topicTooltipContent(node) {
  const shown = node.services.slice(0, 8);
  return `<div class="node-tooltip-title">${escapeHtml(node.name)}</div><ul class="node-tooltip-list">${shown.map((service) => `<li><span>${escapeHtml(titleCase(service.name))}</span></li>`).join('')}</ul>${node.services.length > shown.length ? `<p class="node-tooltip-more">+${node.services.length - shown.length} more — click the box for full details</p>` : ''}`;
}

export function wireTopicDetail() {
  document.querySelectorAll('#topic-detail [data-jump]').forEach((button) => { button.onclick = () => jumpToSource(button.dataset.jump); });
  wireLandscapeRefToggles();
}

export function renderTopics() {
  const counts = topicCounts();
  if (!counts.size) {
    destroyCy();
    $('#source-stats').innerHTML = '';
    content.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>No topic data available</h2><p>Run the fetch-repo-topics job to publish each repository\'s GitHub topics.</p></div>';
    return;
  }
  const eventNames = allLandscapeMessageNames(state.topicsLandscape);
  if (state.topicEventFilter && !eventNames.includes(state.topicEventFilter)) state.topicEventFilter = '';
  const eventFilter = state.topicEventFilter;
  const landscape = landscapeForEvent(state.topicsLandscape, eventFilter);
  const graph = buildTopicGraph(landscape, state.topicsBySource, state.topicChecked, state.topicShowOther);
  const crossCount = graph.edges.reduce((sum, edge) => sum + edge.count, 0);
  $('#source-stats').innerHTML = `
    <div class="stat"><dt>Topics shown</dt><dd>${graph.nodes.filter((node) => !node.isOther).length}/${counts.size}</dd></div>
    <div class="stat"><dt>Services</dt><dd>${landscape.systems.length}</dd></div>
    <div class="stat"><dt>Cross-topic links</dt><dd>${crossCount}</dd></div>`;
  toolbar.innerHTML = `${diagramControlsHtml()}${eventNames.length ? eventFilterControlHtml(eventNames, eventFilter) : ''}<span class="spacer"></span><span class="toolbar-meta">Services grouped by GitHub topic, with the landscape's service-to-service relationships rolled up between topics. A service with several topics appears in each.${eventFilter ? ` · Showing only services that publish or consume “${escapeHtml(eventFilter)}”` : ''}</span>`;
  const eventFilterSelect = $('#landscape-event-filter');
  if (eventFilterSelect) {
    eventFilterSelect.onchange = (event) => {
      // Like the landscape: picking an event resets the checklist to the topics of its publishers
      // and handlers (minus any unticked by default, such as the org-wide topic); "All" restores
      // the defaults.
      state.topicEventFilter = event.target.value;
      const participants = landscapeForEvent(state.topicsLandscape, state.topicEventFilter).systems;
      state.topicChecked = state.topicEventFilter
        ? new Set(participants.flatMap((system) => state.topicsBySource.get(system.sourceId) || []).filter((topic) => state.topicDefaultChecked.has(topic)))
        : new Set(state.topicDefaultChecked);
      state.topicSelected = null;
      state.topicPositions = null;
      renderTopics();
    };
  }

  const checklistHtml = `<aside class="landscape-checklist" aria-label="Topics to show">
    <div class="checklist-controls">
      <button id="topics-select-all" type="button" class="plain-button">Select all</button>
      <button id="topics-deselect-all" type="button" class="plain-button">Deselect all</button>
    </div>
    <div class="checklist-group">
      <h4>Topics <span class="count">${state.topicChecked.size}/${counts.size}</span></h4>
      <ul class="checklist">${[...counts.entries()].map(([topic, count]) => `
        <li><label><input type="checkbox" data-topic-toggle="${escapeHtml(topic)}" ${state.topicChecked.has(topic) ? 'checked' : ''}><span>${escapeHtml(topic)} <span class="muted">(${count})</span></span></label></li>`).join('')}</ul>
    </div>
    <div class="checklist-group">
      <ul class="checklist"><li><label><input type="checkbox" id="topics-show-other" ${state.topicShowOther ? 'checked' : ''}><span>Show services with none of the ticked topics</span></label></li></ul>
    </div>
  </aside>`;

  if (!graph.nodes.length) {
    destroyCy();
    const emptyMessage = eventFilter
      ? `<h2>Nothing selected</h2><p>Tick at least one topic on the left, or choose a different event/command to reset the selection.</p>`
      : '<h2>Nothing selected</h2><p>Tick at least one topic on the left to see it on the diagram.</p>';
    content.innerHTML = `<div class="landscape-layout">${checklistHtml}<div class="empty-state">${emptyMessage}</div></div>`;
    wireTopicChecklist(counts);
    return;
  }
  if (!state.topicSelected || !(graph.nodes.some((node) => node.id === state.topicSelected) || (state.topicSelected.startsWith('edge:') && graph.edges[Number(state.topicSelected.slice(5))]))) {
    state.topicSelected = graph.nodes[0].id;
  }

  const VIEW_W = 1440, VIEW_H = 880;
  if (!state.topicPositions) state.topicPositions = new Map();
  const positions = state.topicPositions;
  ringLayout(graph.nodes, { x: VIEW_W / 2, y: VIEW_H / 2 }, 520, 330, 0).forEach((node) => positionFor(positions, node.id, node));
  const elements = [
    ...graph.nodes.map((node) => ({
      data: { id: node.id, isLeaf: true, width: 210, height: 98, name: node.name, isOther: node.isOther, serviceCount: node.services.length, internalCount: node.internal.length },
      position: positions.get(node.id)
    })),
    ...graph.edges.map((edge, index) => ({ data: { id: `topic-edge-${index}`, source: edge.from, target: edge.to, label: edgeLabel(edge), edgeIndex: index }, classes: 'jumpable' }))
  ];

  content.innerHTML = `<div class="landscape-layout">
    ${checklistHtml}
    <div class="dependency-view">
      <div class="c4-legend">
        <span class="c4-legend-item"><span class="c4-swatch internal"></span>GitHub topic</span>
        <span class="c4-legend-item"><span class="c4-swatch external"></span>Services with none of the ticked topics</span>
        <span class="c4-legend-item">Click a box or a relationship line for the services behind it</span>
      </div>
      <div id="topic-cy" class="cy-container" role="group" aria-label="Topic relationship diagram"></div>
      <div id="topic-detail">${topicDetail(graph, state.topicSelected)}</div>
    </div>
  </div>`;

  const showDetail = () => {
    markCySelection($('#topic-cy'), state.topicSelected);
    $('#topic-detail').innerHTML = topicDetail(graph, state.topicSelected);
    wireTopicDetail();
    scrollDetailIntoView('topic-detail');
  };
  const cy = mountCy({
    container: $('#topic-cy'),
    elements,
    layout: { name: 'preset' },
    htmlLabels: [{
      query: 'node[?isLeaf]',
      halign: 'center', valign: 'center', halignBox: 'center', valignBox: 'center',
      tpl: (data) => `<div class="cy-node ${data.isOther ? 'external' : 'internal'}" data-node-id="${escapeHtml(data.id)}"><span class="c4-type">${data.isOther ? 'Ungrouped' : 'Topic'}</span><strong>${escapeHtml(data.name)}</strong><span class="c4-meta">${data.serviceCount} service(s)${data.internalCount ? ` · ${data.internalCount} internal link(s)` : ''}</span></div>`
    }],
    onTapNode: (node) => { state.topicSelected = node.id(); showDetail(); },
    onTapEdge: (edge) => { state.topicSelected = `edge:${edge.data('edgeIndex')}`; showDetail(); },
    onDragFree: (node) => { positions.set(node.id(), node.position()); }
  });
  cy.fit(undefined, 40);
  markCySelection($('#topic-cy'), state.topicSelected);
  wireNodeHoverTooltip(cy, $('#topic-cy'), (node) => {
    const item = graph.nodes.find((candidate) => candidate.id === node.id());
    return item ? topicTooltipContent(item) : null;
  });
  wireTopicDetail();
  wireDiagramControls(() => { positions.clear(); renderTopics(); });
  wireTopicChecklist(counts);
}

export function wireTopicChecklist(counts) {
  document.querySelectorAll('[data-topic-toggle]').forEach((checkbox) => {
    checkbox.onchange = () => {
      const topic = checkbox.dataset.topicToggle;
      if (checkbox.checked) state.topicChecked.add(topic); else state.topicChecked.delete(topic);
      renderTopics();
    };
  });
  const showOther = $('#topics-show-other');
  if (showOther) showOther.onchange = () => { state.topicShowOther = showOther.checked; renderTopics(); };
  const selectAll = $('#topics-select-all');
  if (selectAll) selectAll.onclick = () => { state.topicChecked = new Set(counts.keys()); renderTopics(); };
  const deselectAll = $('#topics-deselect-all');
  if (deselectAll) deselectAll.onclick = () => { state.topicChecked = new Set(); renderTopics(); };
}
