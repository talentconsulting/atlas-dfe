// The home dashboard: Dependabot alerts, API security findings, repository metadata and databases.
import { $, content, toolbar } from '../dom.js';
import { destroyCy } from '../graph.js';
import { state } from '../state.js';
import { compareDate, compareNumber, compareText, escapeHtml, getJson, orgRepoSlug, scanSourceUrl, tableLabel, titleCase } from '../util.js';
import { renderTableDetail } from './database.js';
import { openSourceView } from './source.js';

export function setHomeHero() {
  $('#mode-eyebrow').textContent = 'TalentSuite Atlas';
  $('#source-title').textContent = 'Dashboard';
  $('#source-stats').innerHTML = '';
}

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];
export const SPECTRAL_SEVERITY_ORDER = ['error', 'warning', 'info', 'hint'];
export const DASHBOARD_PAGE_SIZE = 10;

export function severityRank(severity) {
  const index = SEVERITY_ORDER.indexOf(severity);
  return index === -1 ? SEVERITY_ORDER.length : index;
}

export function severityClass(severity) {
  return SEVERITY_ORDER.includes(severity) ? severity : 'unknown';
}

export function sortedSeverities(counts) {
  return Object.keys(counts).filter((severity) => counts[severity] > 0).sort((a, b) => severityRank(a) - severityRank(b) || a.localeCompare(b));
}

export function severityPills(counts) {
  return sortedSeverities(counts).map((severity) => `<span class="severity-pill ${severityClass(severity)}">${counts[severity]} ${escapeHtml(severity)}</span>`).join('');
}

export function spectralSeverityRank(severity) {
  const index = SPECTRAL_SEVERITY_ORDER.indexOf(severity);
  return index === -1 ? SPECTRAL_SEVERITY_ORDER.length : index;
}

export function spectralSeverityClass(severity) {
  if (severity === 'error') return 'critical';
  if (severity === 'warning') return 'high';
  if (severity === 'info') return 'medium';
  return 'low';
}

export function spectralSeverityPill(severity, count) {
  return `<span class="severity-pill ${spectralSeverityClass(severity)}">${count} ${escapeHtml(severity)}</span>`;
}

// Every count/pill on the dashboard is derived from the checked severities only — unchecked
// severities are excluded from totals, row counts, and the detail lists beneath each row.
export function filteredCounts(counts, activeSet) {
  const result = {};
  Object.entries(counts || {}).forEach(([severity, count]) => { if (activeSet.has(severity)) result[severity] = count; });
  return result;
}

export function severityFilterHtml(filterKey, allSeverities, activeSet, classFn) {
  return `<div class="severity-filter" role="group" aria-label="Filter by severity">${allSeverities.map((severity) => `
    <label class="severity-filter-item"><input type="checkbox" data-severity-filter="${escapeHtml(filterKey)}" value="${escapeHtml(severity)}" ${activeSet.has(severity) ? 'checked' : ''}><span class="severity-pill ${classFn(severity)}">${escapeHtml(severity)}</span></label>`).join('')}</div>`;
}

export function wireDashboardSeverityFilters() {
  document.querySelectorAll('[data-severity-filter]').forEach((checkbox) => {
    checkbox.onchange = () => {
      const set = state.dashboardFilters[checkbox.dataset.severityFilter];
      if (checkbox.checked) set.add(checkbox.value); else set.delete(checkbox.value);
      state.dashboardPages.clear(); // result sets just changed size — stale page numbers would be confusing
      renderHomeDashboard();
    };
  });
}

// Pagination state is keyed per table (summary tables, plus one entry per expanded repo's
// detail table) so paging through one repo's alert list doesn't disturb any other table.
export function paginate(items, pageKey, pageSize = DASHBOARD_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  let page = state.dashboardPages.get(pageKey) || 1;
  page = Math.min(Math.max(page, 1), totalPages);
  state.dashboardPages.set(pageKey, page);
  const start = (page - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), page, totalPages };
}

export function dashboardSortState(tableId, defaultKey, defaultDirection = 'asc') {
  if (!state.dashboardSort) state.dashboardSort = {};
  if (!state.dashboardSort[tableId]) state.dashboardSort[tableId] = { key: defaultKey, direction: defaultDirection };
  return state.dashboardSort[tableId];
}

export function sortRows(rows, sort, comparators) {
  const comparator = comparators[sort.key];
  if (!comparator) return rows;
  const dir = sort.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => comparator(a, b, dir));
}

export function sortIndicator(tableId, key) {
  const sort = state.dashboardSort?.[tableId];
  if (!sort || sort.key !== key) return '';
  return sort.direction === 'desc' ? ' ▼' : ' ▲';
}

export function sortableHeaderCell(tableId, key, label) {
  return `<th><button type="button" class="sortable-th" data-sort-table="${escapeHtml(tableId)}" data-sort-key="${escapeHtml(key)}" aria-label="Sort by ${escapeHtml(label)}">${escapeHtml(label)}${sortIndicator(tableId, key)}</button></th>`;
}

export function wireSortableHeaders() {
  document.querySelectorAll('[data-sort-table]').forEach((button) => {
    button.onclick = () => {
      const tableId = button.dataset.sortTable;
      const key = button.dataset.sortKey;
      const current = state.dashboardSort[tableId];
      state.dashboardSort[tableId] = current && current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' };
      renderHomeDashboard();
    };
  });
}

export function paginationHtml(pageKey, page, totalPages, totalCount) {
  if (totalPages <= 1) return '';
  return `<div class="pagination" data-page-key="${escapeHtml(pageKey)}">
    <button type="button" class="plain-button" data-page-action="prev" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
    <span class="pagination-status">Page ${page} of ${totalPages} · ${totalCount} total</span>
    <button type="button" class="plain-button" data-page-action="next" ${page >= totalPages ? 'disabled' : ''}>Next →</button>
  </div>`;
}

export function wireDashboardPagination() {
  document.querySelectorAll('[data-page-key]').forEach((container) => {
    const key = container.dataset.pageKey;
    container.querySelectorAll('[data-page-action]').forEach((button) => {
      button.onclick = () => {
        const current = state.dashboardPages.get(key) || 1;
        state.dashboardPages.set(key, Math.max(1, current + (button.dataset.pageAction === 'next' ? 1 : -1)));
        renderHomeDashboard();
      };
    });
  });
}

export function wireDashboardRowToggles() {
  document.querySelectorAll('[data-toggle-alerts]').forEach((row) => {
    row.onclick = () => {
      const key = row.dataset.toggleAlerts;
      if (state.dashboardExpanded.has(key)) state.dashboardExpanded.delete(key); else state.dashboardExpanded.add(key);
      renderHomeDashboard();
    };
  });
}

export async function loadHomeDashboard() {
  destroyCy();
  toolbar.innerHTML = '';
  content.innerHTML = '<div class="loading">Reading catalogue data…</div>';
  state.selected = null;
  state.dashboardPages = new Map();
  state.dashboardExpanded = new Set();
  state.dashboardFilters = { dependabot: new Set(SEVERITY_ORDER), apiSecurity: new Set(SPECTRAL_SEVERITY_ORDER), metadataFramework: 'all' };
  try {
    // One request for every tab, rather than one per source per tab.
    const { sources } = await getJson('/api/dashboard');
    const byId = new Map(sources.map((entry) => [entry.id, entry]));
    const rows = state.catalog.map((source) => ({ source, data: byId.get(source.id) || {} }));
    state.securityAudit = rows.map(({ source, data }) => ({ source, alerts: data.security || null }));
    state.apiSecurityAudit = rows.map(({ source, data }) => ({ source, report: data.apiSecurity || null }));
    state.repoMetadata = rows.map(({ source, data }) => ({ source, metadata: data.metadata || null, topics: data.topics || null }));
    state.databaseSchemas = rows.map(({ source, data }) => ({ source, schema: data.database || null }));
    renderHomeDashboard();
  } catch (error) {
    content.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

export const DASHBOARD_TABS = [
  { id: 'security', label: 'Code security audit' },
  { id: 'apiSecurity', label: 'API security audit' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'databases', label: 'Databases' }
];

export function dependabotStats() {
  const results = state.securityAudit || [];
  const dependabotFilter = state.dashboardFilters.dependabot;
  const scanned = results.filter((result) => result.alerts);
  const totalSeverityCounts = {};
  scanned.forEach((result) => {
    Object.entries(filteredCounts(result.alerts.severityCounts, dependabotFilter)).forEach(([severity, count]) => {
      totalSeverityCounts[severity] = (totalSeverityCounts[severity] || 0) + count;
    });
  });
  const totalOpen = Object.values(totalSeverityCounts).reduce((sum, count) => sum + count, 0);
  const affectedCount = scanned.filter((result) => Object.values(filteredCounts(result.alerts.severityCounts, dependabotFilter)).some((count) => count > 0)).length;
  return { results, scanned, totalSeverityCounts, totalOpen, affectedCount, worstSeverity: sortedSeverities(totalSeverityCounts)[0] };
}

export function renderDashboardStats() {
  if (state.dashboardTab === 'apiSecurity') {
    const results = state.apiSecurityAudit || [];
    const apiFilter = state.dashboardFilters.apiSecurity;
    const audited = results.filter((result) => result.report);
    const totalSummary = {};
    audited.forEach((result) => {
      Object.entries(filteredCounts(result.report.summary, apiFilter)).forEach(([severity, count]) => {
        totalSummary[severity] = (totalSummary[severity] || 0) + count;
      });
    });
    const totalFindings = Object.values(totalSummary).reduce((sum, count) => sum + count, 0);
    const affectedCount = audited.filter((result) => Object.values(filteredCounts(result.report.summary, apiFilter)).some((count) => count > 0)).length;
    const worst = SPECTRAL_SEVERITY_ORDER.find((severity) => totalSummary[severity]);
    $('#source-stats').innerHTML = `
      <div class="stat"><dt>Repos audited</dt><dd>${audited.length}/${results.length}</dd></div>
      <div class="stat"><dt>Findings</dt><dd>${totalFindings}</dd></div>
      <div class="stat"><dt>Repos affected</dt><dd>${affectedCount}</dd></div>
      <div class="stat"><dt>Highest severity</dt><dd>${worst ? titleCase(worst) : '—'}</dd></div>`;
    return;
  }
  if (state.dashboardTab === 'metadata') {
    const results = state.repoMetadata || [];
    const scanned = results.filter((result) => result.metadata);
    const frameworkCounts = {};
    scanned.forEach((result) => metadataFrameworks(result.metadata).forEach((framework) => { frameworkCounts[framework] = (frameworkCounts[framework] || 0) + 1; }));
    const mostCommon = Object.entries(frameworkCounts).sort((a, b) => b[1] - a[1])[0];
    const withCommitDate = scanned.filter((result) => result.metadata.lastCommitDate);
    const stalest = [...withCommitDate].sort((a, b) => new Date(a.metadata.lastCommitDate) - new Date(b.metadata.lastCommitDate))[0];
    $('#source-stats').innerHTML = `
      <div class="stat"><dt>Repos scanned</dt><dd>${scanned.length}/${results.length}</dd></div>
      <div class="stat"><dt>Distinct frameworks</dt><dd>${Object.keys(frameworkCounts).length}</dd></div>
      <div class="stat"><dt>Most common</dt><dd>${mostCommon ? mostCommon[0] : '—'}</dd></div>
      <div class="stat"><dt>Longest since last commit</dt><dd>${stalest ? titleCase(stalest.source.name) : '—'}</dd></div>`;
    return;
  }
  if (state.dashboardTab === 'databases') {
    const { results, withTables } = databaseCoverage();
    const tables = withTables.flatMap((result) => result.schema.tables);
    const piiRepos = withTables.filter((result) => databasePiiCount(result.schema) > 0).length;
    $('#source-stats').innerHTML = `
      <div class="stat"><dt>Repos with a database</dt><dd>${withTables.length}/${results.length}</dd></div>
      <div class="stat"><dt>Tables</dt><dd>${tables.length}</dd></div>
      <div class="stat"><dt>Tables with PII</dt><dd>${tables.filter((table) => table.hasPii === true).length}</dd></div>
      <div class="stat"><dt>Repos with PII</dt><dd>${piiRepos}</dd></div>`;
    return;
  }
  const { results, scanned, totalOpen, affectedCount, worstSeverity } = dependabotStats();
  $('#source-stats').innerHTML = `
    <div class="stat"><dt>Repos scanned</dt><dd>${scanned.length}/${results.length}</dd></div>
    <div class="stat"><dt>Open alerts</dt><dd>${totalOpen}</dd></div>
    <div class="stat"><dt>Repos affected</dt><dd>${affectedCount}</dd></div>
    <div class="stat"><dt>Highest severity</dt><dd>${worstSeverity ? titleCase(worstSeverity) : '—'}</dd></div>`;
}

export function dependabotOpenCount(result, activeFilter) {
  return result.alerts ? Object.values(filteredCounts(result.alerts.severityCounts, activeFilter)).reduce((sum, count) => sum + count, 0) : null;
}

export function renderSecuritySection() {
  const { results, totalSeverityCounts, totalOpen } = dependabotStats();
  const dependabotFilter = state.dashboardFilters.dependabot;
  const sort = dashboardSortState('dependabot-summary', 'openAlerts', 'desc');
  const dependabotRowsAll = sortRows(results, sort, {
    name: (a, b, dir) => compareText(a.source.name, b.source.name, dir),
    openAlerts: (a, b, dir) => compareNumber(dependabotOpenCount(a, dependabotFilter), dependabotOpenCount(b, dependabotFilter), dir),
    lastScanned: (a, b, dir) => compareDate(a.alerts?.generatedAt, b.alerts?.generatedAt, dir)
  });
  const dependabotPage = paginate(dependabotRowsAll, 'dependabot-summary');

  return `<section class="dashboard-section">
    <h2>Code security audit</h2>
    <p class="section-sub">Open Dependabot alerts across ${results.length} cataloged repositories.</p>
    ${severityFilterHtml('dependabot', SEVERITY_ORDER, dependabotFilter, severityClass)}
    ${totalOpen ? `<div class="severity-summary">${severityPills(totalSeverityCounts)}</div>` : ''}
    <div class="table-wrap">
      <table class="data-table repo-alert-table">
        <thead><tr>${sortableHeaderCell('dependabot-summary', 'name', 'Repository')}${sortableHeaderCell('dependabot-summary', 'openAlerts', 'Open alerts')}<th>Severity</th>${sortableHeaderCell('dependabot-summary', 'lastScanned', 'Last scanned')}</tr></thead>
        <tbody>${dependabotPage.pageItems.map((item) => repoAlertRows(item, dependabotFilter)).join('')}</tbody>
      </table>
    </div>
    ${paginationHtml('dependabot-summary', dependabotPage.page, dependabotPage.totalPages, dependabotRowsAll.length)}
  </section>`;
}

export const DASHBOARD_TOOLBAR_META = {
  security: 'Dependabot alert data generated per repository — click a row for the full breakdown.',
  apiSecurity: "OWASP API Security Top 10 findings from linting each repository's generated OpenAPI specs — click a row for the full breakdown.",
  metadata: "Target framework(s), GitHub topics and last commit date read from each repository's generated metadata.",
  databases: "Generated database schemas per repository, with tables flagged as holding PII. Click a row for its tables."
};

export function wireDashboardTabs() {
  document.querySelectorAll('[data-dashboard-tab]').forEach((button) => {
    button.onclick = () => {
      if (button.dataset.dashboardTab === state.dashboardTab) return;
      state.dashboardTab = button.dataset.dashboardTab;
      renderHomeDashboard();
    };
  });
}

export function renderHomeDashboard() {
  if (!state.dashboardTab) state.dashboardTab = DASHBOARD_TABS[0].id;
  renderDashboardStats();
  toolbar.innerHTML = `<span class="toolbar-meta">${escapeHtml(DASHBOARD_TOOLBAR_META[state.dashboardTab])}</span>`;

  const tabsHtml = `<nav class="tabs dashboard-tabs" aria-label="Dashboard sections">
    ${DASHBOARD_TABS.map((tab) => `<button class="tab" type="button" data-dashboard-tab="${tab.id}" aria-selected="${state.dashboardTab === tab.id}">${escapeHtml(tab.label)}</button>`).join('')}
  </nav>`;

  const sectionHtml = state.dashboardTab === 'apiSecurity' ? renderApiSecuritySection()
    : state.dashboardTab === 'metadata' ? renderMetadataSection()
    : state.dashboardTab === 'databases' ? renderDatabasesSection()
    : renderSecuritySection();

  content.innerHTML = `<div class="dashboard">${tabsHtml}${sectionHtml}</div>`;

  wireDashboardTabs();
  wireDashboardRowToggles();
  wireDatabaseLinks();
  wireDashboardPagination();
  wireDashboardSeverityFilters();
  wireMetadataFrameworkFilter();
  wireSortableHeaders();
}

export function repoAlertRows({ source, alerts }, activeFilter) {
  const filteredSeverity = alerts ? filteredCounts(alerts.severityCounts, activeFilter) : {};
  const openCount = Object.values(filteredSeverity).reduce((sum, count) => sum + count, 0);
  const generatedAt = alerts?.generatedAt ? new Date(alerts.generatedAt).toLocaleDateString() : '—';
  const severity = alerts ? (severityPills(filteredSeverity) || '<span class="muted">None</span>') : '';
  const rowId = source.id;
  const expanded = state.dashboardExpanded.has(rowId);
  const summaryRow = `<tr class="repo-alert-row" data-toggle-alerts="${escapeHtml(rowId)}">
    <td><span class="repo-name">${escapeHtml(titleCase(source.name))}</span><span class="repo-slug">${escapeHtml(orgRepoSlug(source.repository))}</span></td>
    <td>${alerts ? openCount : '<span class="muted">Not scanned</span>'}</td>
    <td>${severity}</td>
    <td>${generatedAt}</td>
  </tr>`;
  const detailRow = `<tr class="repo-alert-detail-row" data-detail-for="${escapeHtml(rowId)}" ${expanded ? '' : 'hidden'}><td colspan="4"><div class="repo-alert-detail">${alertDetailTable(alerts, activeFilter, rowId)}</div></td></tr>`;
  return summaryRow + detailRow;
}

export function alertDetailTable(alerts, activeFilter, rowId) {
  if (!alerts) return '<p class="no-alerts-note">No open alerts.</p>';
  const filtered = (alerts.alerts || []).filter((alert) => activeFilter.has(alert.severity));
  if (!filtered.length) return '<p class="no-alerts-note">No alerts match the selected severities.</p>';
  const pageKey = `dependabot-detail-${rowId}`;
  const { pageItems, page, totalPages } = paginate(filtered, pageKey);
  return `<table class="data-table"><thead><tr><th>Severity</th><th>Package</th><th>Advisory</th><th>Patched version</th><th>Opened</th></tr></thead><tbody>${pageItems.map((alert) => `<tr>
    <td><span class="severity-pill ${severityClass(alert.severity)}">${escapeHtml(alert.severity || 'unknown')}</span></td>
    <td><code>${escapeHtml(alert.packageName)}</code></td>
    <td><a href="${escapeHtml(alert.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(alert.summary || alert.ghsaId || alert.cveId || `#${alert.number}`)}</a></td>
    <td>${escapeHtml(alert.firstPatchedVersion || 'None available')}</td>
    <td>${alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : '—'}</td>
  </tr>`).join('')}</tbody></table>${paginationHtml(pageKey, page, totalPages, filtered.length)}`;
}

export function apiFindingsCount(result, activeFilter) {
  return result.report ? Object.values(filteredCounts(result.report.summary, activeFilter)).reduce((sum, count) => sum + count, 0) : null;
}

export function renderApiSecuritySection() {
  const results = state.apiSecurityAudit || [];
  const apiFilter = state.dashboardFilters.apiSecurity;
  const audited = results.filter((result) => result.report);
  const totalSummary = {};
  audited.forEach((result) => {
    Object.entries(filteredCounts(result.report.summary, apiFilter)).forEach(([severity, count]) => {
      totalSummary[severity] = (totalSummary[severity] || 0) + count;
    });
  });
  const totalFindings = Object.values(totalSummary).reduce((sum, count) => sum + count, 0);
  const sort = dashboardSortState('apiSecurity-summary', 'findings', 'desc');
  const rowsAll = sortRows(results, sort, {
    name: (a, b, dir) => compareText(a.source.name, b.source.name, dir),
    specsAudited: (a, b, dir) => compareNumber(a.report?.specsAudited, b.report?.specsAudited, dir),
    findings: (a, b, dir) => compareNumber(apiFindingsCount(a, apiFilter), apiFindingsCount(b, apiFilter), dir),
    lastAudited: (a, b, dir) => compareDate(a.report?.generatedAt, b.report?.generatedAt, dir)
  });
  const page = paginate(rowsAll, 'apiSecurity-summary');

  return `<section class="dashboard-section">
    <h2>API security audit</h2>
    <p class="section-sub">OWASP API Security Top 10 findings from linting each repository's generated OpenAPI specs. Click a row for the full breakdown.</p>
    ${severityFilterHtml('apiSecurity', SPECTRAL_SEVERITY_ORDER, apiFilter, spectralSeverityClass)}
    ${totalFindings ? `<div class="severity-summary">${SPECTRAL_SEVERITY_ORDER.filter((severity) => totalSummary[severity]).map((severity) => spectralSeverityPill(severity, totalSummary[severity])).join('')}</div>` : ''}
    <div class="table-wrap">
      <table class="data-table repo-alert-table">
        <thead><tr>${sortableHeaderCell('apiSecurity-summary', 'name', 'Repository')}${sortableHeaderCell('apiSecurity-summary', 'specsAudited', 'Specs audited')}${sortableHeaderCell('apiSecurity-summary', 'findings', 'Findings')}${sortableHeaderCell('apiSecurity-summary', 'lastAudited', 'Last audited')}</tr></thead>
        <tbody>${page.pageItems.map((item) => apiAuditRows(item, apiFilter)).join('')}</tbody>
      </table>
    </div>
    ${paginationHtml('apiSecurity-summary', page.page, page.totalPages, rowsAll.length)}
  </section>`;
}

export function apiAuditRows({ source, report }, activeFilter) {
  const generatedAt = report?.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : '—';
  const filteredSummary = report ? filteredCounts(report.summary, activeFilter) : {};
  const pills = SPECTRAL_SEVERITY_ORDER.filter((severity) => filteredSummary[severity]).map((severity) => spectralSeverityPill(severity, filteredSummary[severity])).join('') || (report ? '<span class="muted">None</span>' : '');
  const rowId = `api-${source.id}`;
  const expanded = state.dashboardExpanded.has(rowId);
  const summaryRow = `<tr class="repo-alert-row" data-toggle-alerts="${escapeHtml(rowId)}">
    <td><span class="repo-name">${escapeHtml(titleCase(source.name))}</span><span class="repo-slug">${escapeHtml(orgRepoSlug(source.repository))}</span></td>
    <td>${report ? report.specsAudited : '<span class="muted">Not audited</span>'}</td>
    <td>${pills}</td>
    <td>${generatedAt}</td>
  </tr>`;
  const detailRow = `<tr class="repo-alert-detail-row" data-detail-for="${escapeHtml(rowId)}" ${expanded ? '' : 'hidden'}><td colspan="4"><div class="repo-alert-detail">${apiAuditDetailTable(report, activeFilter, rowId)}</div></td></tr>`;
  return summaryRow + detailRow;
}

export function groupApiFindings(findings, activeFilter) {
  const groups = new Map();
  for (const finding of findings) {
    if (!activeFilter.has(finding.severity)) continue;
    if (!groups.has(finding.code)) groups.set(finding.code, { code: finding.code, severity: finding.severity, message: finding.message, locations: [] });
    groups.get(finding.code).locations.push({ source: finding.source, line: finding.line });
  }
  return [...groups.values()].sort((a, b) => spectralSeverityRank(a.severity) - spectralSeverityRank(b.severity) || b.locations.length - a.locations.length);
}

// Links a generated file in the catalogue repository (e.g. an OpenAPI spec) to GitHub, at a line when known.
export function catalogueFileLink(path, line) {
  const label = `<code>${escapeHtml(path)}${line ? `:${line}` : ''}</code>`;
  if (!state.catalogueRepository) return label;
  const href = `${state.catalogueRepository}/blob/HEAD/${path.split('/').map(encodeURIComponent).join('/')}${line ? `#L${line}` : ''}`;
  return `<a class="source-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}<span aria-hidden="true"> ↗</span><span class="sr-only"> (opens on GitHub)</span></a>`;
}

export function apiAuditDetailTable(report, activeFilter, rowId) {
  if (!report) return '<p class="no-alerts-note">No findings.</p>';
  const groups = groupApiFindings(report.findings || [], activeFilter);
  if (!groups.length) return '<p class="no-alerts-note">No findings match the selected severities.</p>';
  const pageKey = `apiSecurity-detail-${rowId}`;
  const { pageItems, page, totalPages } = paginate(groups, pageKey);
  return `<table class="data-table"><thead><tr><th>Severity</th><th>Rule</th><th>Message</th><th>Occurrences</th><th>Example location</th></tr></thead><tbody>${pageItems.map((group) => {
    const example = group.locations[0];
    const exampleLink = example ? catalogueFileLink(example.source, example.line) : '—';
    const more = group.locations.length > 1 ? ` <span class="muted">+${group.locations.length - 1} more</span>` : '';
    return `<tr>
      <td><span class="severity-pill ${spectralSeverityClass(group.severity)}">${escapeHtml(group.severity)}</span></td>
      <td><code>${escapeHtml(group.code)}</code></td>
      <td>${escapeHtml(group.message)}</td>
      <td>${group.locations.length}</td>
      <td>${exampleLink}${more}</td>
    </tr>`;
  }).join('')}</tbody></table>${paginationHtml(pageKey, page, totalPages, groups.length)}`;
}

export function metadataFrameworks(metadata) {
  return [...new Set((metadata?.projects || []).flatMap((project) => project.targetFrameworks || []))].sort();
}

// The generator's dotnetSupport carries an end-of-support date per modern .NET moniker; .NET Framework
// and .NET Standard come back null by design, so they are never reported as out of support.
export function frameworkEndOfSupport(metadata, framework) {
  return (metadata?.dotnetSupport || []).find((entry) => entry.targetFramework === framework)?.endOfSupport || null;
}

export function isOutOfSupport(endOfSupport) {
  return Boolean(endOfSupport) && new Date(endOfSupport) < new Date();
}

export function outOfSupportFrameworks(metadata) {
  return metadataFrameworks(metadata).filter((framework) => isOutOfSupport(frameworkEndOfSupport(metadata, framework)));
}

export function frameworkBadge(metadata, framework) {
  const endOfSupport = frameworkEndOfSupport(metadata, framework);
  if (isOutOfSupport(endOfSupport)) {
    return `<span class="badge danger" title="Out of support since ${escapeHtml(new Date(endOfSupport).toLocaleDateString())}">${escapeHtml(framework)}</span>`;
  }
  const title = endOfSupport ? ` title="Supported until ${escapeHtml(new Date(endOfSupport).toLocaleDateString())}"` : '';
  return `<span class="badge"${title}>${escapeHtml(framework)}</span>`;
}

export function matchesFrameworkFilter(metadata, filter) {
  if (filter === 'all') return true;
  if (filter === 'out-of-support') return outOfSupportFrameworks(metadata).length > 0;
  return metadataFrameworks(metadata).includes(filter);
}

export function frameworkFilterHtml(results, filter) {
  const frameworks = [...new Set(results.flatMap((result) => metadataFrameworks(result.metadata)))].sort();
  const option = (value, label) => `<option value="${escapeHtml(value)}" ${filter === value ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  return `<label class="source-picker dashboard-filter" for="metadata-framework-filter"><span>Framework</span><select id="metadata-framework-filter">
    ${option('all', 'All frameworks')}${option('out-of-support', 'Out of support only')}${frameworks.map((framework) => option(framework, framework)).join('')}
  </select></label>`;
}

export function wireMetadataFrameworkFilter() {
  const select = $('#metadata-framework-filter');
  if (!select) return;
  select.onchange = () => {
    state.dashboardFilters.metadataFramework = select.value;
    state.dashboardPages.clear();
    renderHomeDashboard();
  };
}

export function renderMetadataSection() {
  const results = state.repoMetadata || [];
  const scanned = results.filter((result) => result.metadata);
  const frameworkFilter = state.dashboardFilters.metadataFramework;
  const filtered = results.filter((result) => matchesFrameworkFilter(result.metadata, frameworkFilter));
  const outOfSupportCount = scanned.filter((result) => outOfSupportFrameworks(result.metadata).length).length;
  const sort = dashboardSortState('metadata-summary', 'lastCommit', 'asc');
  const rowsAll = sortRows(filtered, sort, {
    name: (a, b, dir) => compareText(a.source.name, b.source.name, dir),
    projects: (a, b, dir) => compareNumber(a.metadata?.projects?.length, b.metadata?.projects?.length, dir),
    branch: (a, b, dir) => compareText(a.metadata?.ref, b.metadata?.ref, dir),
    lastCommit: (a, b, dir) => compareDate(a.metadata?.lastCommitDate, b.metadata?.lastCommitDate, dir)
  });
  const page = paginate(rowsAll, 'metadata-summary');

  return `<section class="dashboard-section">
    <h2>Metadata</h2>
    <p class="section-sub">Target framework(s), GitHub topics and last commit date read from each repository's generated metadata — ${scanned.length}/${results.length} repositories scanned${outOfSupportCount ? `; <span class="danger-text">${outOfSupportCount} on an out-of-support framework</span>` : ''}.</p>
    ${frameworkFilterHtml(scanned, frameworkFilter)}
    <div class="table-wrap">
      <table class="data-table repo-alert-table">
        <thead><tr>${sortableHeaderCell('metadata-summary', 'name', 'Repository')}<th>Target framework(s)</th><th>Topics</th>${sortableHeaderCell('metadata-summary', 'projects', 'Projects')}${sortableHeaderCell('metadata-summary', 'branch', 'Branch')}${sortableHeaderCell('metadata-summary', 'lastCommit', 'Last commit')}</tr></thead>
        <tbody>${page.pageItems.map(metadataRows).join('') || '<tr><td colspan="6" class="muted">No repositories match this framework.</td></tr>'}</tbody>
      </table>
    </div>
    ${paginationHtml('metadata-summary', page.page, page.totalPages, rowsAll.length)}
  </section>`;
}

export function metadataRows({ source, metadata, topics }) {
  const frameworks = metadata ? metadataFrameworks(metadata) : [];
  const lastCommit = metadata?.lastCommitDate ? new Date(metadata.lastCommitDate).toLocaleDateString() : '—';
  return `<tr>
    <td><span class="repo-name">${escapeHtml(titleCase(source.name))}</span><span class="repo-slug">${escapeHtml(orgRepoSlug(source.repository))}</span></td>
    <td>${metadata ? (frameworks.map((framework) => frameworkBadge(metadata, framework)).join(' ') || '<span class="muted">None found</span>') : '<span class="muted">Not scanned</span>'}</td>
    <td>${topics ? (topics.length ? `<span class="topic-list">${topics.map((topic) => `<span class="badge blue">${escapeHtml(topic)}</span>`).join('')}</span>` : '<span class="muted">None</span>') : '<span class="muted">—</span>'}</td>
    <td>${metadata ? metadata.projects.length : '—'}</td>
    <td>${metadata ? `<code>${escapeHtml(metadata.ref)}</code>` : '—'}</td>
    <td>${lastCommit}</td>
  </tr>`;
}

export function databasePiiCount(schema) {
  return schema ? (schema.tables || []).filter((table) => table.hasPii === true).length : null;
}

export function piiBadge(hasPii) {
  if (hasPii === true) return '<span class="badge danger">Yes</span>';
  if (hasPii === false) return '<span class="badge success">No</span>';
  return '<span class="muted">Unclassified</span>';
}

export function databasePiiCell(schema) {
  const tables = schema.tables;
  const piiCount = databasePiiCount(schema);
  if (piiCount) return `${piiBadge(true)} <span class="muted">${piiCount} of ${tables.length} tables</span>`;
  return tables.every((table) => table.hasPii === false) ? piiBadge(false) : piiBadge(null);
}

// Only repos whose schema has tables are listed; the rest are summarised in one line.
export function databaseCoverage() {
  const results = state.databaseSchemas || [];
  return {
    results,
    withTables: results.filter((result) => result.schema?.tables?.length),
    noTables: results.filter((result) => result.schema && !result.schema.tables?.length),
    notScanned: results.filter((result) => !result.schema)
  };
}

export function renderDatabasesSection() {
  const { withTables, noTables, notScanned } = databaseCoverage();
  const sort = dashboardSortState('databases-summary', 'piiTables', 'desc');
  const rowsAll = sortRows(withTables, sort, {
    name: (a, b, dir) => compareText(a.source.name, b.source.name, dir),
    database: (a, b, dir) => compareText(a.schema?.database?.name, b.schema?.database?.name, dir),
    tables: (a, b, dir) => compareNumber(a.schema?.tables?.length, b.schema?.tables?.length, dir),
    piiTables: (a, b, dir) => compareNumber(databasePiiCount(a.schema), databasePiiCount(b.schema), dir)
  });
  const page = paginate(rowsAll, 'databases-summary');

  return `<section class="dashboard-section">
    <h2>Databases</h2>
    <p class="section-sub">${withTables.length} ${withTables.length === 1 ? 'repository has' : 'repositories have'} a database${noTables.length ? `; ${noTables.length} scanned with no tables` : ''}${notScanned.length ? `; ${notScanned.length} not scanned` : ''}. Click a row to see which tables hold PII.</p>
    <div class="table-wrap">
      <table class="data-table repo-alert-table">
        <thead><tr>${sortableHeaderCell('databases-summary', 'name', 'Repository')}${sortableHeaderCell('databases-summary', 'database', 'Database')}${sortableHeaderCell('databases-summary', 'tables', 'Tables')}${sortableHeaderCell('databases-summary', 'piiTables', 'Contains PII')}<th>Links</th></tr></thead>
        <tbody>${page.pageItems.map(databaseRows).join('')}</tbody>
      </table>
    </div>
    ${paginationHtml('databases-summary', page.page, page.totalPages, rowsAll.length)}
  </section>`;
}

export function databaseRows({ source, schema }) {
  const rowId = `db-${source.id}`;
  const expanded = state.dashboardExpanded.has(rowId);
  const database = schema.database;
  const scanUrl = scanSourceUrl(source.repository, source.scans.dbschema);
  const links = `<div class="badges dashboard-links">
      <button class="badge blue as-link" type="button" data-open-schema="${escapeHtml(source.id)}">View schema →</button>
      ${scanUrl ? `<a class="badge as-link" href="${escapeHtml(scanUrl)}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ''}
      <a class="badge as-link" href="/api/sources/${encodeURIComponent(source.id)}/database" target="_blank" rel="noopener noreferrer">JSON ↗</a>
    </div>`;
  const summaryRow = `<tr class="repo-alert-row" data-toggle-alerts="${escapeHtml(rowId)}">
    <td><span class="repo-name">${escapeHtml(titleCase(source.name))}</span><span class="repo-slug">${escapeHtml(orgRepoSlug(source.repository))}</span></td>
    <td>${database?.name ? `<code>${escapeHtml(database.name)}</code>${database.engine ? `<span class="repo-slug">${escapeHtml(database.engine)}</span>` : ''}` : '<span class="muted">—</span>'}</td>
    <td>${schema.tables.length}</td>
    <td>${databasePiiCell(schema)}</td>
    <td>${links}</td>
  </tr>`;
  const detailRow = `<tr class="repo-alert-detail-row" data-detail-for="${escapeHtml(rowId)}" ${expanded ? '' : 'hidden'}><td colspan="5"><div class="repo-alert-detail">${databaseTablesDetail(source, schema, rowId)}</div></td></tr>`;
  return summaryRow + detailRow;
}

export function databaseTablesDetail(source, schema, rowId) {
  const tables = schema.tables;
  // PII tables first so the answer to "what holds personal data?" is at the top of the list.
  const ordered = [...tables].sort((a, b) => Number(b.hasPii === true) - Number(a.hasPii === true) || compareText(tableLabel(a), tableLabel(b)));
  const pageKey = `databases-detail-${rowId}`;
  const { pageItems, page, totalPages } = paginate(ordered, pageKey);
  return `<table class="data-table"><thead><tr><th>Table</th><th>Columns</th><th>Relationships</th><th>Indexes</th><th>Contains PII</th></tr></thead><tbody>${pageItems.map((table) => `<tr>
    <td><button class="as-link" type="button" data-open-table="${escapeHtml(source.id)}" data-table-schema="${escapeHtml(table.schema || '')}" data-table-name="${escapeHtml(table.name)}" title="Open in ${escapeHtml(titleCase(source.name))}'s database schema"><code>${escapeHtml(tableLabel(table))}</code></button></td>
    <td>${(table.columns || []).length}</td>
    <td>${(table.relationships || []).length}</td>
    <td>${(table.indexes || []).length}</td>
    <td>${piiBadge(table.hasPii)}</td>
  </tr>`).join('')}</tbody></table>${paginationHtml(pageKey, page, totalPages, ordered.length)}`;
}

export function wireDatabaseLinks() {
  // Links sit inside a clickable summary row; stop the click from also toggling the row.
  document.querySelectorAll('.dashboard-links a, .dashboard-links button').forEach((link) => {
    link.addEventListener('click', (event) => event.stopPropagation());
  });
  document.querySelectorAll('[data-open-schema]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      openSourceView(button.dataset.openSchema, 'database');
    };
  });
  document.querySelectorAll('[data-open-table]').forEach((button) => {
    button.onclick = async (event) => {
      event.stopPropagation();
      const { openTable: sourceId, tableSchema, tableName } = button.dataset;
      await openSourceView(sourceId, 'database');
      // The standalone detail covers tables the diagram leaves out (those with no foreign keys).
      if (state.source?.id !== sourceId || state.view !== 'database') return;
      const table = (state.data?.tables || []).find((candidate) => candidate.name === tableName && (candidate.schema || '') === tableSchema);
      if (table) renderTableDetail(table);
    };
  });
}
