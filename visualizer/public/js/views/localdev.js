// A repository's Local dev view.
import { content, toolbar } from '../dom.js';
import { state } from '../state.js';
import { alphabetical, escapeHtml, sourceLink } from '../util.js';
import { dependencyEvidence } from './dependencies.js';
import { searchControl, wireSearch } from './source.js';

export function localServiceCard(service) {
  return `<article class="service-card">
    <div class="badges"><span class="badge blue">${escapeHtml(service.kind || 'service')}</span>${service.technology ? `<span class="badge">${escapeHtml(service.technology)}</span>` : ''}</div>
    <h3>${escapeHtml(service.name)}</h3>
    ${service.configurationKeys?.length ? `<ul class="code-list">${service.configurationKeys.map((key) => `<li><code>${escapeHtml(key)}</code></li>`).join('')}</ul>` : '<p class="muted">No configuration keys recorded.</p>'}
    ${service.evidence?.length ? `<details><summary>${service.evidence.length} evidence item${service.evidence.length === 1 ? '' : 's'}</summary>${dependencyEvidence(service.evidence, 'localdev')}</details>` : ''}
  </article>`;
}

export function renderLocalDev(resetToolbar = true) {
  const services = alphabetical(state.data.localServices || []);
  const keys = alphabetical(state.data.configurationKeys || [], (entry) => entry.key);
  if (resetToolbar) toolbar.innerHTML = `${searchControl('Filter services or configuration keys')}<span class="spacer"></span><span class="toolbar-meta">${services.length} local service${services.length === 1 ? '' : 's'} · ${keys.length} configuration keys</span>`;
  const filteredServices = services.filter((service) => `${service.name} ${service.kind} ${service.technology}`.toLowerCase().includes(state.filter));
  const filteredKeys = keys.filter((entry) => `${entry.key} ${entry.sourceFile} ${entry.reason}`.toLowerCase().includes(state.filter));
  if (!services.length && !keys.length) {
    content.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>No local dev configuration recorded</h2><p>The generated local-dev-config catalogue is empty.</p></div>';
    return;
  }
  content.innerHTML = `<div class="localdev-view">
    <section>
      <h2>Local services required</h2>
      ${filteredServices.length ? `<div class="service-cards">${filteredServices.map(localServiceCard).join('')}</div>` : '<p class="muted">No matching services.</p>'}
    </section>
    <section>
      <h2>Configuration keys</h2>
      ${filteredKeys.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Key</th><th>Source</th><th>Notes</th></tr></thead><tbody>${filteredKeys.map((entry) => `<tr><td><code>${escapeHtml(entry.key)}</code></td><td>${sourceLink(entry.sourceFile, 'localdev')}</td><td class="muted">${escapeHtml(entry.reason || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No matching configuration keys.</p>'}
    </section>
  </div>`;
  wireSearch();
}

// ---- User journeys ----
// A journey is drawn on its own (the whole page graph is too dense to read): linear journeys left to right; hub
// journeys as the path into the hub, its sections stacked beside it with dashed returns, then the way on.
