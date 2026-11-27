// A repository's page: its header, view tabs, loading each view's data and the shared filter box.
import { $, content, sourceSelect, tabs, toolbar } from '../dom.js';
import { destroyCy } from '../graph.js';
import { loadDependenciesFor } from '../model.js';
import { applyMode } from '../navigation.js';
import { state } from '../state.js';
import { escapeHtml, getJson, titleCase } from '../util.js';
import { renderDatabase } from './database.js';
import { renderDependencies } from './dependencies.js';
import { renderJourneys } from './journeys.js';
import { renderLocalDev } from './localdev.js';
import { renderMessages } from './messages.js';
import { renderOpenApi } from './openapi.js';

export function sourceCapabilities() {
  return [
    { id: 'database', label: 'Data schema', enabled: state.source.capabilities.database },
    { id: 'messages', label: 'Events & commands', enabled: state.source.capabilities.messages },
    { id: 'dependencies', label: 'Dependencies', enabled: state.source.capabilities.dependencies || state.source.capabilities.messages },
    { id: 'openapi', label: 'API specs', enabled: state.source.capabilities.openapi },
    { id: 'localdev', label: 'Local dev', enabled: state.source.capabilities.localdev },
    { id: 'journeys', label: 'Journeys', enabled: state.source.capabilities.journeys }
  ];
}

export function renderTabs() {
  tabs.innerHTML = sourceCapabilities().map((tab) => `
    <button class="tab" type="button" data-view="${tab.id}" aria-selected="${state.view === tab.id}" ${tab.enabled ? '' : 'disabled'}>
      ${tab.label}${tab.enabled ? '' : '<span class="count">—</span>'}
    </button>`).join('');
}

export function setHero() {
  $('#mode-eyebrow').textContent = 'Architecture inventory';
  $('#source-title').textContent = titleCase(state.source.name);
  const link = $('#repo-link');
  link.textContent = state.source.repository.replace('https://github.com/', 'github.com/');
  link.href = state.source.repository;
  const available = sourceCapabilities().filter((tab) => tab.enabled).length;
  const commit = Object.values(state.source.scans)[0]?.['last-commit-hash-scanned'] || '';
  $('#source-stats').innerHTML = `
    <div class="stat"><dt>Views</dt><dd>${available}</dd></div>
    <div class="stat"><dt>API specs</dt><dd>${state.source.apiFiles.length}</dd></div>
    <div class="stat"><dt>Commit</dt><dd title="${escapeHtml(commit)}">${escapeHtml(commit.slice(0, 7))}</dd></div>`;
}

export function defaultView() {
  return sourceCapabilities().find((item) => item.enabled)?.id || 'database';
}

export async function selectSource(id) {
  state.source = state.catalog.find((source) => source.id === id);
  const supportsView = state.view === 'dependencies'
    ? state.source.capabilities.dependencies || state.source.capabilities.messages
    : state.source.capabilities[state.view];
  if (!supportsView) state.view = defaultView();
  state.filter = '';
  state.selected = null;
  state.apiFile = state.source.apiFiles[0] || null;
  setHero();
  renderTabs();
  await loadView();
}

export async function loadView() {
  destroyCy();
  toolbar.innerHTML = '';
  content.innerHTML = '<div class="loading">Reading catalogue data…</div>';
  state.filter = '';
  state.selected = null;
  state.selectedModel = null;
  state.journey = null;
  state.diagramPositions = null;
  state.schemaPositions = null;
  state.depView = 'diagram';
  state.pumlSource = null;
  state.pumlEncoded = null;
  try {
    if (state.view === 'dependencies') {
      state.data = await loadDependenciesFor(state.source);
    } else {
      let url = `/api/sources/${encodeURIComponent(state.source.id)}/${state.view}`;
      if (state.view === 'openapi') url += `?file=${encodeURIComponent(state.apiFile)}`;
      state.data = await getJson(url);
    }
    renderView();
  } catch (error) {
    content.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

export function searchControl(placeholder) {
  // Show what was typed, capitals included, unless the filter has since been reset.
  const text = state.filterText?.toLowerCase() === state.filter ? state.filterText : state.filter;
  return `<input id="search" type="search" value="${escapeHtml(text)}" placeholder="${placeholder}" aria-label="${placeholder}">`;
}

export function wireSearch() {
  const search = $('#search');
  if (!search) return;
  search.oninput = (event) => {
    const { value, selectionStart, selectionEnd } = event.target;
    state.filterText = value;
    state.filter = value.toLowerCase();
    renderView(false);
    // Some views rebuild the toolbar, replacing the box; put the focus and cursor back where they were.
    const box = $('#search');
    if (!box) return;
    if (box.value !== value) box.value = value;
    box.focus();
    box.setSelectionRange(selectionStart, selectionEnd);
  };
}

export async function openSourceView(sourceId, view) {
  state.mode = 'source';
  history.pushState({}, '', `/service/${encodeURIComponent(sourceId)}`);
  applyMode();
  sourceSelect.value = sourceId;
  state.view = view;
  await selectSource(sourceId);
}

export async function jumpToSource(sourceId, dependencyIndex = null) {
  const target = state.catalog.find((source) => source.id === sourceId);
  state.mode = 'source';
  history.pushState({}, '', `/service/${encodeURIComponent(sourceId)}`);
  applyMode();
  sourceSelect.value = sourceId;
  if (target && (target.capabilities.dependencies || target.capabilities.messages)) state.view = 'dependencies';
  await selectSource(sourceId);
  if (state.view === 'dependencies' && dependencyIndex !== null) {
    state.selected = String(dependencyIndex);
    renderDependencies(false);
  }
}

export function renderView(resetToolbar = true) {
  if (state.view === 'database') renderDatabase(resetToolbar);
  if (state.view === 'messages') renderMessages(resetToolbar);
  if (state.view === 'dependencies') renderDependencies(resetToolbar);
  if (state.view === 'openapi') renderOpenApi(resetToolbar);
  if (state.view === 'localdev') renderLocalDev(resetToolbar);
  if (state.view === 'journeys') renderJourneys(resetToolbar);
}
