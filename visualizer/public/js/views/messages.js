// A repository's Events & commands view.
import { content, toolbar } from '../dom.js';
import { state } from '../state.js';
import { escapeHtml, sourceLink, titleCase } from '../util.js';
import { searchControl, wireSearch } from './source.js';

export function messages() {
  const events = (state.data.events || []).map((message) => ({ ...message, kind: 'event' }));
  const commands = (state.data.commands || []).map((message) => ({ ...message, kind: 'command' }));
  return [...events, ...commands].sort((a, b) => a.name.localeCompare(b.name));
}

export function renderMessages(resetToolbar = true) {
  const all = messages();
  if (resetToolbar) toolbar.innerHTML = `${searchControl('Filter events and commands')}<div class="segmented" role="group" aria-label="Message type"><button data-kind="all" aria-pressed="${state.messageType === 'all'}">All</button><button data-kind="event" aria-pressed="${state.messageType === 'event'}">Events</button><button data-kind="command" aria-pressed="${state.messageType === 'command'}">Commands</button></div><span class="spacer"></span><span class="toolbar-meta">${state.data.events?.length || 0} events · ${state.data.commands?.length || 0} commands</span>`;
  const filtered = all.filter((message) => (state.messageType === 'all' || message.kind === state.messageType) && `${message.name} ${message.namespace} ${message.sourceFile}`.toLowerCase().includes(state.filter));
  if (!state.selected || !filtered.some((message) => `${message.kind}:${message.name}` === state.selected)) state.selected = filtered[0] ? `${filtered[0].kind}:${filtered[0].name}` : null;
  const selected = all.find((message) => `${message.kind}:${message.name}` === state.selected);
  content.innerHTML = `<div class="split"><aside class="item-list">${filtered.map((message) => `<button class="list-button" type="button" data-message="${escapeHtml(`${message.kind}:${message.name}`)}" aria-current="${state.selected === `${message.kind}:${message.name}`}"><span class="list-title">${escapeHtml(message.name)}</span><span class="list-meta">${titleCase(message.kind)} · ${message.fields?.length || 0} fields · ${message.handlers?.length || 0} handlers</span></button>`).join('') || '<div class="detail muted">No matching messages.</div>'}</aside><div class="detail">${selected ? messageDetail(selected) : ''}</div></div>`;
  wireSearch();
  document.querySelectorAll('[data-kind]').forEach((button) => { button.onclick = () => { state.messageType = button.dataset.kind; state.selected = null; renderMessages(true); }; });
  document.querySelectorAll('[data-message]').forEach((button) => button.addEventListener('click', () => { state.selected = button.dataset.message; renderMessages(false); }));
}

export function messageDetail(message) {
  return `<span class="badge ${message.kind === 'command' ? 'amber' : ''}">${message.kind}</span><h2>${escapeHtml(message.name)}</h2><p class="detail-subtitle">${escapeHtml(message.namespace || 'Namespace not recorded')}</p>
    <h3>Payload</h3>${message.fields?.length ? `<table class="data-table"><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>${message.fields.map((field) => `<tr><td><code>${escapeHtml(field.name)}</code></td><td>${escapeHtml(field.type)}</td><td>${field.required ? 'Yes' : 'No'}</td><td class="muted">${escapeHtml(field.description || '—')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No payload fields recorded.</p>'}
    <h3>Handlers</h3>${message.handlers?.length ? message.handlers.map((handler) => `<p><strong>${escapeHtml(handler.name)}</strong><br>${sourceLink(handler.sourceFile)}</p>`).join('') : '<p class="muted">No handlers recorded.</p>'}
    <h3>Source</h3>${sourceLink(message.sourceFile)}`;
}
