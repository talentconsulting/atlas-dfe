// Which top-level page is showing (home, landscape, topics, test data, service) and reading it from the address.
import { homeToggle, landscapeToggle, serviceToggle, sourceSelect, testDataToggle, topicsToggle } from './dom.js';
import { state } from './state.js';

export function applyMode() {
  document.body.dataset.mode = state.mode;
  homeToggle.toggleAttribute('aria-current', state.mode === 'home');
  landscapeToggle.toggleAttribute('aria-current', state.mode === 'landscape');
  topicsToggle.toggleAttribute('aria-current', state.mode === 'topics');
  testDataToggle.toggleAttribute('aria-current', state.mode === 'testdata');
  serviceToggle.toggleAttribute('aria-current', state.mode === 'source');
}

export function modeFromPath(pathname) {
  if (pathname === '/landscape') return 'landscape';
  if (pathname === '/topics') return 'topics';
  if (pathname === '/test-data') return 'testdata';
  if (pathname === '/service' || pathname.startsWith('/service/')) return 'source';
  return 'home';
}

export function sourceIdFromPath(pathname) {
  const match = pathname.match(/^\/service\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function resolveSourceId(requestedId) {
  if (state.catalog.some((source) => source.id === requestedId)) return requestedId;
  return sourceSelect.value || state.catalog[0].id;
}
