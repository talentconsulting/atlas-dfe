import assert from 'node:assert/strict';
import test from 'node:test';

import { returnMergedBranches, summary } from '../return-merged-branches.mjs';

// A fake GitHub: each repository's default branch, and how far each branch is ahead of it (absent = deleted).
function fakeGitHub(repositories) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const path = new URL(url).pathname;
    const repoMatch = /^\/repos\/([^/]+)\/([^/]+)$/.exec(path);
    const compareMatch = /^\/repos\/([^/]+)\/([^/]+)\/compare\/([^.]+)\.\.\.(.+)$/.exec(path);
    const reply = (status, body) => ({ status, ok: status < 400, json: async () => body });
    if (repoMatch) {
      const repo = repositories[repoMatch[2]];
      return repo ? reply(200, { default_branch: repo.defaultBranch }) : reply(404, {});
    }
    if (compareMatch) {
      const ahead = repositories[compareMatch[2]]?.branches[decodeURIComponent(compareMatch[4])];
      return ahead === undefined ? reply(404, {}) : reply(200, { ahead_by: ahead });
    }
    return reply(404, {});
  };
  return { fetchImpl, calls };
}

const node = (extra = {}) => ({ branch: 'feature/funding-projection', 'path-to-scan': 'src', 'last-commit-hash-scanned': 'a'.repeat(40), ...extra });

test('a merged branch goes back to the default branch with its hash cleared', async () => {
  const manifest = [{ 'github-repo': 'https://github.com/org/finance', dbschema: node(), specs: { 'path-to-scan': 'tree/main/src', 'last-commit-hash-scanned': 'b'.repeat(40) } }];
  const { fetchImpl } = fakeGitHub({ finance: { defaultBranch: 'main', branches: { 'feature/funding-projection': 0 } } });

  const changes = await returnMergedBranches(manifest, { fetchImpl });

  assert.deepEqual(manifest[0].dbschema, { 'path-to-scan': 'tree/main/src', 'last-commit-hash-scanned': '' });
  assert.deepEqual(manifest[0].specs, { 'path-to-scan': 'tree/main/src', 'last-commit-hash-scanned': 'b'.repeat(40) });
  assert.deepEqual(changes, [{ repository: 'org/finance', node: 'dbschema', from: 'feature/funding-projection', to: 'tree/main/src', reason: 'merged' }]);
});

test('a deleted branch goes back too, onto a master default branch, keeping a root folder', async () => {
  const manifest = [{ 'github-repo': 'https://github.com/org/apim', 'service-dependencies': node({ 'path-to-scan': '' }) }];
  const { fetchImpl } = fakeGitHub({ apim: { defaultBranch: 'master', branches: {} } });

  const changes = await returnMergedBranches(manifest, { fetchImpl });

  assert.equal(manifest[0]['service-dependencies']['path-to-scan'], 'tree/master');
  assert.equal(changes[0].reason, 'deleted');
});

test('a branch with commits of its own is left alone', async () => {
  const manifest = [{ 'github-repo': 'https://github.com/org/finance', dbschema: node() }];
  const before = structuredClone(manifest);
  const { fetchImpl } = fakeGitHub({ finance: { defaultBranch: 'main', branches: { 'feature/funding-projection': 12 } } });

  assert.deepEqual(await returnMergedBranches(manifest, { fetchImpl }), []);
  assert.deepEqual(manifest, before);
});

test('each repository branch is checked once however many nodes scan it', async () => {
  const manifest = [{ 'github-repo': 'https://github.com/org/finance', dbschema: node(), specs: node(), eventcatalog: node() }];
  const { fetchImpl, calls } = fakeGitHub({ finance: { defaultBranch: 'main', branches: { 'feature/funding-projection': 0 } } });

  const changes = await returnMergedBranches(manifest, { fetchImpl });

  assert.equal(changes.length, 3);
  assert.equal(calls.length, 2);
});

test('the summary is empty when nothing changed and a table otherwise', () => {
  assert.equal(summary([]), '');
  const text = summary([{ repository: 'org/apim', node: 'service-dependencies', from: 'feature/x', to: 'tree/master/src', reason: 'deleted' }]);
  assert.match(text, /\| org\/apim \| service-dependencies \| `feature\/x` was deleted \| `tree\/master\/src` \|/);
});
