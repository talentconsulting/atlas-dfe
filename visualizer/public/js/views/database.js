// A repository's Data schema view: the relationship diagram, the grid and table details.
import { $, content, toolbar } from '../dom.js';
import { destroyCy, diagramControlsHtml, markCySelection, mountCy, positionFor, scrollDetailIntoView, wireDiagramControls } from '../graph.js';
import { state } from '../state.js';
import { alphabetical, escapeHtml, tableLabel } from '../util.js';
import { searchControl, wireSearch } from './source.js';
import { renderTestData } from './testdata.js';

export function renderDatabase(resetToolbar = true) {
  const tables = state.data.tables || [];
  const relations = tables.reduce((sum, table) => sum + (table.relationships?.length || 0), 0);
  const columnCount = tables.reduce((sum, table) => sum + (table.columns?.length || 0), 0);
  if (!state.dbView) state.dbView = 'diagram';
  if (resetToolbar) {
    toolbar.innerHTML = `${state.dbView === 'testdata' ? '' : searchControl('Filter tables or columns')}<div class="segmented" role="group" aria-label="Schema view"><button data-db-view="diagram" aria-pressed="${state.dbView === 'diagram'}">Diagram</button><button data-db-view="grid" aria-pressed="${state.dbView === 'grid'}">Grid</button><button data-db-view="testdata" aria-pressed="${state.dbView === 'testdata'}">Test data</button></div>${state.dbView === 'diagram' ? diagramControlsHtml() : ''}<span class="spacer"></span><span class="toolbar-meta">${tables.length} tables · ${columnCount} columns · ${relations} relationships</span>`;
    document.querySelectorAll('[data-db-view]').forEach((button) => { button.onclick = () => { state.dbView = button.dataset.dbView; state.filter = ''; state.selected = null; renderDatabase(true); }; });
  }
  const filtered = tables.filter((table) => `${table.schema || ''} ${table.name} ${table.columns?.map((column) => column.name).join(' ')}`.toLowerCase().includes(state.filter));
  if (state.dbView === 'testdata') {
    destroyCy();
    renderTestData(tables);
    return;
  }
  if (state.dbView === 'diagram') {
    const { edges, isolatedCount } = databaseGraph(tables);
    renderDatabaseDiagram(filtered, edges, isolatedCount);
  } else {
    destroyCy();
    renderDatabaseGrid(filtered, tables);
  }
  wireSearch();
}

export function renderDatabaseGrid(filtered, tables) {
  content.innerHTML = `<div class="schema-grid">${alphabetical(filtered, tableLabel).map((table) => {
    const outbound = table.relationships || [];
    return `<button class="schema-card" type="button" data-table="${escapeHtml(table.name)}">
      <h2>${escapeHtml(tableLabel(table))}</h2>
      <p>${table.columns?.length || 0} columns · ${table.indexes?.length || 0} indexes</p>
      <ul class="relation-list">${outbound.slice(0, 3).map((rel) => `<li>→ <strong>${escapeHtml(rel.targetTable)}</strong> via ${escapeHtml(rel.fromColumns?.join(', '))}</li>`).join('')}${outbound.length > 3 ? `<li>+ ${outbound.length - 3} more</li>` : ''}</ul>
    </button>`;
  }).join('')}</div>`;
  if (!filtered.length) content.innerHTML = '<div class="empty-state"><h2>No matching tables</h2><p>Try a different search term.</p></div>';
  document.querySelectorAll('[data-table]').forEach((button) => button.addEventListener('click', () => renderTableDetail(tables.find((table) => table.name === button.dataset.table))));
}

export function databaseGraph(tables) {
  const edges = [];
  tables.forEach((table) => {
    (table.relationships || []).forEach((rel) => {
      edges.push({ from: table.name, to: rel.targetTable, fromColumns: rel.fromColumns || [], targetColumns: rel.targetColumns || [], name: rel.name });
    });
  });
  const connectedNames = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
  const knownNames = new Set(tables.map((table) => table.name));
  const isolatedCount = tables.filter((table) => !connectedNames.has(table.name)).length;
  return { edges: edges.filter((edge) => knownNames.has(edge.from) && knownNames.has(edge.to)), isolatedCount };
}

export function orderTablesForLayout(tables, edges) {
  const byName = new Map(tables.map((table) => [table.name, table]));
  const adjacency = new Map(tables.map((table) => [table.name, new Set()]));
  edges.forEach((edge) => { adjacency.get(edge.from)?.add(edge.to); adjacency.get(edge.to)?.add(edge.from); });
  const degree = (name) => adjacency.get(name)?.size || 0;
  const remaining = new Set(tables.map((table) => table.name));
  const order = [];
  while (remaining.size) {
    const start = [...remaining].sort((a, b) => degree(b) - degree(a))[0];
    const queue = [start];
    remaining.delete(start);
    while (queue.length) {
      const current = queue.shift();
      order.push(byName.get(current));
      const neighbors = [...(adjacency.get(current) || [])].filter((name) => remaining.has(name)).sort((a, b) => degree(b) - degree(a));
      neighbors.forEach((name) => { remaining.delete(name); queue.push(name); });
    }
  }
  return order;
}

export function tableRelLabel(edge) {
  const from = edge.fromColumns.join(',');
  const to = edge.targetColumns.join(',');
  return from && to ? `${from} → ${to}` : (edge.name || 'FK');
}

export function erNode(table) {
  const height = 48 + Math.max(1, table.columns?.length || 0) * 24;
  return { ...table, id: table.name, width: 274, height };
}

export function layoutErNodes(nodes, edges, viewWidth) {
  const byName = new Map(nodes.map((node) => [node.name, node]));
  const children = new Map(nodes.map((node) => [node.name, []]));
  const incoming = new Map(nodes.map((node) => [node.name, 0]));
  edges.forEach((edge) => {
    if (!byName.has(edge.from) || !byName.has(edge.to) || edge.from === edge.to) return;
    children.get(edge.to).push(edge.from);
    incoming.set(edge.from, incoming.get(edge.from) + 1);
  });
  const levels = new Map(nodes.map((node) => [node.name, 0]));
  const remaining = new Set(nodes.map((node) => node.name));
  const queue = [...nodes].filter((node) => incoming.get(node.name) === 0).map((node) => node.name).sort();
  while (remaining.size) {
    if (!queue.length) queue.push([...remaining].sort()[0]); // Gracefully place cyclic foreign keys.
    const name = queue.shift();
    if (!remaining.delete(name)) continue;
    children.get(name).forEach((child) => {
      levels.set(child, Math.max(levels.get(child), levels.get(name) + 1));
      incoming.set(child, incoming.get(child) - 1);
      if (incoming.get(child) <= 0) queue.push(child);
    });
    queue.sort();
  }
  const linked = new Set(edges.filter((edge) => byName.has(edge.from) && byName.has(edge.to) && edge.from !== edge.to).flatMap((edge) => [edge.from, edge.to]));
  const rows = new Map();
  nodes.filter((node) => linked.has(node.name)).forEach((node) => {
    const level = levels.get(node.name);
    if (!rows.has(level)) rows.set(level, []);
    rows.get(level).push(node);
  });
  // Tables with no relationships go in wrapped rows below the connected ones.
  const isolated = nodes.filter((node) => !linked.has(node.name)).sort((a, b) => a.name.localeCompare(b.name));
  const perRow = Math.max(1, Math.floor(viewWidth / 340));
  const nextLevel = rows.size ? Math.max(...rows.keys()) + 1 : 0;
  for (let index = 0; index < isolated.length; index += perRow) rows.set(nextLevel + index / perRow, isolated.slice(index, index + perRow));
  const positions = new Map();
  const rowEntries = [...rows.entries()].sort(([a], [b]) => a - b);
  let y = 80;
  rowEntries.forEach(([, row]) => {
    row.sort((a, b) => a.name.localeCompare(b.name));
    const rowHeight = Math.max(...row.map((node) => node.height));
    row.forEach((node, index) => positions.set(node.name, {
      x: (index + 0.5) * viewWidth / row.length,
      y: y + rowHeight / 2
    }));
    y += rowHeight + 180;
  });
  return nodes.map((node) => ({ ...node, ...positions.get(node.name) }));
}

export function renderDatabaseDiagram(filtered, allEdges, isolatedCount) {
  const edges = allEdges.filter((edge) => filtered.some((table) => table.name === edge.from) && filtered.some((table) => table.name === edge.to));
  if (!filtered.length) {
    destroyCy();
    content.innerHTML = '<div class="empty-state"><h2>No matching tables</h2><p>Try a different search term.</p></div>';
    return;
  }
  const ordered = orderTablesForLayout(filtered, edges);
  const nodes = ordered.map(erNode);
  const levelEstimate = Math.max(2, Math.ceil(Math.sqrt(nodes.length)));
  const viewWidth = Math.max(1100, levelEstimate * 380);
  const positioned = layoutErNodes(nodes, edges, viewWidth);
  if (!state.schemaPositions) state.schemaPositions = new Map();
  const positions = state.schemaPositions;
  positioned.forEach((node) => positionFor(positions, node.name, node));
  if (!state.selected || !filtered.some((table) => table.name === state.selected)) state.selected = positioned[0]?.name || null;
  const selectedTable = filtered.find((table) => table.name === state.selected);

  const elements = [
    ...positioned.map((node) => {
      const foreignKeys = new Set((node.relationships || []).flatMap((relationship) => relationship.fromColumns || []));
      return {
        data: {
          id: node.name, isLeaf: true, width: node.width, height: node.height, schema: node.schema, name: node.name,
          columns: (node.columns || []).map((column) => ({ name: column.name, type: column.type || '', flag: column.primaryKey ? 'PK' : (foreignKeys.has(column.name) ? 'FK' : '') }))
        },
        position: positions.get(node.name)
      };
    }),
    ...edges.map((edge, index) => ({ data: { id: `schema-edge-${index}`, source: edge.from, target: edge.to, label: tableRelLabel(edge) } }))
  ];

  content.innerHTML = `<div class="dependency-view">
    ${isolatedCount ? `<p class="toolbar-meta">${allEdges.length ? `${isolatedCount} table${isolatedCount === 1 ? '' : 's'} with no foreign keys, shown below the related tables.` : 'No foreign keys recorded between these tables.'}</p>` : ''}
    <div id="erd-cy" class="cy-container" role="group" aria-label="Database relationship diagram"></div>
    <div id="erd-detail">${selectedTable ? tableDetailInline(selectedTable) : ''}</div>
  </div>`;

  mountCy({
    container: $('#erd-cy'),
    elements,
    layout: { name: 'preset' },
    htmlLabels: [{
      query: 'node[?isLeaf]',
      halign: 'center', valign: 'center', halignBox: 'center', valignBox: 'center',
      tpl: (data) => `<div class="cy-er-node" data-node-id="${escapeHtml(data.id)}">
        <span class="er-table">${data.schema ? `<span>${escapeHtml(data.schema)}</span>` : ''}${escapeHtml(data.name)}</span>
        <span class="er-columns">${(data.columns || []).map((column) => `<span class="er-column"><b>${escapeHtml(column.flag)}</b><code>${escapeHtml(column.name)}</code><em>${escapeHtml(column.type)}</em></span>`).join('') || '<span class="er-column muted">No columns recorded</span>'}</span>
      </div>`
    }],
    onTapNode: (node) => {
      state.selected = node.id();
      markCySelection($('#erd-cy'), state.selected);
      $('#erd-detail').innerHTML = tableDetailInline(filtered.find((table) => table.name === state.selected));
      scrollDetailIntoView('erd-detail');
    },
    onDragFree: (node) => { positions.set(node.id(), node.position()); }
  });
  markCySelection($('#erd-cy'), state.selected);
  wireDiagramControls(() => { positions.clear(); renderDatabase(false); });
}

export function tableDetailInline(table) {
  return `<article class="dependency-detail">${tableDetailBody(table)}</article>`;
}

export function renderTableDetail(table) {
  toolbar.innerHTML = '<button id="back" class="plain-button" type="button">← All tables</button><span class="spacer"></span><button id="make-test-data" class="plain-button" type="button">Create test data</button>';
  content.innerHTML = `<article class="detail standalone">${tableDetailBody(table)}</article>`;
  $('#back').addEventListener('click', () => { state.filter = ''; renderDatabase(true); });
  $('#make-test-data').addEventListener('click', () => { state.testData = { ...(state.testData || {}), table: table.name }; state.dbView = 'testdata'; state.filter = ''; renderDatabase(true); });
}

// ---- Test data: pick a table, see what else it needs, and get an INSERT script of made-up rows ----

export const TABLE_TABS = ['columns', 'relationships', 'indexes'];

// Columns, relationships and indexes sit behind tabs so a wide table doesn't push the other two
// sections a long way down the page. The chosen tab carries over as you move between tables.
export function tableDetailBody(table) {
  const outbound = table.relationships || [];
  const incoming = (state.data.tables || []).flatMap((candidate) => (candidate.relationships || [])
    .filter((relation) => relation.targetTable === table.name)
    .map((relation) => ({ ...relation, fromTable: candidate.name })));
  const indexes = table.indexes || [];
  const sections = {
    columns: { label: 'Columns', count: table.columns.length, html: columnsTable(table.columns) },
    relationships: { label: 'Relationships', count: outbound.length + incoming.length, html: relationshipsTable(outbound, incoming) },
    indexes: { label: 'Indexes', count: indexes.length, html: indexesTable(indexes) }
  };
  const active = TABLE_TABS.includes(state.tableTab) ? state.tableTab : 'columns';
  const id = (key) => `table-${key}`;
  return `${table.schema ? `<p class="eyebrow">${escapeHtml(table.schema)} schema</p>` : ''}<h2>${escapeHtml(table.name)}</h2>
    <div class="table-tabs" role="tablist" aria-label="Table details">${TABLE_TABS.map((key) => `<button class="tab" type="button" role="tab" id="${id(key)}-tab" aria-controls="${id(key)}-panel" aria-selected="${key === active}" tabindex="${key === active ? 0 : -1}" data-table-tab="${key}">${sections[key].label}<span class="count">${sections[key].count}</span></button>`).join('')}</div>
    ${TABLE_TABS.map((key) => `<section class="table-tab-panel" role="tabpanel" id="${id(key)}-panel" aria-labelledby="${id(key)}-tab"${key === active ? '' : ' hidden'}>${sections[key].html}</section>`).join('')}`;
}

export function selectTableTab(tablist, key, focus) {
  state.tableTab = key;
  tablist.querySelectorAll('[data-table-tab]').forEach((tab) => {
    const selected = tab.dataset.tableTab === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
}

export function columnsTable(columns) {
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Nullable</th><th>Properties</th></tr></thead><tbody>${columns.map((column) => `<tr><td><code>${escapeHtml(column.name)}</code></td><td>${escapeHtml(column.type)}</td><td>${column.nullable ? 'Yes' : 'No'}</td><td>${[column.primaryKey && 'Primary key', column.generated && 'Generated', column.default && `Default: ${column.default}`].filter(Boolean).map((label) => `<span class="badge">${escapeHtml(label)}</span>`).join(' ') || '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}

export function relationshipsTable(outbound, incoming) {
  const rows = [
    ...outbound.map((rel) => [rel.fromColumns?.join(', '), '→', rel.targetTable, rel.targetColumns?.join(', '), rel.name]),
    ...incoming.map((rel) => [rel.targetColumns?.join(', '), '←', rel.fromTable, rel.fromColumns?.join(', '), rel.name])
  ];
  if (!rows.length) return '<p class="muted">No relationships recorded.</p>';
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Local columns</th><th></th><th>Related table</th><th>Related columns</th><th>Constraint</th></tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td${index === 1 ? ' class="muted"' : ''}>${escapeHtml(cell || '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export function indexesTable(indexes) {
  if (!indexes.length) return '<p class="muted">No indexes recorded.</p>';
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Columns</th><th>Type</th><th>Unique</th></tr></thead><tbody>${indexes.map((index) => `<tr><td>${escapeHtml(index.name)}</td><td><code>${escapeHtml(index.columns?.join(', '))}</code></td><td>${escapeHtml(index.type)}</td><td>${index.unique ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table></div>`;
}
