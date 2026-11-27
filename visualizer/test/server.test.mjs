import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { after, before, describe, test } from 'node:test';

// The tests read a small fixed catalogue (test/fixtures/catalogue), never the live one, so a merged
// catalogue pull request can't break them. See test/fixtures/README.md for what each repository covers.
const fixtures = new URL('./fixtures/catalogue/', import.meta.url);
process.env.NODE_ENV = 'test';
process.env.CATALOGUE_DATA_DIR = fixtures.pathname;
process.env.CATALOGUE_REPOSITORY_URL = 'https://github.com/example/atlas-fixtures';
const { server } = await import('../server.mjs');
const fixture = async (path) => JSON.parse(await readFile(new URL(path, fixtures), 'utf8'));
let baseUrl;
const get = (path, options) => fetch(`${baseUrl}${path}`, options);
const getJson = async (path) => (await get(path)).json();
const source = async (id) => (await getJson('/api/catalog')).sources.find((item) => item.id === id);

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

describe('catalogue', () => {
  test('lists every manifest repository in manifest order, keyed by repository name', async () => {
    const manifest = await fixture('manifest.json');
    const body = await getJson('/api/catalog');
    assert.deepEqual(body.sources.map((item) => item.id), manifest.map((entry) => entry['github-repo'].split('/').pop()));
    assert.equal(body.catalogueRepository, 'https://github.com/example/atlas-fixtures');
    const commitments = body.sources.find((item) => item.id === 'das-commitments');
    assert.equal(commitments.repository, 'https://github.com/SkillsFundingAgency/das-commitments');
    assert.deepEqual(commitments.apiFiles, ['ApprenticeshipController.openapi.json', 'CohortController.openapi.json']);
  });

  test('reports what each repository has, from the files present', async () => {
    const capabilities = Object.fromEntries((await getJson('/api/catalog')).sources.map((item) => [item.id, item.capabilities]));
    assert.deepEqual(capabilities['das-commitments'], {
      database: true, databaseScanned: true, messages: true, dependencies: true, dependencyDiagram: true, openapi: true,
      security: true, localdev: true, journeys: false, apiSecurity: true, metadata: true, topics: true
    });
    assert.equal(capabilities['das-courses-api'].messages, false, 'no event catalogue');
    assert.equal(capabilities['das-learning'].security, false, 'no Dependabot data');
    assert.equal(capabilities['das-admin-roatp-web'].journeys, true);
    assert.ok(Object.values(capabilities['das-not-yet-scanned']).every((value) => value === false), 'nothing generated yet');
  });

  test('a schema scan with no tables counts as scanned, but gives no Data schema tab', async () => {
    const payments = await source('das-payments-v2-common');
    assert.equal(payments.capabilities.database, false);
    assert.equal(payments.capabilities.databaseScanned, true);
  });
});

describe('per-repository data', () => {
  test('database returns the generated schema', async () => {
    const response = await get('/api/sources/das-commitments/database');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), await fixture('das-commitments/db-schema/database.schema.json'));
  });

  test('messages returns the event catalogue', async () => {
    const body = await getJson('/api/sources/das-commitments/messages');
    assert.equal(body.events.length, 6);
    assert.equal(body.commands.length, 6);
  });

  test('dependencies prefers the APIM-resolved file when present', async () => {
    const body = await getJson('/api/sources/das-commitments/dependencies');
    assert.deepEqual(body, await fixture('das-commitments/service-dependencies/resolved-dependencies.json'));
    assert.ok(body.resolution);
    assert.ok(body.dependencies.some((dependency) => dependency.targetRepo === 'das-courses-api' && dependency.via?.area === 'Approvals'));
  });

  test('the dependency diagram returns the PlantUML source', async () => {
    const response = await get('/api/sources/das-commitments/dependency-diagram');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.match(await response.text(), /@startuml/);
  });

  for (const [kind, repo, file] of [
    ['localdev', 'das-commitments', 'local-dev-config/local-dev-config.json'],
    ['journeys', 'das-admin-roatp-web', 'user-journeys/user-journeys.json'],
    ['security', 'das-courses-api', 'dependency-alerts/dependabot-alerts.json'],
    ['apisecurity', 'das-commitments', 'api-security-audit/report.json'],
    ['metadata', 'das-commitments', 'repo-metadata/repo-metadata.json'],
    ['topics', 'das-commitments', 'repo-topics/repo-topics.json']
  ]) {
    test(`${kind} returns ${file}`, async () => {
      const response = await get(`/api/sources/${repo}/${kind}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), await fixture(`${repo}/${file}`));
    });
  }

  test('a kind of data the repository has no file for is a 404', async () => {
    assert.equal((await get('/api/sources/das-learning/security')).status, 404);
    assert.equal((await get('/api/sources/das-not-yet-scanned/database')).status, 404);
  });

  test('an unknown repository or kind is a 404', async () => {
    assert.equal((await get('/api/sources/does-not-exist/database')).status, 404);
    assert.equal((await get('/api/sources/das-commitments/not-a-kind')).status, 404);
    assert.equal((await get('/api/nothing-here')).status, 404);
  });
});

describe('OpenAPI', () => {
  test('returns a catalogued spec', async () => {
    const response = await get(`/api/sources/das-commitments/openapi?file=${encodeURIComponent('CohortController.openapi.json')}`);
    assert.equal(response.status, 200);
    assert.ok((await response.json()).paths['/api/cohorts']);
  });

  test('refuses files that are not catalogued specs', async () => {
    for (const file of ['../manifest.json', '../../server.mjs', 'Missing.openapi.json', '']) {
      assert.equal((await get(`/api/sources/das-commitments/openapi?file=${encodeURIComponent(file)}`)).status, 400, file);
    }
    assert.equal((await get('/api/sources/das-commitments/openapi')).status, 400);
  });

  test('Postman collection and environment download as files, built from every spec', async () => {
    const collection = await get('/api/sources/das-commitments/postman-collection');
    assert.equal(collection.status, 200);
    assert.match(collection.headers.get('content-disposition'), /attachment; filename="das-commitments\.postman_collection\.json"/);
    const body = await collection.json();
    assert.equal(body.info.name, 'das-commitments');
    assert.equal(body.item.length, 2, 'one folder per spec');
    const environment = await get('/api/sources/das-commitments/postman-environment');
    assert.equal(environment.status, 200);
    assert.ok(Array.isArray((await environment.json()).values));
  });

  test('Postman downloads are a 404 without specs', async () => {
    assert.equal((await get('/api/sources/das-payments-v2-common/postman-collection')).status, 404);
  });
});

describe('pages that read every repository', () => {
  test('the dashboard has every tab\'s data for every repository', async () => {
    const catalog = await getJson('/api/catalog');
    const body = await getJson('/api/dashboard');
    assert.deepEqual(body.sources.map((item) => item.id), catalog.sources.map((item) => item.id));
    for (const item of body.sources) assert.deepEqual(Object.keys(item).sort(), ['apiSecurity', 'database', 'id', 'metadata', 'security', 'topics']);
    const byId = Object.fromEntries(body.sources.map((item) => [item.id, item]));
    assert.equal(byId['das-commitments'].database.tables.length, (await fixture('das-commitments/db-schema/database.schema.json')).tables.length);
    assert.deepEqual(byId['das-payments-v2-common'].database.tables, [], 'scanned but empty');
    assert.equal(byId['das-not-yet-scanned'].database, null, 'never scanned');
    assert.equal(byId['das-learning'].security, null);
    assert.deepEqual(byId['das-commitments'].topics, (await fixture('das-commitments/repo-topics/repo-topics.json')).topics);
  });

  test('the landscape has dependencies, messages and topics for every repository that has them', async () => {
    const catalog = await getJson('/api/catalog');
    const body = await getJson('/api/landscape');
    assert.equal(body.sources.length, catalog.sources.length);
    for (const item of catalog.sources) {
      const entry = body.sources.find((candidate) => candidate.id === item.id);
      assert.equal(entry.dependencies !== null, item.capabilities.dependencies, item.id);
      assert.equal(entry.messages !== null, item.capabilities.messages, item.id);
    }
  });

  test('JSON is gzipped when the client accepts it', async () => {
    const headers = await new Promise((resolve, reject) => {
      request(`${baseUrl}/api/landscape`, { headers: { 'accept-encoding': 'gzip' } }, (response) => { response.resume(); resolve(response.headers); }).on('error', reject).end();
    });
    assert.equal(headers['content-encoding'], 'gzip');
  });
});

describe('pages and static files', () => {
  test('every page address serves the app', async () => {
    const index = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
    for (const path of ['/', '/landscape', '/topics', '/test-data', '/service', '/service/das-commitments']) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.equal(await response.text(), index, path);
    }
  });

  test('scripts are served as JavaScript, including the modules under js/', async () => {
    for (const path of ['/app.js', '/js/model.js', '/js/views/database.js', '/testdata.js']) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get('content-type'), /^text\/javascript/, path);
    }
  });

  test('a missing file is a 404, and paths outside the app are refused', async () => {
    assert.equal((await get('/no-such-file.js')).status, 404);
    assert.equal((await get('/..%2Fserver.mjs')).status, 400);
    // The URL parser resolves %2E%2E itself, so this lands inside public/ and simply isn't found.
    const dotted = await get('/%2E%2E/%2E%2E/manifest.json');
    assert.equal(dotted.status, 404);
    assert.doesNotMatch(await dotted.text(), /github-repo/, 'the manifest must not be served');
  });
});

// Login settings are read at start-up, so these run the server in its own process.
async function freePort() {
  const probe = createServer();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function startServer(env) {
  const port = await freePort();
  const child = spawn(process.execPath, [new URL('../server.mjs', import.meta.url).pathname], {
    env: { ...process.env, NODE_ENV: 'production', CATALOGUE_DATA_DIR: fixtures.pathname, PORT: String(port), ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    child.stdout.on('data', (chunk) => { if (String(chunk).includes('listening')) resolve(); });
    child.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
  });
  return { url: `http://127.0.0.1:${port}`, stop: () => child.kill() };
}

describe('login', () => {
  const basic = (user, password) => ({ authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}` });

  test('with a password set, every request needs the username and password', async () => {
    const app = await startServer({ AUTH_PASSWORD: 'fixture-password', AUTH_USERNAME: 'reviewer' });
    try {
      const anonymous = await fetch(`${app.url}/api/catalog`);
      assert.equal(anonymous.status, 401);
      assert.match(anonymous.headers.get('www-authenticate'), /^Basic realm="TalentSuite Atlas"/);
      assert.equal((await fetch(`${app.url}/`)).status, 401, 'pages too, not just the API');
      assert.equal((await fetch(`${app.url}/api/catalog`, { headers: basic('reviewer', 'wrong') })).status, 401);
      assert.equal((await fetch(`${app.url}/api/catalog`, { headers: basic('admin', 'fixture-password') })).status, 401, 'username is checked');
      assert.equal((await fetch(`${app.url}/api/catalog`, { headers: basic('reviewer', 'fixture-password') })).status, 200);
    } finally {
      app.stop();
    }
  });

  test('without a password, the viewer is open', async () => {
    const app = await startServer({ AUTH_PASSWORD: '' });
    try {
      assert.equal((await fetch(`${app.url}/api/catalog`)).status, 200);
    } finally {
      app.stop();
    }
  });

  test('refuses to start when a login is required but no password is set', () => {
    const result = spawnSync(process.execPath, [new URL('../server.mjs', import.meta.url).pathname], {
      env: { ...process.env, NODE_ENV: 'production', AUTH_REQUIRED: 'true', AUTH_PASSWORD: '', PORT: '0' },
      encoding: 'utf8',
      timeout: 10000
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /AUTH_PASSWORD is empty/);
  });
});
