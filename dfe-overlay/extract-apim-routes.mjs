#!/usr/bin/env node
// Reads a das-apim-endpoints checkout and records, per APIM area (src/<Area>), which inner APIs the
// area calls and which events/commands it sends. Inner API clients are typed by their configuration
// class, e.g. ICoursesApiClient<CoursesApiConfiguration> or InternalApiClient<CommitmentsV2ApiConfiguration>.
// Messages are *Command/*Event types sent or published from files that import a ...Messages... namespace
// (e.g. SFA.DAS.Notifications.Messages.Commands.SendEmailCommand) and are not defined in das-apim-endpoints,
// which leaves out the areas' own MediatR commands.
//
// Usage: node dfe-overlay/extract-apim-routes.mjs <path-to-das-apim-endpoints> [data-dir]

import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIENT_RE = /\b(\w*Client)<(\w+Configuration)>/g;
const MESSAGES_USING_RE = /^\s*using\s+([\w.]*\.Messages(?:\.[\w.]+)?)\s*;/gm;
// A message created to be sent: `new X(...)`, `X x = new()` or `Send<X>(...)`. Helpers often do the actual Send
// in another file, so the type being built in a file that imports the service's messages is the evidence.
const MESSAGE_TYPE_RE = /\bnew\s+(\w+(?:Command|Event))\b|\b(\w+(?:Command|Event))\s+\w+\s*=\s*new\s*\(|\b(?:Send|SendLocal|Publish)\s*<\s*(\w+(?:Command|Event))\s*>/g;
const HANDLED_RE = /IHandleMessages\s*<\s*(\w+)\s*>/g;
// Test, fake and stub projects call nothing for real.
const IGNORED_DIR_RE = /(^|\.)(tests?|unittests|integrationtests|acceptancetests|testharness|fakeapis|mockapis|stubs)$|^(bin|obj|node_modules|\.git)$/i;
const MAX_EVIDENCE = 3;

async function* csFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIR_RE.test(entry.name)) yield* csFiles(join(dir, entry.name));
    } else if (entry.name.endsWith('.cs')) {
      yield join(dir, entry.name);
    }
  }
}

// Class names declared in das-apim-endpoints outside a ...Messages namespace: a type defined there is the API's own
// MediatR command, not a message. Copies of another service's message contracts (e.g. a local
// SFA.DAS.PushNotifications.Messages project) are still messages.
export async function localTypeNames(apimDir) {
  const names = new Set();
  for await (const file of csFiles(join(apimDir, 'src'))) {
    const text = await readFile(file, 'utf8');
    if (/\bnamespace\s+[\w.]*\.Messages\b/.test(text)) continue;
    for (const [, name] of text.matchAll(/\b(?:class|record|interface)\s+(\w+)/g)) names.add(name);
  }
  return names;
}

export async function extractAreaMessages(apimDir, area, localTypes) {
  const byName = new Map();
  for await (const file of csFiles(join(apimDir, 'src', area))) {
    const text = await readFile(file, 'utf8');
    const namespaces = [...text.matchAll(MESSAGES_USING_RE)].map((match) => match[1]);
    if (!namespaces.length) continue;
    const handled = new Set([...text.matchAll(HANDLED_RE)].map((match) => match[1]));   // received, not sent
    const sourceFile = relative(apimDir, file).split(sep).join('/');
    for (const match of text.matchAll(MESSAGE_TYPE_RE)) {
      const name = match[1] || match[2] || match[3];
      if (localTypes.has(name) || handled.has(name)) continue;
      if (!byName.has(name)) byName.set(name, { name, kind: name.endsWith('Event') ? 'event' : 'command', namespaces: new Set(), usages: 0, evidence: [] });
      const entry = byName.get(name);
      namespaces.forEach((namespace) => entry.namespaces.add(namespace));
      entry.usages += 1;
      if (entry.evidence.length < MAX_EVIDENCE && !entry.evidence.includes(sourceFile)) entry.evidence.push(sourceFile);
    }
  }
  return [...byName.values()]
    .map((entry) => ({ ...entry, namespaces: [...entry.namespaces].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function extractArea(apimDir, area) {
  const byConfiguration = new Map();
  for await (const file of csFiles(join(apimDir, 'src', area))) {
    const text = await readFile(file, 'utf8');
    for (const [, client, configuration] of text.matchAll(CLIENT_RE)) {
      if (!byConfiguration.has(configuration)) byConfiguration.set(configuration, { configuration, clients: new Set(), usages: 0, evidence: [] });
      const entry = byConfiguration.get(configuration);
      entry.clients.add(client);
      entry.usages += 1;
      const sourceFile = relative(apimDir, file).split(sep).join('/');
      if (entry.evidence.length < MAX_EVIDENCE && !entry.evidence.includes(sourceFile)) entry.evidence.push(sourceFile);
    }
  }
  return [...byConfiguration.values()]
    .map((entry) => ({ ...entry, clients: [...entry.clients].sort() }))
    .sort((a, b) => b.usages - a.usages || a.configuration.localeCompare(b.configuration));
}

function commitOf(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export async function extractRoutes(apimDir) {
  const areas = {};
  const names = (await readdir(join(apimDir, 'src'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== 'Shared')
    .map((entry) => entry.name)
    .sort();
  const localTypes = await localTypeNames(apimDir);
  for (const area of names) {
    const innerApis = await extractArea(apimDir, area);
    const messages = await extractAreaMessages(apimDir, area, localTypes);
    if (innerApis.length || messages.length) areas[area] = { path: `src/${area}`, innerApis, messages };
  }
  return { repository: 'SkillsFundingAgency/das-apim-endpoints', commit: commitOf(apimDir), areas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [apimArg, dataArg] = process.argv.slice(2);
  if (!apimArg) {
    console.error('Usage: node dfe-overlay/extract-apim-routes.mjs <path-to-das-apim-endpoints> [data-dir]');
    process.exit(1);
  }
  const dataDir = resolve(dataArg || join(fileURLToPath(new URL('.', import.meta.url)), '..'));
  const routes = await extractRoutes(resolve(apimArg));
  const outDir = join(dataDir, 'das-apim-endpoints', 'apim-routes');
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'apim-routes.json'), `${JSON.stringify(routes, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(routes.areas).length} APIM areas to ${relative(process.cwd(), join(outDir, 'apim-routes.json'))}`);
}
