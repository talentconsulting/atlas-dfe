import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateSql, linksOf, planTestData } from '../public/testdata.js';

const col = (name, type, extra = {}) => ({ name, type, nullable: false, primaryKey: false, generated: false, default: null, ...extra });
const fk = (fromColumns, targetTable, targetColumns = ['Id']) => ({ type: 'many-to-one', fromColumns, targetTable, targetColumns });

const tables = [
  { name: 'Accounts', schema: 'dbo', columns: [col('Id', 'BIGINT', { primaryKey: true })], relationships: [] },
  { name: 'Commitment', schema: 'dbo', columns: [col('Id', 'BIGINT', { primaryKey: true, generated: true }), col('AccountId', 'BIGINT'), col('Reference', 'NVARCHAR(10)'), col('IsDeleted', 'BIT', { default: '0' }), col('RowVersion', 'ROWVERSION', { generated: true })], relationships: [fk(['AccountId'], 'Accounts')] },
  { name: 'Providers', schema: 'dbo', columns: [col('Ukprn', 'BIGINT', { primaryKey: true })], relationships: [] },
  { name: 'Apprenticeship', schema: 'dbo', hasPii: true, columns: [col('Id', 'BIGINT', { primaryKey: true, generated: true }), col('CommitmentId', 'BIGINT'), col('ProviderUkprn', 'BIGINT', { nullable: true }), col('Email', 'NVARCHAR(200)', { nullable: true }), col('ProvidersId', 'BIGINT', { nullable: true })], relationships: [fk(['CommitmentId'], 'Commitment'), fk(['ProviderUkprn'], 'Providers', ['Ukprn'])] },
  { name: 'PriceHistory', schema: 'dbo', columns: [col('Id', 'BIGINT', { primaryKey: true, generated: true }), col('ApprenticeshipId', 'BIGINT'), col('AccountRef', 'BIGINT')], relationships: [fk(['ApprenticeshipId'], 'Apprenticeship'), fk(['AccountRef'], 'EmployerAccounts')] }
];

test('follows required links up the chain and orders parents first', () => {
  const plan = planTestData(tables, 'PriceHistory');
  assert.deepEqual(plan.order, ['Accounts', 'Commitment', 'Apprenticeship', 'PriceHistory']);
  assert.deepEqual(plan.reasons.get('Commitment').map((link) => link.from), ['Apprenticeship']);
});

test('optional links are only followed when asked', () => {
  assert.ok(!planTestData(tables, 'Apprenticeship').order.includes('Providers'));
  assert.ok(planTestData(tables, 'Apprenticeship', { includeOptional: true }).order.includes('Providers'));
});

test('a link to a table outside the schema is a warning, not a table', () => {
  const plan = planTestData(tables, 'PriceHistory');
  assert.ok(!plan.order.includes('EmployerAccounts'));
  assert.match(plan.warnings.join(' '), /AccountRef points at EmployerAccounts/);
});

test('suggests links from column names only when asked', () => {
  const byName = new Map(tables.map((table) => [table.name.toLowerCase(), table]));
  const apprenticeship = tables.find((table) => table.name === 'Apprenticeship');
  assert.equal(linksOf(apprenticeship, byName).some((link) => link.suggested), false);
  const suggested = linksOf(apprenticeship, byName, { inferLinks: true }).filter((link) => link.suggested);
  assert.deepEqual(suggested.map((link) => [link.fromColumns[0], link.to]), [['ProvidersId', 'Providers']]);
});

test('the script links child rows to the parent rows it inserts', () => {
  const sql = generateSql(planTestData(tables, 'Apprenticeship'), { rows: 2, startId: 500 });
  assert.match(sql, /SET IDENTITY_INSERT \[dbo\]\.\[Commitment\] ON;/);
  assert.match(sql, /INSERT INTO \[dbo\]\.\[Accounts\] \(\[Id\]\)\nVALUES\n {2}\(500\);/);
  assert.match(sql, /INSERT INTO \[dbo\]\.\[Commitment\] \(\[Id\], \[AccountId\], \[Reference\]\)\nVALUES\n {2}\(500, 500, N'[^']{1,10}'\);/);
  assert.match(sql, /\(500, 500, NULL, N'test\.user1@example\.com', /);
  assert.match(sql, /\(501, 500, NULL, N'test\.user2@example\.com', /);
  assert.doesNotMatch(sql, /RowVersion|IsDeleted/);
  assert.match(sql, /^BEGIN TRANSACTION;$/m);
  assert.match(sql, /^COMMIT TRANSACTION;$/m);
});

test('a table that points at itself is filled in with an update', () => {
  const selfRef = [{ name: 'Node', schema: 'dbo', columns: [col('Id', 'INT', { primaryKey: true }), col('ParentId', 'INT', { nullable: true })], relationships: [fk(['ParentId'], 'Node')] }];
  const plan = planTestData(selfRef, 'Node', { includeOptional: true });
  const sql = generateSql(plan, { rows: 2, startId: 1 });
  assert.match(sql, /UPDATE \[dbo\]\.\[Node\] SET \[ParentId\] = 1 WHERE \[Id\] = 1;/);
});

test('the same options give the same script', () => {
  const plan = planTestData(tables, 'PriceHistory');
  assert.equal(generateSql(plan, { seed: 7 }), generateSql(plan, { seed: 7 }));
});
