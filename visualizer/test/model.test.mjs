import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';
import {
  addQueueMessageDependencies, bestMatchingSystem, buildLandscape, canRelate, combineDependencies, isPlatformDependency,
  relationshipLabel, tokenize, usesRedis
} from '../public/js/model.js';
import { state } from '../public/js/state.js';

const fixtures = new URL('./fixtures/catalogue/', import.meta.url);
const read = async (path) => { try { return JSON.parse(await readFile(new URL(path, fixtures), 'utf8')); } catch { return null; } };
const tokens = (value) => new Set(tokenize(value));

// The landscape as the System landscape page builds it, from the fixture catalogue.
async function fixtureLandscape(options) {
  const manifest = await read('manifest.json');
  state.catalog = manifest.map((entry) => { const id = entry['github-repo'].split('/').pop(); return { id, name: id, repository: entry['github-repo'] }; });
  const messagesById = new Map();
  const sets = [];
  for (const source of state.catalog) {
    const dependencies = await read(`${source.id}/service-dependencies/resolved-dependencies.json`) ?? await read(`${source.id}/service-dependencies/service-dependencies.json`);
    const messages = await read(`${source.id}/event-catalog/events-and-commands.json`);
    messagesById.set(source.id, messages);
    const data = combineDependencies(source, dependencies, messages);
    if (data.dependencies?.length) sets.push({ source, ref: data.ref, dependencies: data.dependencies });
  }
  addQueueMessageDependencies(sets, (id) => messagesById.get(id));
  return buildLandscape(state.catalog, sets, options);
}

describe('matching dependency names to systems', () => {
  test('tokenize drops the das prefix and api suffix, splits PascalCase and singularises', () => {
    assert.deepEqual(tokenize('das-employer-accounts-api'), ['employer', 'account']);
    assert.deepEqual(tokenize('Employer Accounts API'), ['employer', 'account']);
    assert.deepEqual(tokenize('ProviderRelationships'), ['provider', 'relationship']);
  });

  test('a dependency name relates to a system whose name contains its words', () => {
    assert.equal(canRelate(tokens('Employer Accounts'), tokens('das-employer-accounts')), true);
    assert.equal(canRelate(tokens('Commitments'), tokens('das-courses-api')), false);
  });

  test('of several matching systems, the one with fewest extra words wins', () => {
    const candidates = [{ id: 'apprentice', name: 'das-apprentice-accounts-web' }, { id: 'employer', name: 'das-employer-accounts' }];
    assert.equal(bestMatchingSystem(tokens('Accounts'), candidates, (candidate) => tokens(candidate.name))?.id, 'employer');
  });
});

describe('describing dependencies', () => {
  test('Redis is recognised from the dependency, other stores are not', () => {
    assert.equal(usesRedis({ kind: 'cache', name: 'Redis', technology: 'Redis' }), true);
    assert.equal(usesRedis({ kind: 'database', name: 'SQL', technology: 'SQL Server' }), false);
  });

  test('platform services are kept off the landscape', () => {
    for (const kind of ['telemetry', 'configuration-store', 'identity-provider']) assert.equal(isPlatformDependency({ kind }), true, kind);
    assert.equal(isPlatformDependency({ kind: 'http-api' }), false);
  });

  test('an outbound HTTP call is labelled with its protocol', () => {
    assert.equal(relationshipLabel({ kind: 'http-api', direction: 'outbound', technology: 'HTTPS' }), 'Calls [HTTP/HTTPS]');
  });
});

describe('the system landscape', () => {
  test('every catalogued repository is a system, including ones with nothing scanned', async () => {
    const landscape = await fixtureLandscape();
    assert.deepEqual(landscape.systems.map((system) => system.id).sort(), [
      'sys:das-admin-roatp-web', 'sys:das-commitments', 'sys:das-courses-api', 'sys:das-learning', 'sys:das-not-yet-scanned', 'sys:das-payments-v2-common'
    ]);
    assert.ok(!landscape.edges.some((edge) => edge.from === 'sys:das-not-yet-scanned' || edge.to === 'sys:das-not-yet-scanned'));
  });

  test('calls routed through APIM link to the inner API, labelled with the gateway area', async () => {
    const landscape = await fixtureLandscape();
    assert.equal(landscape.gatewayLabel, 'APIM');
    const edge = landscape.edges.find((candidate) => candidate.from === 'sys:das-commitments' && candidate.to === 'sys:das-courses-api');
    assert.ok(edge, 'das-commitments calls das-courses-api');
    assert.deepEqual([...edge.via], ['APIM (Approvals)']);
  });

  test('with the gateway drawn as a proxy, calls go through gateway areas', async () => {
    const landscape = await fixtureLandscape({ proxy: true });
    const has = (from, to) => landscape.edges.some((edge) => edge.from === from && edge.to === to);
    assert.ok(has('sys:das-commitments', 'gateway:Approvals'));
    assert.ok(has('gateway:Approvals', 'sys:das-courses-api'));
    assert.ok(!has('sys:das-commitments', 'sys:das-courses-api'), 'no direct edge once the proxy is drawn');
  });

  test('dependencies on systems outside the catalogue become external systems', async () => {
    const landscape = await fixtureLandscape();
    assert.ok(landscape.externals.length > 0);
    for (const external of landscape.externals) assert.match(external.id, /^ext:/);
    assert.ok(landscape.edges.every((edge) => edge.from.startsWith('sys:')), 'every edge starts at a catalogued system');
  });
});
