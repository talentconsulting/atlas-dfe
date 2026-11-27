import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { state } from '../public/js/state.js';
import {
  alphabetical, compareDate, compareNumber, compareText, escapeHtml, githubFileUrl, orgRepoSlug, scanSourceUrl, splitPascalCase, tableLabel, titleCase
} from '../public/js/util.js';

describe('text', () => {
  test('escapeHtml escapes every character that could break out of HTML or an attribute', () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    assert.equal(escapeHtml(), '');
    assert.equal(escapeHtml(42), '42');
  });

  test('titleCase turns repository names into titles', () => {
    assert.equal(titleCase('das-employer-accounts'), 'Das Employer Accounts');
    assert.equal(titleCase('local_dev_config'), 'Local Dev Config');
  });

  test('splitPascalCase keeps acronyms together', () => {
    assert.equal(splitPascalCase('DfESignInAuth'), 'DfE Sign In Auth');
    assert.equal(splitPascalCase('ApprovalsOuterApi'), 'Approvals Outer Api');
  });

  test('tableLabel leaves out a missing schema', () => {
    assert.equal(tableLabel({ schema: 'dbo', name: 'Commitment' }), 'dbo.Commitment');
    assert.equal(tableLabel({ schema: null, name: 'Commitment' }), 'Commitment');
  });
});

describe('sorting', () => {
  test('alphabetical ignores case and orders numbers naturally', () => {
    assert.deepEqual(alphabetical([{ name: 'b' }, { name: 'A' }, { name: 'item10' }, { name: 'item9' }]).map((item) => item.name), ['A', 'b', 'item9', 'item10']);
  });

  test('comparisons put missing values last', () => {
    assert.ok(compareText('a', 'B') < 0);
    assert.ok(compareText(null, 'a') > 0);
    assert.ok(compareNumber(2, 10) < 0);
    assert.ok(compareNumber(undefined, 1) > 0);
    assert.ok(compareDate('2026-01-01', '2025-01-01') > 0);
  });
});

describe('GitHub links', () => {
  test('repository slugs and scan locations come from the manifest entry', () => {
    assert.equal(orgRepoSlug('https://github.com/SkillsFundingAgency/das-commitments'), 'SkillsFundingAgency/das-commitments');
    assert.equal(scanSourceUrl('https://github.com/SkillsFundingAgency/das-commitments', { 'path-to-scan': 'tree/main/src' }), 'https://github.com/SkillsFundingAgency/das-commitments/tree/main/src');
  });

  test('source files link to the scanned repository at the scanned commit', () => {
    state.source = {
      repository: 'https://github.com/SkillsFundingAgency/das-commitments/',
      scans: { eventcatalog: { 'last-commit-hash-scanned': 'abc123' }, dbschema: { 'last-commit-hash-scanned': 'def456' } }
    };
    state.data = null;
    assert.equal(githubFileUrl('src/Events/Cohort Created.cs'), 'https://github.com/SkillsFundingAgency/das-commitments/blob/abc123/src/Events/Cohort%20Created.cs');
    assert.equal(githubFileUrl('src/Db.cs', 'dbschema'), 'https://github.com/SkillsFundingAgency/das-commitments/blob/def456/src/Db.cs');
    state.data = { ref: 'feature/x' };
    assert.equal(githubFileUrl('src/A.cs'), 'https://github.com/SkillsFundingAgency/das-commitments/blob/feature%2Fx/src/A.cs', 'the data file\'s own ref wins');
    assert.equal(githubFileUrl('src/A.cs', 'eventcatalog', { repository: 'https://github.com/o/r', ref: null, scans: {} }), 'https://github.com/o/r/blob/HEAD/src/A.cs');
    assert.equal(githubFileUrl(''), null);
  });
});
