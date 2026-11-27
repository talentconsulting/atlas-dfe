// A repository's Journeys view: pages, transitions and named user journeys.
import { $, content, toolbar } from '../dom.js';
import { destroyCy, markCySelection, mountCy, scrollDetailIntoView } from '../graph.js';
import { state } from '../state.js';
import { alphabetical, escapeHtml, githubFileUrl } from '../util.js';
import { searchControl, wireSearch } from './source.js';

export function journeyPageLabel(page) {
  return page.id.includes('/') ? page.id.split('/').pop() : page.id.split('.').pop();
}

export function journeyEvidenceLink(evidence) {
  const index = evidence.lastIndexOf(':');
  const path = evidence.slice(0, index);
  const line = evidence.slice(index + 1);
  const url = githubFileUrl(path, 'user-journeys');
  const label = `<code>${escapeHtml(path.split('/').pop())}:${escapeHtml(line)}</code>`;
  return url ? `<a class="source-link" href="${escapeHtml(`${url}#L${line}`)}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true"> ↗</span></a>` : label;
}

export function journeyPageDetail(pageId) {
  const data = state.data;
  const page = (data.pages || []).find((item) => item.id === pageId);
  if (!page) return '';
  const pages = new Map(data.pages.map((item) => [item.id, item]));
  const signIn = page.requiresAuthentication === true ? '<span class="badge amber">Sign-in required</span>'
    : page.requiresAuthentication === false ? '<span class="badge success">No sign-in</span>' : '<span class="badge">Sign-in unknown</span>';
  const row = (t, otherId) => `<tr><td><button class="as-link" type="button" data-journey-page="${escapeHtml(otherId)}">${escapeHtml(journeyPageLabel(pages.get(otherId) || { id: otherId }))}</button></td>
    <td>${escapeHtml(t.trigger)}</td><td class="muted">${escapeHtml(t.condition || '—')}</td><td>${(t.evidence || []).slice(0, 3).map(journeyEvidenceLink).join('<br>')}</td></tr>`;
  const table = (items, key, empty) => items.length
    ? `<table class="data-table"><thead><tr><th>Page</th><th>How</th><th>When</th><th>Source</th></tr></thead><tbody>${items.map((t) => row(t, t[key])).join('')}</tbody></table>`
    : `<p class="muted">${empty}</p>`;
  const outgoing = data.transitions.filter((t) => t.from === pageId);
  const incoming = data.transitions.filter((t) => t.to === pageId);
  return `<article class="dependency-detail">
    <p class="eyebrow">${escapeHtml(page.kind === 'razor-page' ? 'Razor page' : 'MVC action')}</p><h2>${escapeHtml(journeyPageLabel(page))}</h2>
    <p>${escapeHtml(page.purpose || 'No purpose recorded.')}</p>
    <div class="badges">${signIn}${page.isEntryPoint ? '<span class="badge blue">Entry point</span>' : ''}${(page.routes || []).map((route) => `<span class="badge"><code>${escapeHtml(route)}</code></span>`).join('')}</div>
    <p class="muted"><code>${escapeHtml(page.id)}</code> · ${journeyEvidenceLink(`${page.sourceFile}:${page.line}`)}</p>
    ${journeyFieldsTable(page)}
    <h3>Goes to</h3>${table(outgoing, 'to', 'Nothing in this repository links onward from here.')}
    <h3>Reached from</h3>${table(incoming, 'from', 'Nothing in this repository links here; users arrive from elsewhere.')}
  </article>`;
}

// Field definitions only (name, type, label, rules, options); the catalogue never holds values users enter.
export function journeyFieldsTable(page) {
  const fields = page.fields || [];
  if (!fields.length) return '';
  // [Required] on the view model, or a validator rule summarised as "required...".
  const required = (field) => (field.required || /^required\b/i.test(field.validation || '')) ? 'Yes' : field.required === false ? 'No' : '—';
  const rules = (field) => [...(field.constraints || []), ...(field.validation ? [field.validation] : [])].join('; ') || '—';
  const options = (field) => (field.options || []).map((option) => escapeHtml(option.label || option.value)).join(', ') || '—';
  return `<h3>Form fields</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Field</th><th>Type</th><th>Label</th><th>Required</th><th>Rules</th><th>Options</th><th>Source</th></tr></thead><tbody>
    ${fields.map((field) => `<tr><td><code>${escapeHtml(field.name)}</code></td><td>${escapeHtml(field.control || '')}</td>
      <td>${escapeHtml(field.label || '—')}</td><td>${required(field)}</td><td class="muted">${escapeHtml(rules(field))}</td>
      <td class="muted">${options(field)}</td><td>${field.sourceFile ? journeyEvidenceLink(`${field.sourceFile}:${field.line}`) : '—'}</td></tr>`).join('')}
  </tbody></table></div>`;
}

export function journeyLayout(journey) {
  const positions = new Map();
  const edges = [];
  const transitions = new Set(state.data.transitions.map((t) => `${t.from}\u0000${t.to}`));
  const STEP = 250;
  journey.steps.forEach((id, i) => positions.set(id, { x: i * STEP, y: 0 }));
  journey.steps.slice(1).forEach((id, i) => edges.push({ from: journey.steps[i], to: id }));
  if (journey.kind === 'hub') {
    const hubX = positions.get(journey.hub).x;
    const count = journey.sections.length;
    const GAP = 100;
    // Long task lists go into two columns so the diagram stays readable when fitted to the page.
    const columns = count > 6 ? 2 : 1;
    const rows = Math.ceil(count / columns);
    journey.sections.forEach((id, i) => {
      const column = Math.floor(i / rows);
      positions.set(id, { x: hubX + STEP * (1 + column), y: (i % rows - (rows - 1) / 2) * GAP });
      edges.push({ from: journey.hub, to: id });
      if (transitions.has(`${id}\u0000${journey.hub}`)) edges.push({ from: id, to: journey.hub, returning: true });
    });
    // The way on from the hub runs along its own row underneath, so its arrows do not cross the sections.
    const thenY = ((rows - 1) / 2) * GAP + 150;
    journey.then.forEach((id, i) => positions.set(id, { x: hubX + i * STEP, y: thenY }));
    [journey.hub, ...journey.then].slice(1).forEach((id, i) => edges.push({ from: [journey.hub, ...journey.then][i], to: id }));
  }
  return { positions, edges };
}

export function renderJourneys(resetToolbar = true) {
  const data = state.data;
  const pages = data.pages || [];
  const journeys = data.journeys || [];
  if (!pages.length) {
    destroyCy();
    toolbar.innerHTML = '';
    content.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>No web pages found</h2><p>This repository has no ASP.NET web project with pages or views.</p></div>';
    return;
  }
  if (state.journey == null || (state.journey !== 'all' && !journeys[state.journey])) {
    state.journey = journeys.length ? journeys.indexOf(alphabetical(journeys)[0]) : 'all';   // the first journey alphabetically
  }
  if (resetToolbar) {
    toolbar.innerHTML = `<label class="source-picker" for="journey-picker"><span>Journey</span><select id="journey-picker">
      ${alphabetical(journeys.map((journey, i) => ({ journey, i })), ({ journey }) => journey.name).map(({ journey, i }) => `<option value="${i}" ${state.journey === i ? 'selected' : ''}>${escapeHtml(journey.name)}</option>`).join('')}
      <option value="all" ${state.journey === 'all' ? 'selected' : ''}>All pages</option></select></label>
      ${state.journey === 'all' ? searchControl('Filter pages') : ''}
      <span class="spacer"></span><span class="toolbar-meta">${pages.length} pages · ${data.transitions.length} transitions · ${journeys.length} journeys</span>`;
    $('#journey-picker').onchange = (event) => {
      state.journey = event.target.value === 'all' ? 'all' : Number(event.target.value);
      state.selected = null;
      state.filter = '';
      renderJourneys(true);
    };
    if (state.journey === 'all') wireSearch();
  }
  if (state.journey === 'all') return renderJourneyPages(pages);

  const journey = journeys[state.journey];
  const byId = new Map(pages.map((page) => [page.id, page]));
  const { positions, edges } = journeyLayout(journey);
  const conditions = new Map(data.transitions.map((t) => [`${t.from}\u0000${t.to}`, t.condition]));
  if (!state.selected || !positions.has(state.selected)) state.selected = journey.kind === 'hub' ? journey.hub : journey.steps[0];
  const elements = [
    ...[...positions].map(([id, position]) => ({ data: { id, isLeaf: true, width: 200, height: 78 }, position })),
    ...edges.map((edge, i) => ({
      data: { id: `j-edge-${i}`, source: edge.from, target: edge.to, label: edge.returning ? '' : (conditions.get(`${edge.from}\u0000${edge.to}`) || '') },
      classes: edge.returning ? 'returning' : ''
    }))
  ];
  destroyCy();
  content.innerHTML = `<div class="dependency-view">
    <p class="section-sub">${escapeHtml(journey.description || '')}${journey.kind === 'hub' ? ' Sections can be completed in any order; dashed lines return to the hub.' : ''}</p>
    <div id="journey-cy" class="cy-container" role="group" aria-label="User journey diagram"></div>
    <div id="journey-detail">${journeyPageDetail(state.selected)}</div>
  </div>`;
  const cy = mountCy({
    container: $('#journey-cy'),
    elements,
    layout: { name: 'preset', fit: true, padding: 40 },
    htmlLabels: [{
      query: 'node[?isLeaf]', halign: 'center', valign: 'center', halignBox: 'center', valignBox: 'center',
      tpl: (node) => {
        const page = byId.get(node.id) || { id: node.id };
        const hub = journey.kind === 'hub' && node.id === journey.hub;
        return `<div class="cy-node journey-node ${hub ? 'message' : 'internal'}" style="width:${node.width}px;height:${node.height}px" data-node-id="${escapeHtml(node.id)}"><span class="c4-type">${hub ? 'Hub' : page.isEntryPoint ? 'Entry point' : 'Page'}${page.requiresAuthentication ? ' · 🔒' : ''}</span><strong>${escapeHtml(journeyPageLabel(page))}</strong><span class="c4-meta">${escapeHtml((page.routes || [])[0] || '')}</span></div>`;
      }
    }],
    onTapNode: (node) => {
      state.selected = node.id();
      markCySelection($('#journey-cy'), state.selected);
      $('#journey-detail').innerHTML = journeyPageDetail(state.selected);
      wireJourneyPageLinks();
      scrollDetailIntoView('journey-detail');
    }
  });
  markCySelection($('#journey-cy'), state.selected);
  wireJourneyPageLinks();
  return cy;
}

export function renderJourneyPages(pages) {
  destroyCy();
  const filtered = pages.filter((page) => `${page.id} ${(page.routes || []).join(' ')} ${page.purpose || ''}`.toLowerCase().includes(state.filter));
  if (!state.selected || !pages.some((page) => page.id === state.selected)) state.selected = filtered[0]?.id || null;
  const signIn = (page) => ({ true: 'Yes', false: 'No' })[page.requiresAuthentication] || 'Unknown';
  const fieldCount = (page) => (page.fields || []).length;
  content.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Page</th><th>Route</th><th>Sign-in</th><th>Form fields</th><th>Purpose</th></tr></thead><tbody>
    ${filtered.map((page) => `<tr><td><button class="as-link" type="button" data-journey-page="${escapeHtml(page.id)}">${escapeHtml(journeyPageLabel(page))}</button>${page.isEntryPoint ? ' <span class="badge blue">Entry</span>' : ''}</td>
      <td>${(page.routes || []).map((route) => `<code>${escapeHtml(route)}</code>`).join('<br>') || '—'}</td><td>${signIn(page)}</td><td>${fieldCount(page) || '—'}</td><td class="muted">${escapeHtml(page.purpose || '—')}</td></tr>`).join('')
      || '<tr><td colspan="5" class="muted">No matching pages.</td></tr>'}
  </tbody></table></div><div id="journey-detail">${journeyPageDetail(state.selected)}</div>`;
  wireJourneyPageLinks();
}

export function wireJourneyPageLinks() {
  document.querySelectorAll('[data-journey-page]').forEach((button) => {
    button.onclick = () => {
      state.selected = button.dataset.journeyPage;
      if (state.journey === 'all') {
        $('#journey-detail').innerHTML = journeyPageDetail(state.selected);
        wireJourneyPageLinks();
      } else {
        markCySelection($('#journey-cy'), state.selected);
        $('#journey-detail').innerHTML = journeyPageDetail(state.selected);
        wireJourneyPageLinks();
      }
      scrollDetailIntoView('journey-detail');
    };
  });
}
