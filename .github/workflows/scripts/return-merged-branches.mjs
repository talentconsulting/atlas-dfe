// Points manifest nodes that scan a named "branch" back at the repository's default branch once that
// branch is merged into it (every commit on the branch is also on the default branch) or deleted.
//
//   node .github/workflows/scripts/return-merged-branches.mjs [manifest.json]
//
// Rewrites the manifest in place and prints a Markdown summary of what changed (nothing when no node
// changed). Reads GitHub with GITHUB_TOKEN when set; the source repositories here are public.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const GITHUB_REPO_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/;

async function githubJson(path, token, fetchImpl) {
  const response = await fetchImpl(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'atlas-return-merged-branches',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status} for ${path}`);
  return response.json();
}

// Why a branch no longer needs scanning, or null while it still has commits of its own.
export async function branchStatus(owner, repo, branch, { token, fetchImpl = fetch } = {}) {
  const repository = await githubJson(`/repos/${owner}/${repo}`, token, fetchImpl);
  if (!repository) throw new Error(`Repository ${owner}/${repo} was not found`);
  const defaultBranch = repository.default_branch;
  const comparison = await githubJson(
    `/repos/${owner}/${repo}/compare/${encodeURIComponent(defaultBranch)}...${encodeURIComponent(branch)}`, token, fetchImpl
  );
  if (!comparison) return { defaultBranch, reason: 'deleted' };
  if (comparison.ahead_by === 0) return { defaultBranch, reason: 'merged' };
  return null;
}

export async function returnMergedBranches(manifest, options = {}) {
  const changes = [];
  const statuses = new Map();
  for (const entry of manifest) {
    const match = GITHUB_REPO_RE.exec(entry['github-repo'] || '');
    if (!match) continue;
    const [, owner, repo] = match;
    for (const [nodeName, node] of Object.entries(entry)) {
      if (!node || typeof node !== 'object' || typeof node.branch !== 'string') continue;
      const key = `${owner}/${repo}@${node.branch}`;
      if (!statuses.has(key)) statuses.set(key, await branchStatus(owner, repo, node.branch, options));
      const status = statuses.get(key);
      if (!status) continue;
      const folder = String(node['path-to-scan'] || '').split('/').filter(Boolean).join('/');
      const from = node.branch;
      delete node.branch;
      node['path-to-scan'] = ['tree', status.defaultBranch, ...(folder ? [folder] : [])].join('/');
      // A different branch's commits: rescan rather than trust the hash recorded for the feature branch.
      node['last-commit-hash-scanned'] = '';
      delete node['in-progress'];
      changes.push({ repository: `${owner}/${repo}`, node: nodeName, from, to: node['path-to-scan'], reason: status.reason });
    }
  }
  return changes;
}

export function summary(changes) {
  if (!changes.length) return '';
  const rows = changes.map((change) =>
    `| ${change.repository} | ${change.node} | \`${change.from}\` ${change.reason === 'merged' ? 'is merged' : 'was deleted'} | \`${change.to}\` |`);
  return [
    'These manifest nodes scanned a feature branch that has since been merged into the default branch, or deleted.',
    'Each now scans the default branch again, with its commit hash cleared so the next run rescans it.',
    '',
    '| Repository | Node | Branch | Now scans |',
    '|---|---|---|---|',
    ...rows
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] || 'manifest.json';
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const changes = await returnMergedBranches(manifest, { token: process.env.GITHUB_TOKEN });
  if (changes.length) await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(summary(changes));
}
