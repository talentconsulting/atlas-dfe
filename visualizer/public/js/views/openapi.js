// A repository's API specs view: operations, models and schemas.
import { $, content, toolbar } from '../dom.js';
import { state } from '../state.js';
import { alphabetical, escapeHtml } from '../util.js';
import { loadView, searchControl, wireSearch } from './source.js';

export function operations(spec) {
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
  return alphabetical(Object.entries(spec.paths || {}), ([path]) => path)
    .flatMap(([path, value]) => methods.filter((method) => value[method]).map((method) => ({ path, method, ...value[method] })));
}

export function apiInfo() {
  return state.data.info || {};
}

export function apiInfoBanner() {
  const info = apiInfo();
  if (!info.title && !info.version && !info.description) return '';
  return `<div class="api-info">
    <h2>${escapeHtml(info.title || 'API')}</h2>
    ${info.version ? `<span class="badge blue">v${escapeHtml(info.version)}</span>` : ''}
    ${info.description ? `<p class="muted">${escapeHtml(info.description)}</p>` : ''}
  </div>`;
}

export function resolveRef(ref) {
  if (!ref || !ref.startsWith('#/components/schemas/')) return null;
  const name = ref.replace('#/components/schemas/', '');
  const schema = state.data.components?.schemas?.[name];
  return schema ? { name, schema } : null;
}

export function schemaTypeLabel(schema = {}) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    return resolved ? resolved.name : schema.$ref.split('/').pop();
  }
  if (schema.type === 'array') return `${schemaTypeLabel(schema.items || {})}[]`;
  if (schema.enum) return 'enum';
  return [schema.type, schema.format].filter(Boolean).join(' · ') || 'object';
}

export function schemaRefPill(name) {
  return `<button class="model-pill" type="button" data-model="${escapeHtml(name)}">${escapeHtml(name)}</button>`;
}

export function renderSchemaSummary(schema = {}) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    return resolved ? schemaRefPill(resolved.name) : `<code>${escapeHtml(schema.$ref.split('/').pop())}</code>`;
  }
  if (schema.type === 'array') return `array&lt;${renderSchemaSummary(schema.items || {})}&gt;`;
  if (schema.enum) return schema.enum.map((value) => `<span class="badge">${escapeHtml(String(value))}</span>`).join(' ');
  return `<code>${escapeHtml([schema.type, schema.format].filter(Boolean).join(' · ') || 'object')}</code>`;
}

export function renderSchemaTable(schema, seen = new Set()) {
  if (!schema) return '<p class="muted">No schema.</p>';
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    if (!resolved) return `<p class="muted">Unresolved reference <code>${escapeHtml(schema.$ref)}</code></p>`;
    if (seen.has(resolved.name)) return `<p class="muted">${schemaRefPill(resolved.name)} — circular reference</p>`;
    return `${schemaRefPill(resolved.name)}${renderSchemaTable(resolved.schema, new Set([...seen, resolved.name]))}`;
  }
  if (schema.type === 'array') {
    return `<p class="schema-hint">Array of:</p>${renderSchemaTable(schema.items || {}, seen)}`;
  }
  if (schema.enum) {
    return `<div class="enum-values">${schema.enum.map((value) => `<span class="badge amber">${escapeHtml(String(value))}</span>`).join(' ')}</div>`;
  }
  const properties = Object.entries(schema.properties || {});
  if (!properties.length) {
    return `<p class="muted">${escapeHtml(schemaTypeLabel(schema))}${schema.description ? ` — ${escapeHtml(schema.description)}` : ''}${schema.additionalProperties ? ' · additional properties allowed' : ''}</p>`;
  }
  const required = new Set(schema.required || []);
  return `<div class="table-wrap"><table class="data-table schema-table"><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody>${properties.map(([key, value]) => {
    const nestedSchema = !value.$ref && value.type === 'object' && value.properties ? value : (!value.$ref && value.type === 'array' && value.items && !value.items.$ref && value.items.type === 'object' && value.items.properties ? value.items : null);
    return `<tr>
      <td><code>${escapeHtml(key)}</code>${required.has(key) ? ' <span class="required-mark" title="Required">*</span>' : ''}${value.nullable ? ' <span class="badge">nullable</span>' : ''}</td>
      <td>${renderSchemaSummary(value)}</td>
      <td class="muted">${escapeHtml(value.description || '—')}</td>
    </tr>${nestedSchema ? `<tr class="nested-row"><td></td><td colspan="2"><details><summary>Show fields</summary>${renderSchemaTable(nestedSchema, seen)}</details></td></tr>` : ''}`;
  }).join('')}</tbody></table></div>`;
}

export function requestBody(body) {
  if (!body) return '';
  const media = body.content?.['application/json'] || Object.values(body.content || {})[0];
  return `<h3>Request body${body.required ? ' <span class="badge amber">required</span>' : ''}</h3>${media?.schema ? renderSchemaTable(media.schema) : '<p class="muted">No schema.</p>'}`;
}

export function responseBlock(status, response) {
  const media = response.content?.['application/json'] || Object.values(response.content || {})[0];
  return `<div class="response-block">
    <div class="response-head"><span class="response-code">${escapeHtml(status)}</span><span>${escapeHtml(response.description || 'No description')}</span>${media?.schema ? `<span class="muted">${renderSchemaSummary(media.schema)}</span>` : ''}</div>
    ${media?.schema ? `<details class="response-schema"><summary>Schema</summary>${renderSchemaTable(media.schema)}</details>` : ''}
  </div>`;
}

export function wireModelLinks() {
  document.querySelectorAll('[data-model]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      state.apiView = 'schemas';
      state.selectedModel = button.dataset.model;
      renderOpenApi(true);
    });
  });
}

export function renderModels() {
  const schemas = state.data.components?.schemas || {};
  const names = Object.keys(schemas).sort((a, b) => a.localeCompare(b));
  if (!names.length) {
    content.innerHTML = `<div class="openapi-view">${apiInfoBanner()}<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>No component schemas</h2><p>This specification does not define any reusable models.</p></div></div>`;
    return;
  }
  if (!state.selectedModel || !names.includes(state.selectedModel)) state.selectedModel = names[0];
  content.innerHTML = `<div class="openapi-view">${apiInfoBanner()}<div class="split"><aside class="item-list">${names.map((name) => `<button class="list-button" type="button" data-model-select="${escapeHtml(name)}" aria-current="${state.selectedModel === name}"><span class="list-title">${escapeHtml(name)}</span><span class="list-meta">${schemaTypeLabel(schemas[name])} · ${Object.keys(schemas[name].properties || {}).length} fields</span></button>`).join('')}</aside><div class="detail">${modelDetail(state.selectedModel, schemas[state.selectedModel])}</div></div></div>`;
  document.querySelectorAll('[data-model-select]').forEach((button) => button.addEventListener('click', () => { state.selectedModel = button.dataset.modelSelect; renderOpenApi(true); }));
  wireModelLinks();
}

export function modelDetail(name, schema) {
  return `<span class="badge blue">${escapeHtml(schemaTypeLabel(schema))}</span>
    <h2>${escapeHtml(name)}</h2>
    ${schema.description ? `<p class="detail-subtitle">${escapeHtml(schema.description)}</p>` : ''}
    ${renderSchemaTable(schema, new Set([name]))}
    <details><summary>Raw schema JSON</summary><pre>${escapeHtml(JSON.stringify(schema, null, 2))}</pre></details>`;
}

export function renderOpenApi(resetToolbar = true) {
  if (!state.apiView) state.apiView = 'operations';
  const ops = operations(state.data);
  const schemaCount = Object.keys(state.data.components?.schemas || {}).length;
  if (resetToolbar) {
    const postmanLinks = `<a class="plain-button" href="/api/sources/${encodeURIComponent(state.source.id)}/postman-collection" title="Downloads all ${state.source.apiFiles.length} specs for this repo as one collection">Postman collection ↓</a><a class="plain-button" href="/api/sources/${encodeURIComponent(state.source.id)}/postman-environment" title="Companion environment with empty baseUrl/auth variable placeholders">Postman environment ↓</a>`;
    toolbar.innerHTML = `<label class="source-picker" for="api-file"><span>Specification</span><select id="api-file">${state.source.apiFiles.map((file) => `<option value="${escapeHtml(file)}" ${file === state.apiFile ? 'selected' : ''}>${escapeHtml(file.replace('.openapi.json', ''))}</option>`).join('')}</select></label>${state.apiView === 'operations' ? searchControl('Filter paths or operations') : ''}${schemaCount ? `<div class="segmented" role="group" aria-label="OpenAPI view"><button data-api-view="operations" aria-pressed="${state.apiView === 'operations'}">Operations</button><button data-api-view="schemas" aria-pressed="${state.apiView === 'schemas'}">Schemas</button></div>` : ''}${postmanLinks}<span class="spacer"></span><span class="toolbar-meta">${ops.length} operations · ${schemaCount} models</span>`;
    const apiFile = $('#api-file');
    if (apiFile) apiFile.onchange = async (event) => { state.apiFile = event.target.value; state.selected = null; state.selectedModel = null; await loadView(); };
    document.querySelectorAll('[data-api-view]').forEach((button) => { button.onclick = () => { state.apiView = button.dataset.apiView; state.filter = ''; renderOpenApi(true); }; });
  }
  if (state.apiView === 'schemas') { renderModels(); return; }
  const filtered = ops.filter((op) => `${op.method} ${op.path} ${op.summary} ${(op.tags || []).join(' ')}`.toLowerCase().includes(state.filter));
  if (!state.selected || !filtered.some((op) => `${op.method}:${op.path}` === state.selected)) state.selected = filtered[0] ? `${filtered[0].method}:${filtered[0].path}` : null;
  const selected = ops.find((op) => `${op.method}:${op.path}` === state.selected);
  content.innerHTML = `<div class="openapi-view">${apiInfoBanner()}<div class="split"><aside class="item-list">${filtered.map((op) => `<button class="list-button" type="button" data-operation="${escapeHtml(`${op.method}:${op.path}`)}" aria-current="${state.selected === `${op.method}:${op.path}`}"><span class="list-title"><span class="method ${op.method}">${op.method}</span><span class="endpoint-path">${escapeHtml(op.path)}</span></span><span class="list-meta">${escapeHtml(op.summary || op.operationId || 'No summary')}</span></button>`).join('') || '<div class="detail muted">No matching operations.</div>'}</aside><div class="detail">${selected ? operationDetail(selected) : ''}</div></div></div>`;
  wireSearch();
  document.querySelectorAll('[data-operation]').forEach((button) => button.addEventListener('click', () => { state.selected = button.dataset.operation; renderOpenApi(false); }));
  wireModelLinks();
}

export function operationDetail(op) {
  const parameters = op.parameters || [];
  const responses = Object.entries(op.responses || {});
  return `<span class="method ${op.method}">${op.method}</span><h2 class="endpoint-path">${escapeHtml(op.path)}</h2><p class="detail-subtitle">${escapeHtml(op.summary || op.operationId || 'No summary')}</p>
    ${op.description ? `<p>${escapeHtml(op.description)}</p>` : ''}<div class="badges">${(op.tags || []).map((tag) => `<span class="badge blue">${escapeHtml(tag)}</span>`).join('')}</div>
    <h3>Parameters</h3>${parameters.length ? `<table class="data-table"><thead><tr><th>Name</th><th>Location</th><th>Type</th><th>Required</th></tr></thead><tbody>${parameters.map((parameter) => `<tr><td><code>${escapeHtml(parameter.name)}</code></td><td>${escapeHtml(parameter.in)}</td><td>${renderSchemaSummary(parameter.schema || {})}</td><td>${parameter.required ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No parameters.</p>'}
    ${requestBody(op.requestBody)}
    <h3>Responses</h3>${responses.length ? responses.map(([status, response]) => responseBlock(status, response)).join('') : '<p class="muted">No responses documented.</p>'}
    <details><summary>Raw operation JSON</summary><pre>${escapeHtml(JSON.stringify(op, null, 2))}</pre></details>`;
}
