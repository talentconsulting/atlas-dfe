import { content, homeToggle, landscapeToggle, serviceToggle, sourceSelect, tabs, testDataToggle, topicsToggle } from './js/dom.js';
import { applyMode, modeFromPath, resolveSourceId, sourceIdFromPath } from './js/navigation.js';
import { state } from './js/state.js';
import { alphabetical, escapeHtml, getJson, titleCase } from './js/util.js';
import { selectTableTab, TABLE_TABS } from './js/views/database.js';
import { loadHomeDashboard, setHomeHero } from './js/views/home.js';
import { loadLandscape, setLandscapeHero } from './js/views/landscape.js';
import { loadView, renderTabs, selectSource } from './js/views/source.js';
import { loadTestDataPage } from './js/views/testdata.js';
import { loadTopics, setTopicsHero } from './js/views/topics.js';

content.addEventListener('click', (event) => {
  const tab = event.target.closest?.('[data-table-tab]');
  if (tab) selectTableTab(tab.parentElement, tab.dataset.tableTab, false);
});

content.addEventListener('keydown', (event) => {
  const tab = event.target.closest?.('[data-table-tab]');
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!tab || !step) return;
  event.preventDefault();
  const next = TABLE_TABS[(TABLE_TABS.indexOf(tab.dataset.tableTab) + step + TABLE_TABS.length) % TABLE_TABS.length];
  selectTableTab(tab.parentElement, next, true);
});

tabs.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-view]');
  if (!button || button.disabled || button.dataset.view === state.view) return;
  state.view = button.dataset.view;
  state.selected = null;
  renderTabs();
  await loadView();
});

// ---- Test data page: tick repositories, tick their tables, get one script per database ----------

sourceSelect.addEventListener('change', async () => {
  state.mode = 'source';
  history.pushState({}, '', `/service/${encodeURIComponent(sourceSelect.value)}`);
  applyMode();
  await selectSource(sourceSelect.value);
});

homeToggle.addEventListener('click', async (event) => {
  if (state.mode === 'home') return;
  event.preventDefault();
  state.mode = 'home';
  history.pushState({}, '', '/');
  applyMode();
  setHomeHero();
  await loadHomeDashboard();
});

landscapeToggle.addEventListener('click', async (event) => {
  if (state.mode === 'landscape') return;
  event.preventDefault();
  state.mode = 'landscape';
  history.pushState({}, '', '/landscape');
  applyMode();
  setLandscapeHero();
  await loadLandscape();
});

topicsToggle.addEventListener('click', async (event) => {
  if (state.mode === 'topics') return;
  event.preventDefault();
  state.mode = 'topics';
  history.pushState({}, '', '/topics');
  applyMode();
  setTopicsHero();
  await loadTopics();
});

testDataToggle.addEventListener('click', async (event) => {
  if (state.mode === 'testdata') return;
  event.preventDefault();
  state.mode = 'testdata';
  history.pushState({}, '', '/test-data');
  applyMode();
  await loadTestDataPage();
});

serviceToggle.addEventListener('click', async (event) => {
  if (state.mode === 'source') return;
  event.preventDefault();
  state.mode = 'source';
  const sourceId = resolveSourceId(sourceSelect.value);
  history.pushState({}, '', `/service/${encodeURIComponent(sourceId)}`);
  applyMode();
  sourceSelect.value = sourceId;
  await selectSource(sourceId);
});

window.addEventListener('popstate', async () => {
  const mode = modeFromPath(window.location.pathname);
  if (mode === state.mode) return;
  state.mode = mode;
  applyMode();
  if (mode === 'landscape') {
    setLandscapeHero();
    await loadLandscape();
  } else if (mode === 'topics') {
    setTopicsHero();
    await loadTopics();
  } else if (mode === 'testdata') {
    await loadTestDataPage();
  } else if (mode === 'source') {
    const sourceId = resolveSourceId(sourceIdFromPath(window.location.pathname));
    sourceSelect.value = sourceId;
    await selectSource(sourceId);
  } else {
    setHomeHero();
    await loadHomeDashboard();
  }
});

async function init() {
  try {
    const catalog = await getJson('/api/catalog');
    state.catalog = alphabetical(catalog.sources, (source) => titleCase(source.name));
    state.catalogueRepository = catalog.catalogueRepository || null;
    if (!state.catalog.length) throw new Error('The manifest does not contain any sources.');
    sourceSelect.innerHTML = state.catalog.map((source) => `<option value="${source.id}">${escapeHtml(titleCase(source.name))}</option>`).join('');
    sourceSelect.value = state.catalog[0].id;
    state.mode = modeFromPath(window.location.pathname);
    applyMode();
    if (state.mode === 'landscape') {
      setLandscapeHero();
      await loadLandscape();
    } else if (state.mode === 'topics') {
      setTopicsHero();
      await loadTopics();
    } else if (state.mode === 'testdata') {
      await loadTestDataPage();
    } else if (state.mode === 'source') {
      const sourceId = resolveSourceId(sourceIdFromPath(window.location.pathname));
      sourceSelect.value = sourceId;
      await selectSource(sourceId);
    } else {
      setHomeHero();
      await loadHomeDashboard();
    }
  } catch (error) {
    content.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

init();
