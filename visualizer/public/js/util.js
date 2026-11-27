// Small shared helpers: HTML escaping, name formatting, sorting, fetching JSON and GitHub links.
import { state } from './state.js';

export const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
export const titleCase = (value) => value.replace(/(^|[-_])(\w)/g, (_, space, char) => `${space ? ' ' : ''}${char.toUpperCase()}`);

export async function getJson(url) {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

export async function getText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.text();
}

export function orgRepoSlug(repositoryUrl) {
  return (repositoryUrl || '').replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
}

// A manifest node either carries its branch in path-to-scan (tree/<branch>/<folder>) or names it in
// "branch", with path-to-scan then just the folder within that branch.
export function scanSourceUrl(repositoryUrl, node) {
  const scanPath = node?.['path-to-scan'];
  if (typeof scanPath !== 'string' || !repositoryUrl) return '';
  const repository = repositoryUrl.replace(/\/$/, '');
  if (!node.branch) return scanPath ? `${repository}/${scanPath}` : '';
  const folder = scanPath.split('/').filter(Boolean).join('/');
  return `${repository}/tree/${node.branch}${folder ? `/${folder}` : ''}`;
}

export function splitPascalCase(value) {
  // "DfE" (Department for Education) is one word, not "Df E".
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/\bDf E\b/g, 'DfE');
}

export function orgName(repository) {
  return (repository || '').split('/')[0] || 'System';
}

export function orgFromRepoUrl(url) {
  return (url || '').replace(/^https?:\/\/[^/]+\//, '').split('/')[0] || 'System';
}

// Missing values (null/undefined/empty) always sort to the end, regardless of direction — only
// real values swap order when the column's sort direction is flipped, which is why the helpers
// take the direction rather than having sortRows negate their result.
export function compareMissing(a, b) {
  const aMissing = a == null || a === '';
  const bMissing = b == null || b === '';
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return null;
}

// Lists in the viewer are alphabetical by what is displayed, ignoring case.
export function alphabetical(items, label = (item) => item.name) {
  return [...items].sort((a, b) => String(label(a) ?? '').localeCompare(String(label(b) ?? ''), undefined, { sensitivity: 'base', numeric: true }));
}

export function compareText(a, b, dir = 1) {
  return compareMissing(a, b) ?? a.localeCompare(b) * dir;
}

export function compareNumber(a, b, dir = 1) {
  return compareMissing(a, b) ?? (a - b) * dir;
}

export function compareDate(a, b, dir = 1) {
  return compareNumber(a ? new Date(a).getTime() : null, b ? new Date(b).getTime() : null, dir);
}

export function tableLabel(table) {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
}

export function githubFileUrl(path, scanKind = 'eventcatalog', context = null) {
  if (!path) return null;
  const repository = context?.repository ?? state.source.repository;
  const ref = context ? context.ref : state.data?.ref;
  const scans = context?.scans ?? state.source.scans;
  const revision = ref || scans?.[scanKind]?.['last-commit-hash-scanned'] || 'HEAD';
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${repository.replace(/\/$/, '')}/blob/${encodeURIComponent(revision)}/${encodedPath}`;
}

export function sourceLink(path, scanKind = 'eventcatalog', context = null) {
  const url = githubFileUrl(path, scanKind, context);
  if (!url) return '<span class="muted">Not recorded</span>';
  return `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><code>${escapeHtml(path)}</code><span aria-hidden="true"> ↗</span><span class="sr-only"> (opens on GitHub)</span></a>`;
}
