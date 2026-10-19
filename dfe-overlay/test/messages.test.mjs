import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { extractAreaMessages, localTypeNames } from '../extract-apim-routes.mjs';
import { messageHandlers, resolveDependencies } from '../resolve-dependencies.mjs';

async function apimCheckout(files) {
  const dir = await mkdtemp(join(tmpdir(), 'apim-'));
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true });
    await writeFile(join(dir, path), text);
  }
  return dir;
}

test('an area sends the messages it builds from another service\'s message namespace', async () => {
  const dir = await apimCheckout({
    'src/Recruit/Handlers/VacancySubmitted.cs': `using SFA.DAS.Notifications.Messages.Commands;
      class VacancySubmittedHandler { Task Handle() => notificationService.Send(new SendEmailCommand(id, to, tokens)); }`,
    // A helper does the Send elsewhere: the message is built with a target-typed new.
    'src/ApprenticeApp/Commands/Subscribe.cs': `using SFA.DAS.PushNotifications.Messages.Commands;
      class Subscribe { async Task Handle() { AddWebPushSubscriptionCommand message = new() { Id = 1 }; await service.Add(message); } }`,
    // The area's copy of the push contracts is still a message, not a local MediatR command.
    'src/ApprenticeApp/SFA.DAS.PushNotifications.Messages/Commands/AddWebPushSubscriptionCommand.cs':
      'namespace SFA.DAS.PushNotifications.Messages.Commands { public class AddWebPushSubscriptionCommand {} }',
    // MediatR: defined in the APIM repository, so not a message even next to a Messages using.
    'src/Recruit/Application/UpsertCommand.cs': `using SFA.DAS.Notifications.Messages.Commands;
      public class UpsertVacancyCommand {} class X { void Y() { mediator.Send(new UpsertVacancyCommand()); } }`,
    // Handled here, so received rather than sent.
    'src/Recruit/Handlers/Received.cs': `using SFA.DAS.Recruit.Messages.Events;
      class H : IHandleMessages<VacancyClosedEvent> { void Z() { var e = new VacancyClosedEvent(); } }`,
    'src/Recruit/Tests/FakeSend.cs': 'using SFA.DAS.Notifications.Messages.Commands; class T { void A() { s.Send(new SendTestCommand()); } }'
  });
  const local = await localTypeNames(dir);
  const recruit = await extractAreaMessages(dir, 'Recruit', local);
  assert.deepEqual(recruit.map((m) => [m.name, m.kind, m.namespaces]), [['SendEmailCommand', 'command', ['SFA.DAS.Notifications.Messages.Commands']]]);
  assert.deepEqual(recruit[0].evidence, ['src/Recruit/Handlers/VacancySubmitted.cs']);
  const app = await extractAreaMessages(dir, 'ApprenticeApp', local);
  assert.deepEqual(app.map((m) => m.name), ['AddWebPushSubscriptionCommand']);
});

const overlay = {
  gateway: {
    repo: 'das-apim-endpoints', label: 'APIM', hideInLandscape: true,
    areas: { Recruit: { match: [{ configurationKey: 'RecruitOuterApiConfiguration' }] } }
  },
  innerApis: { RecruitApiConfiguration: { name: 'Recruit API', repo: 'das-recruit-api' } }
};
const routes = {
  commit: 'abc123',
  areas: {
    Recruit: {
      innerApis: [{ configuration: 'RecruitApiConfiguration', clients: ['IRecruitApiClient'], usages: 3, evidence: ['src/Recruit/Api.cs'] }],
      messages: [
        { name: 'SendEmailCommand', kind: 'command', namespaces: ['SFA.DAS.Notifications.Messages.Commands'], usages: 2, evidence: ['src/Recruit/Handlers/VacancySubmitted.cs'] },
        { name: 'VacancyApprovedEvent', kind: 'event', namespaces: ['SFA.DAS.Courses.Messages.Events'], usages: 1, evidence: ['src/Recruit/Approve.cs'] }
      ]
    }
  }
};
const handlers = new Map([
  ['SendEmailCommand', [
    { repo: 'das-notifications', namespace: 'SFA.DAS.Notifications.Messages.Commands' },
    { repo: 'das-other', namespace: 'SFA.DAS.Other.Commands' }
  ]]
]);
const context = { overlay, routes, handlers, catalogued: new Set(['das-recruit-api', 'das-notifications', 'das-other']) };
const caller = { sourceId: 'web', name: 'Recruit Outer', kind: 'http-api', direction: 'outbound', configurationKeys: ['RecruitOuterApiConfiguration'], operations: [], evidence: [] };

test('handlers are matched by name, preferring the namespace the area imports', () => {
  assert.deepEqual(messageHandlers(routes.areas.Recruit.messages[0], handlers), ['das-notifications']);
  assert.deepEqual(messageHandlers({ name: 'Unknown', namespaces: [] }, handlers), []);
});

test('a caller of an APIM area gets the area\'s APIs and a message dependency to each handler', () => {
  const resolved = resolveDependencies({ dependencies: [caller] }, 'das-recruit', context).dependencies;
  assert.deepEqual(resolved.map((d) => [d.kind, d.name]), [
    ['http-api', 'Recruit API'], ['message', 'das-notifications'], ['message', 'Courses']
  ]);
  const email = resolved[1];
  assert.equal(email.targetRepo, 'das-notifications');
  assert.equal(email.direction, 'outbound');
  assert.equal(email.description, 'Sends via APIM (Recruit)');
  assert.deepEqual(email.operations.map((o) => [o.method, o.path]), [['COMMAND', 'SendEmailCommand']]);
  assert.ok(email.evidence.some((e) => e.sourceFile === 'das-apim-endpoints/src/Recruit/Handlers/VacancySubmitted.cs'));
  // No catalogued handler: named after the namespace's service and left unpinned.
  assert.equal(resolved[2].targetRepo, undefined);
  assert.equal(resolved[2].classification, 'unknown');
});

test('a handler that is the caller itself is not a dependency', () => {
  const resolved = resolveDependencies({ dependencies: [caller] }, 'das-notifications', context).dependencies;
  assert.ok(!resolved.some((d) => d.kind === 'message' && d.targetRepo === 'das-notifications'));
});
