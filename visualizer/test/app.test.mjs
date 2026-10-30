import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

// app.js is a browser script, so run it against a do-nothing DOM and read its functions back out.
async function loadApp() {
  const element = new Proxy(() => element, { get: (_, key) => (key === Symbol.toPrimitive ? () => '' : element), set: () => true });
  const context = vm.createContext({
    document: { querySelector: () => element, querySelectorAll: () => [] },
    window: { addEventListener: () => {}, location: { pathname: '/' }, matchMedia: () => element },
    history: element,
    fetch: () => new Promise(() => {}),
    console
  });
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  vm.runInContext(`${source}\n;globalThis.app = { state, combineDependencies, namespaceServiceSegment };`, context);
  return context.app;
}

const prJobs = { id: 'das-pr-jobs', name: 'PR Jobs', repository: 'https://github.com/SkillsFundingAgency/das-pr-jobs' };

function event(name, namespace) {
  return { name, namespace, sourceFile: 'Events.cs', handlers: [{ sourceFile: 'Handler.cs' }] };
}

function api(name, targetId) {
  return { kind: 'http-api', name, classification: 'internal', targetId, technology: 'HTTP' };
}

test('events from a service the repo also calls share the API dependency\'s targetId', async () => {
  const app = await loadApp();
  app.state.catalog = [prJobs, { id: 'das-employer-accounts', name: 'Employer Accounts' }];
  const combined = app.combineDependencies(prJobs, {
    dependencies: [api('RoATP Service', 'http-api-roatp-service'), api('Employer Accounts', 'http-api-employer-accounts')]
  }, {
    events: [
      event('ProviderRemovedEvent', 'SFA.DAS.RoATPService.Application.Events'),
      event('AddedLegalEntityEvent', 'SFA.DAS.EmployerAccounts.Messages.Events')
    ]
  });
  const messages = combined.dependencies.filter((dependency) => dependency.kind === 'message');
  assert.deepEqual([...messages.map((message) => message.targetId)], ['http-api-roatp-service', 'http-api-employer-accounts']);
});

test('events from a service the repo doesn\'t call keep their own node', async () => {
  const app = await loadApp();
  app.state.catalog = [prJobs];
  const combined = app.combineDependencies(prJobs, { dependencies: [api('Provider Relationships', 'http-api-provider-relationships')] }, {
    commands: [{ name: 'SendEmailCommand', namespace: 'SFA.DAS.Notifications.Messages.Commands', sourceFile: 'Send.cs', handlers: [] }]
  });
  const [message] = combined.dependencies.filter((dependency) => dependency.kind === 'message');
  assert.equal(message.targetId, undefined);
  assert.equal(message.name, 'Notifications');
});

test('ESFA namespaces are named after the service, not the organisation', async () => {
  const app = await loadApp();
  assert.equal(app.namespaceServiceSegment('Esfa.Recruit.Vacancies.Client.Domain.Events'), 'Recruit');
  assert.equal(app.namespaceServiceSegment('SFA.DAS.RoATPService.Application.Events'), 'RoATPService');
});
