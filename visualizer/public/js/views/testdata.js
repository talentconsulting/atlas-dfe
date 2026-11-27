// Test data: the view on a repository's Data schema tab, and the Test data page across repositories.
import { $, content, toolbar } from '../dom.js';
import { destroyCy } from '../graph.js';
import { state } from '../state.js';
import { alphabetical, compareText, escapeHtml, getJson, tableLabel, titleCase } from '../util.js';

export let testDataModule;
export async function renderTestData(tables) {
  if (!tables.length) {
    content.innerHTML = '<div class="empty-state"><h2>No tables</h2><p>This repository has no catalogued database tables.</p></div>';
    return;
  }
  testDataModule ||= await import('/testdata.js');
  const options = state.testData = {
    rows: 5, includeOptional: false, inferLinks: false, fillOptional: true, startId: 900001, counts: {},
    ...(state.testData || {})
  };
  if (!tables.some((table) => table.name === options.table)) options.table = state.selected && tables.some((table) => table.name === state.selected) ? state.selected : alphabetical(tables, tableLabel)[0].name;
  let plan;
  try {
    plan = testDataModule.planTestData(tables, options.table, options);
  } catch (error) {
    content.innerHTML = `<div class="empty-state"><h2>Couldn't plan test data</h2><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }
  const rowCounts = Object.fromEntries(plan.order.map((name) => [name, options.counts[`${options.table}:${name}`] ?? (name === plan.root ? options.rows : 1)]));
  const sql = testDataModule.generateSql(plan, { rows: options.rows, rowCounts, startId: Number(options.startId) || 1, fillOptional: options.fillOptional, generatedAt: new Date().toISOString().slice(0, 10) });
  const pii = plan.order.filter((name) => plan.tables.get(name).hasPii === true);
  const reasonText = (name) => {
    const links = plan.reasons.get(name) || [];
    if (name === plan.root) return 'The table you picked';
    return `Needed by ${links.map((link) => `<code>${escapeHtml(link.from)}.${escapeHtml(link.fromColumns.join(', '))}</code>${link.required ? '' : ' <span class="badge blue">optional</span>'}${link.suggested ? ' <span class="badge amber">suggested link</span>' : ''}`).join(', ')}`;
  };
  content.innerHTML = `<div class="testdata">
    <section class="testdata-controls" aria-label="Test data options">
      <label>Table<select id="td-table">${alphabetical(tables, tableLabel).map((table) => `<option value="${escapeHtml(table.name)}"${table.name === options.table ? ' selected' : ''}>${escapeHtml(tableLabel(table))}</option>`).join('')}</select></label>
      <label>Rows<input id="td-rows" type="number" min="1" max="500" value="${escapeHtml(options.rows)}"></label>
      <label>First ID<input id="td-start" type="number" min="1" value="${escapeHtml(options.startId)}" title="Integer keys start here, so the rows don't clash with existing ones"></label>
      <label class="check"><input id="td-optional" type="checkbox"${options.includeOptional ? ' checked' : ''}> Also fill optional links</label>
      <label class="check"><input id="td-infer" type="checkbox"${options.inferLinks ? ' checked' : ''}> Suggest links from column names</label>
      <label class="check"><input id="td-fill" type="checkbox"${options.fillOptional ? ' checked' : ''}> Fill optional columns</label>
    </section>
    <section class="testdata-plan">
      <h2>What gets inserted</h2>
      <p class="muted">${plan.order.length === 1 ? `${escapeHtml(plan.root)} needs nothing else set up first.` : `${escapeHtml(plan.root)} needs ${plan.order.length - 1} other table${plan.order.length === 2 ? '' : 's'} set up first. They're inserted in this order, and each row links to the rows above it.`}</p>
      <table class="data-table"><thead><tr><th>#</th><th>Table</th><th>Why</th><th>Rows</th></tr></thead><tbody>
        ${plan.order.map((name, index) => `<tr><td>${index + 1}</td><td><code>${escapeHtml(tableLabel(plan.tables.get(name)))}</code>${plan.tables.get(name).hasPii === true ? ' <span class="badge danger" title="Flagged as possibly holding personal data; every value is made up">personal data</span>' : ''}</td><td>${reasonText(name)}</td><td><input class="td-count" type="number" min="1" max="500" data-table="${escapeHtml(name)}" value="${escapeHtml(rowCounts[name])}" aria-label="Rows for ${escapeHtml(name)}"></td></tr>`).join('')}
      </tbody></table>
      ${plan.warnings.length ? `<ul class="testdata-warnings">${plan.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : ''}
      ${pii.length ? `<p class="muted">${pii.length === 1 ? 'One table is' : `${pii.length} tables are`} flagged as possibly holding personal data. Every value here is made up: names, emails (example.com), phone numbers (the 01632 960 drama range) and postcodes (ZZ99 9ZZ).</p>` : ''}
    </section>
    <section class="testdata-sql">
      <div class="testdata-sql-head"><h2>SQL Server script</h2><span class="spacer"></span><button id="td-copy" class="plain-button" type="button">Copy</button><button id="td-download" class="plain-button" type="button">Download .sql</button></div>
      <p class="muted">Runs in one transaction. Use it against a local or test database only; change the last line to ROLLBACK to try it without keeping the rows. Business rules the code enforces (allowed status codes, date order) aren't in the schema, so check those columns.</p>
      <pre id="td-sql">${escapeHtml(sql)}</pre>
    </section>
  </div>`;
  const rerender = () => renderTestData(tables);
  $('#td-table').addEventListener('change', (event) => { options.table = event.target.value; rerender(); });
  $('#td-rows').addEventListener('change', (event) => { options.rows = Math.min(500, Math.max(1, Number(event.target.value) || 1)); delete options.counts[`${options.table}:${options.table}`]; rerender(); });
  $('#td-start').addEventListener('change', (event) => { options.startId = Math.max(1, Number(event.target.value) || 1); rerender(); });
  $('#td-optional').addEventListener('change', (event) => { options.includeOptional = event.target.checked; rerender(); });
  $('#td-infer').addEventListener('change', (event) => { options.inferLinks = event.target.checked; rerender(); });
  $('#td-fill').addEventListener('change', (event) => { options.fillOptional = event.target.checked; rerender(); });
  document.querySelectorAll('.td-count').forEach((input) => input.addEventListener('change', () => { options.counts[`${options.table}:${input.dataset.table}`] = Math.min(500, Math.max(1, Number(input.value) || 1)); rerender(); }));
  $('#td-copy').addEventListener('click', async (event) => {
    try { await navigator.clipboard.writeText(sql); event.target.textContent = 'Copied'; } catch { event.target.textContent = 'Copy failed'; }
    setTimeout(() => { event.target.textContent = 'Copy'; }, 1500);
  });
  $('#td-download').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([sql], { type: 'application/sql' }));
    link.download = `${state.source?.name || 'test-data'}-${plan.root}.sql`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });
}

export async function loadTestDataPage() {
  destroyCy();
  $('#mode-eyebrow').textContent = 'Developer tools';
  $('#source-title').textContent = 'Test data';
  $('#source-stats').innerHTML = '';
  toolbar.innerHTML = '<span class="toolbar-meta">Tick repositories, then the tables you want rows in. Tables they depend on through foreign keys are added for you, and each repository gets its own SQL Server script.</span>';
  content.innerHTML = '<div class="loading">Reading database schemas…</div>';
  testDataModule ||= await import('/testdata.js');
  const page = state.testDataPage ||= {
    schemas: new Map(), repos: new Set(), picked: new Map(), repoFilter: '', tableFilters: new Map(),
    options: { rows: 5, includeOptional: false, inferLinks: false, fillOptional: true, startId: 900001 }
  };
  if (!page.schemas.size) {
    const sources = state.catalog.filter((source) => source.capabilities.database);
    const results = await Promise.all(sources.map((source) => getJson(`/api/sources/${encodeURIComponent(source.id)}/database`).then((schema) => [source, schema]).catch(() => [source, null])));
    for (const [source, schema] of results) if (schema?.tables?.length) page.schemas.set(source.id, { source, tables: schema.tables });
  }
  renderTestDataPage();
}

export function testDataPlans(page) {
  return [...page.repos].filter((id) => page.schemas.has(id)).map((id) => {
    const { source, tables } = page.schemas.get(id);
    const picked = [...(page.picked.get(id) || [])].filter((name) => tables.some((table) => table.name === name));
    if (!picked.length) return { id, source, tables, picked, plan: null };
    const plan = testDataModule.planTestData(tables, picked, page.options);
    // Point out where a table outside this database is catalogued, so it can be set up there too.
    plan.warnings = plan.warnings.map((warning) => {
      const target = warning.match(/points at (\S+), which isn't/)?.[1];
      if (!target) return warning;
      const elsewhere = [...page.schemas.values()].filter((other) => other.source.id !== id && other.tables.some((table) => table.name.toLowerCase() === target.toLowerCase())).map((other) => titleCase(other.source.name));
      return elsewhere.length ? `${warning} A ${target} table is catalogued in ${elsewhere.join(', ')}.` : warning;
    });
    const sql = testDataModule.generateSql(plan, { rows: page.options.rows, startId: Number(page.options.startId) || 1, fillOptional: page.options.fillOptional, generatedAt: new Date().toISOString().slice(0, 10) });
    return { id, source, tables, picked, plan, sql };
  });
}

export function renderTestDataPage() {
  const page = state.testDataPage;
  const options = page.options;
  if (!page.schemas.size) {
    content.innerHTML = '<div class="empty-state"><h2>No database schemas</h2><p>Run the database-schema flow to catalogue repositories\' tables.</p></div>';
    return;
  }
  const repos = [...page.schemas.values()].sort((a, b) => compareText(titleCase(a.source.name), titleCase(b.source.name)));
  const repoQuery = page.repoFilter.toLowerCase();
  const plans = testDataPlans(page);
  const totalTables = plans.reduce((sum, item) => sum + (item.plan?.order.length || 0), 0);
  $('#source-stats').innerHTML = `
    <div class="stat"><dt>Repositories</dt><dd>${plans.length}</dd></div>
    <div class="stat"><dt>Tables picked</dt><dd>${plans.reduce((sum, item) => sum + item.picked.length, 0)}</dd></div>
    <div class="stat"><dt>Tables filled</dt><dd>${totalTables}</dd></div>`;

  const repoHtml = (item) => {
    const { source, tables, picked, plan, sql } = item;
    const tableQuery = (page.tableFilters.get(item.id) || '').toLowerCase();
    const needed = new Set(plan ? plan.order.filter((name) => !picked.includes(name)) : []);
    const visible = alphabetical(tables, tableLabel).filter((table) => !tableQuery || tableLabel(table).toLowerCase().includes(tableQuery));
    const reasonText = (name) => picked.includes(name)
      ? `You picked it${(plan.reasons.get(name) || []).length ? `, and ${plan.reasons.get(name).map((link) => `<code>${escapeHtml(link.from)}.${escapeHtml(link.fromColumns.join(', '))}</code>`).join(', ')} needs it` : ''}`
      : `Needed by ${(plan.reasons.get(name) || []).map((link) => `<code>${escapeHtml(link.from)}.${escapeHtml(link.fromColumns.join(', '))}</code>${link.required ? '' : ' <span class="badge blue">optional</span>'}${link.suggested ? ' <span class="badge amber">suggested link</span>' : ''}`).join(', ')}`;
    return `<section class="td-repo" data-td-repo="${escapeHtml(item.id)}">
      <div class="td-repo-head"><h2>${escapeHtml(titleCase(source.name))}</h2><span class="toolbar-meta">${tables.length} tables · ${picked.length} picked${needed.size ? ` · ${needed.size} added for relationships` : ''}</span><span class="spacer"></span>
        <button type="button" class="plain-button" data-td-all="${escapeHtml(item.id)}">Select all</button><button type="button" class="plain-button" data-td-none="${escapeHtml(item.id)}">Clear</button></div>
      <input type="search" data-td-table-filter="${escapeHtml(item.id)}" placeholder="Filter tables" value="${escapeHtml(page.tableFilters.get(item.id) || '')}" aria-label="Filter ${escapeHtml(source.name)} tables">
      <ul class="td-checklist td-tables">${visible.map((table) => `<li><label class="${needed.has(table.name) ? 'needed' : ''}" title="${needed.has(table.name) ? 'Added because a picked table depends on it' : ''}"><input type="checkbox" data-td-table="${escapeHtml(table.name)}" data-td-of="${escapeHtml(item.id)}"${picked.includes(table.name) ? ' checked' : ''}><span class="name">${escapeHtml(tableLabel(table))}</span>${needed.has(table.name) ? '<span class="count">needed</span>' : ''}</label></li>`).join('') || '<li class="muted">No tables match.</li>'}</ul>
      ${plan ? `<div class="testdata-plan">
        <h3>What gets inserted, in order</h3>
        <table class="data-table"><thead><tr><th>#</th><th>Table</th><th>Why</th><th>Rows</th></tr></thead><tbody>
          ${plan.order.map((name, index) => `<tr><td>${index + 1}</td><td><code>${escapeHtml(tableLabel(plan.tables.get(name)))}</code>${plan.tables.get(name).hasPii === true ? ' <span class="badge danger" title="Flagged as possibly holding personal data; every value is made up">personal data</span>' : ''}</td><td>${reasonText(name)}</td><td>${picked.includes(name) ? options.rows : 1}</td></tr>`).join('')}
        </tbody></table>
        ${plan.warnings.length ? `<ul class="testdata-warnings">${plan.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="testdata-sql">
        <div class="testdata-sql-head"><h3>SQL Server script for the ${escapeHtml(source.name)} database</h3><span class="spacer"></span><button class="plain-button" type="button" data-td-copy="${escapeHtml(item.id)}">Copy</button><button class="plain-button" type="button" data-td-download="${escapeHtml(item.id)}">Download .sql</button></div>
        <pre>${escapeHtml(sql)}</pre>
      </div>` : '<p class="muted">Tick the tables you want rows in.</p>'}
    </section>`;
  };

  const repoList = repos.filter((item) => !repoQuery || item.source.name.toLowerCase().includes(repoQuery));
  content.innerHTML = `<div class="td-page">
    <aside class="td-repos" aria-label="Repositories">
      <h2>Repositories</h2>
      <input type="search" id="td-repo-filter" placeholder="Filter repositories" value="${escapeHtml(page.repoFilter)}">
      <ul class="td-checklist">${repoList.map((item) => `<li><label><input type="checkbox" data-td-repo-pick="${escapeHtml(item.source.id)}"${page.repos.has(item.source.id) ? ' checked' : ''}><span class="name">${escapeHtml(titleCase(item.source.name))}</span><span class="count" title="Tables">${item.tables.length}</span></label></li>`).join('') || '<li class="muted">No repositories match.</li>'}</ul>
    </aside>
    <div class="td-main">
      <section class="testdata-controls" aria-label="Options">
        <label>Rows per picked table<input id="tdp-rows" type="number" min="1" max="500" value="${escapeHtml(options.rows)}"></label>
        <label>First ID<input id="tdp-start" type="number" min="1" value="${escapeHtml(options.startId)}" title="Integer keys start here, so the rows don't clash with existing ones"></label>
        <label class="check"><input id="tdp-optional" type="checkbox"${options.includeOptional ? ' checked' : ''}> Also fill optional links</label>
        <label class="check"><input id="tdp-infer" type="checkbox"${options.inferLinks ? ' checked' : ''}> Suggest links from column names</label>
        <label class="check"><input id="tdp-fill" type="checkbox"${options.fillOptional ? ' checked' : ''}> Fill optional columns</label>
        ${plans.some((item) => item.sql) ? '<span class="td-actions"><button id="tdp-download-all" class="plain-button" type="button">Download all scripts</button></span>' : ''}
      </section>
      ${plans.length ? plans.map(repoHtml).join('') : '<div class="empty-state"><h2>Pick a repository</h2><p>Tick one or more repositories on the left, then tick the tables to fill. Every value is made up; each repository\'s script runs against its own database.</p></div>'}
      ${plans.length ? '<p class="muted">Every value is made up: names from a fixed fictional list, emails at example.com, phone numbers in the 01632 960 drama range and postcodes ZZ99 9ZZ. Business rules the code enforces (allowed status codes, date order) aren\'t in the schema, so check those columns. Run scripts against a local or test database only.</p>' : ''}
    </div>
  </div>`;

  const rerender = () => { const y = window.scrollY; renderTestDataPage(); window.scrollTo(0, y); };
  const refocus = (selector) => { const input = $(selector); if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } };
  $('#td-repo-filter').addEventListener('input', (event) => { page.repoFilter = event.target.value; rerender(); refocus('#td-repo-filter'); });
  document.querySelectorAll('[data-td-repo-pick]').forEach((input) => input.addEventListener('change', () => {
    input.checked ? page.repos.add(input.dataset.tdRepoPick) : page.repos.delete(input.dataset.tdRepoPick);
    rerender();
  }));
  document.querySelectorAll('[data-td-table]').forEach((input) => input.addEventListener('change', () => {
    const set = page.picked.get(input.dataset.tdOf) || new Set();
    input.checked ? set.add(input.dataset.tdTable) : set.delete(input.dataset.tdTable);
    page.picked.set(input.dataset.tdOf, set);
    rerender();
  }));
  document.querySelectorAll('[data-td-table-filter]').forEach((input) => input.addEventListener('input', () => {
    page.tableFilters.set(input.dataset.tdTableFilter, input.value);
    rerender();
    refocus(`[data-td-table-filter="${CSS.escape(input.dataset.tdTableFilter)}"]`);
  }));
  document.querySelectorAll('[data-td-all]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.tdAll;
    const query = (page.tableFilters.get(id) || '').toLowerCase();
    const set = page.picked.get(id) || new Set();
    page.schemas.get(id).tables.filter((table) => !query || tableLabel(table).toLowerCase().includes(query)).forEach((table) => set.add(table.name));
    page.picked.set(id, set);
    rerender();
  }));
  document.querySelectorAll('[data-td-none]').forEach((button) => button.addEventListener('click', () => { page.picked.set(button.dataset.tdNone, new Set()); rerender(); }));
  $('#tdp-rows').addEventListener('change', (event) => { options.rows = Math.min(500, Math.max(1, Number(event.target.value) || 1)); rerender(); });
  $('#tdp-start').addEventListener('change', (event) => { options.startId = Math.max(1, Number(event.target.value) || 1); rerender(); });
  $('#tdp-optional').addEventListener('change', (event) => { options.includeOptional = event.target.checked; rerender(); });
  $('#tdp-infer').addEventListener('change', (event) => { options.inferLinks = event.target.checked; rerender(); });
  $('#tdp-fill').addEventListener('change', (event) => { options.fillOptional = event.target.checked; rerender(); });
  const download = (name, text) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'application/sql' }));
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const byId = new Map(plans.map((item) => [item.id, item]));
  document.querySelectorAll('[data-td-copy]').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(byId.get(button.dataset.tdCopy).sql); button.textContent = 'Copied'; } catch { button.textContent = 'Copy failed'; }
    setTimeout(() => { button.textContent = 'Copy'; }, 1500);
  }));
  document.querySelectorAll('[data-td-download]').forEach((button) => button.addEventListener('click', () => {
    const item = byId.get(button.dataset.tdDownload);
    download(`${item.source.name}-test-data.sql`, item.sql);
  }));
  $('#tdp-download-all')?.addEventListener('click', () => {
    const scripts = plans.filter((item) => item.sql).map((item) => `-- ============================================================\n-- ${item.source.name} database: run this part against that database\n-- ============================================================\n\n${item.sql}`);
    download('test-data.sql', scripts.join('\n\nGO\n\n'));
  });
}
