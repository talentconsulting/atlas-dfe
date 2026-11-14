// Plans and writes made-up test data for a catalogued database: the chosen table, every table its
// required foreign keys need (up the chain), rows inserted parents first, as one SQL Server script.
// Everything here is generated -- nothing is read from a real database.

const tableKey = (name) => String(name || '').split('.').pop().replace(/[[\]"`]/g, '').toLowerCase();

function columnsOf(table) {
  return [...(table.columns || [])].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
}

function primaryKey(table) {
  return columnsOf(table).filter((column) => column.primaryKey);
}

const singular = (name) => name.replace(/ies$/i, 'y').replace(/(ses|xes)$/i, (m) => m.slice(0, -2)).replace(/s$/i, '');

// Links a table makes to other tables: its declared foreign keys and, when asked, suggested ones --
// a column such as CommitmentId with no foreign key, where a table named Commitment(s) exists with a
// single-column primary key.
export function linksOf(table, byName, { inferLinks = false } = {}) {
  const columns = new Map(columnsOf(table).map((column) => [column.name, column]));
  const links = (table.relationships || []).map((relationship) => ({
    from: table.name,
    to: byName.get(tableKey(relationship.targetTable))?.name ?? relationship.targetTable,
    missing: !byName.has(tableKey(relationship.targetTable)),
    fromColumns: relationship.fromColumns || [],
    targetColumns: relationship.targetColumns?.length ? relationship.targetColumns : null,
    required: (relationship.fromColumns || []).every((name) => columns.get(name)?.nullable === false),
    suggested: false
  }));
  if (!inferLinks) return links;
  const linked = new Set(links.flatMap((link) => link.fromColumns));
  for (const column of columns.values()) {
    if (linked.has(column.name) || column.primaryKey) continue;
    const match = column.name.match(/^(.+?)_?Id$/i);
    if (!match) continue;
    const stem = match[1];
    const target = [stem, `${stem}s`, `${stem}es`, stem.replace(/y$/i, 'ies')]
      .map((name) => byName.get(name.toLowerCase()))
      .find((candidate) => candidate && candidate !== table && primaryKey(candidate).length === 1);
    if (!target) continue;
    links.push({ from: table.name, to: target.name, missing: false, fromColumns: [column.name], targetColumns: [primaryKey(target)[0].name], required: column.nullable === false, suggested: true });
  }
  return links;
}

// Which tables need rows, and in what order. Required links are always followed up the chain;
// optional links only when includeOptional is set. Parents come before the tables that reference
// them; a link that would close a loop is filled in afterwards with an UPDATE instead.
export function planTestData(tables, rootNames, { includeOptional = false, inferLinks = false } = {}) {
  const byName = new Map(tables.map((table) => [tableKey(table.name), table]));
  const roots = (Array.isArray(rootNames) ? rootNames : [rootNames]).map((name) => {
    const table = byName.get(tableKey(name));
    if (!table) throw new Error(`Unknown table ${name}`);
    return table;
  });
  if (!roots.length) throw new Error('Pick at least one table');
  const root = roots[0];
  const included = new Map(roots.map((table) => [table.name, table]));
  const reasons = new Map(roots.map((table) => [table.name, []]));
  const warnings = [];
  const usedLinks = [];
  const allLinks = new Map();
  const queue = [...roots];
  while (queue.length) {
    const table = queue.shift();
    allLinks.set(table.name, linksOf(table, byName, { inferLinks }));
    for (const link of allLinks.get(table.name)) {
      if (!link.required && !includeOptional) continue;
      if (link.missing) {
        warnings.push(`${table.name}.${link.fromColumns.join(', ')} points at ${link.to}, which isn't in this database's schema (it may live in another service). A made-up value is used.`);
        continue;
      }
      usedLinks.push(link);
      if (link.to === table.name) continue;
      if (!reasons.has(link.to)) reasons.set(link.to, []);
      reasons.get(link.to).push(link);
      if (!included.has(link.to)) {
        const target = byName.get(tableKey(link.to));
        included.set(target.name, target);
        queue.push(target);
      }
    }
  }

  // Topological order, parents first. Self-references and loop-closing links become deferred updates.
  const order = [];
  const deferred = [];
  const state = new Map();
  const visit = (name, path) => {
    if (state.get(name) === 'done') return;
    state.set(name, 'visiting');
    for (const link of usedLinks.filter((candidate) => candidate.from === name)) {
      if (link.to === name || state.get(link.to) === 'visiting') {
        deferred.push(link);
        if (link.required && link.to !== name) warnings.push(`${link.from} and ${link.to} require each other; ${link.from}.${link.fromColumns.join(', ')} is set with an UPDATE after both are inserted, so the column must allow a temporary value.`);
        continue;
      }
      visit(link.to, [...path, name]);
    }
    state.set(name, 'done');
    order.push(name);
  };
  const rootSet = new Set(roots.map((table) => table.name));
  [...included.keys()].sort((a, b) => rootSet.has(a) - rootSet.has(b) || a.localeCompare(b)).forEach((name) => visit(name, []));

  const noKey = order.filter((name) => !primaryKey(included.get(name)).length);
  if (noKey.length) warnings.push(`No primary key is recorded for ${noKey.join(', ')}; rows are generated, but re-running the script will add duplicates.`);
  return { root: root.name, roots: [...rootSet], order, tables: included, reasons, links: usedLinks, allLinks, deferred, warnings };
}

// ---- Values ---------------------------------------------------------------------------------------

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function typeInfo(type) {
  const text = String(type || '').toLowerCase().trim();
  const base = text.replace(/\(.*$/, '').trim();
  const size = text.match(/\(\s*(max|\d+)\s*(?:,\s*(\d+))?\s*\)/);
  return { base, length: size && size[1] !== 'max' ? Number(size[1]) : null, scale: size?.[2] ? Number(size[2]) : null };
}

const INTEGER_TYPES = { tinyint: 255, smallint: 32767, int: 2147483647, integer: 2147483647, bigint: Number.MAX_SAFE_INTEGER };
const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Robin', 'Charlie'];
const LAST_NAMES = ['Testman', 'Sample', 'Example', 'Dummy', 'Placeholder', 'Fictional', 'Madeup', 'Mockley'];

const pad = (value, width) => String(value).padStart(width, '0');
const guid = (rand) => {
  const hex = () => Math.floor(rand() * 16).toString(16);
  const part = (n) => Array.from({ length: n }, hex).join('');
  return `${part(8)}-${part(4)}-4${part(3)}-${'89ab'[Math.floor(rand() * 4)]}${part(3)}-${part(12)}`;
};

const sqlString = (value) => `N'${String(value).replace(/'/g, "''")}'`;

// A made-up value for one column of one row. Values carry the row number so unique columns stay unique.
export function valueFor(column, row, rand, { tableName = '' } = {}) {
  const { base, length, scale } = typeInfo(column.type);
  const name = column.name.toLowerCase();
  const n = row + 1;
  const fit = (text) => sqlString(length ? String(text).slice(0, length) : text);
  const date = (yearFrom, span) => {
    const day = new Date(Date.UTC(yearFrom, 0, 1) + Math.floor(rand() * span * 365) * 86400000);
    return day.toISOString().slice(0, 10);
  };

  if (base in INTEGER_TYPES) {
    if (/ukprn/.test(name)) return String(10000000 + n);
    if (/(^|_)uln$|uniquelearnernumber/.test(name)) return String(9000000000 + n);
    const max = INTEGER_TYPES[base];
    if (column.default != null && /^\(*-?\d+\)*$/.test(String(column.default))) return String(column.default).replace(/[()]/g, '');
    if (/status|type|state|stage|party|originator|action|level|code/.test(name)) return String(Math.min(max, 1));
    return String(Math.min(max, base === 'tinyint' ? n : 1000 + n));
  }
  if (base === 'bit' || base === 'boolean') return column.default != null && /1/.test(String(column.default)) ? '1' : '0';
  if (['decimal', 'numeric', 'money', 'smallmoney', 'float', 'real'].includes(base)) {
    const places = scale ?? 2;
    return (Math.round((100 + rand() * 9900) * 10 ** places) / 10 ** places).toFixed(base === 'float' || base === 'real' ? 2 : Math.min(places, 4));
  }
  if (base === 'uniqueidentifier' || base === 'uuid') return `'${guid(rand)}'`;
  if (['date', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset', 'timestamp with time zone'].includes(base)) {
    const value = /birth|dob/.test(name) ? date(1990, 15) : /end|finish|expir|until|to$/.test(name) ? date(2027, 2) : date(2025, 2);
    return base === 'date' ? `'${value}'` : `'${value}T09:00:00'`;
  }
  if (base === 'time') return "'09:00:00'";
  if (['binary', 'varbinary', 'image'].includes(base)) return '0x00';
  if (base === 'xml') return "N'<test />'";

  // Text: guess from the column name, then fit to the column's length.
  if (/email/.test(name)) return fit(`test.user${n}@example.com`);
  if (/postcode|post_code|zip/.test(name)) return fit('ZZ99 9ZZ');
  if (/phone|mobile|telephone/.test(name)) return fit(`01632 960${pad(n % 1000, 3)}`);
  if (/firstname|first_name|givenname|forename/.test(name)) return fit(FIRST_NAMES[row % FIRST_NAMES.length]);
  if (/lastname|last_name|surname|familyname/.test(name)) return fit(LAST_NAMES[row % LAST_NAMES.length]);
  if (/url|uri|website|link/.test(name)) return fit(`https://example.com/${tableName.toLowerCase()}/${n}`);
  if (/ukprn/.test(name)) return fit(String(10000000 + n));
  if (/(^|_)uln$|uniquelearnernumber/.test(name)) return fit(String(9000000000 + n));
  if (/hashedid|reference|code$/.test(name) && length && length <= 12) return fit(`T${pad(n, length - 1)}`.slice(-length).toUpperCase());
  if (length && length <= 3) return fit(String(n % 10 ** length));
  if (/json|data$|payload|content/.test(name)) return fit('{}');
  return fit(`Test ${column.name} ${n}`);
}

// ---- Script ---------------------------------------------------------------------------------------

const quote = (name) => `[${String(name).replace(/]/g, ']]')}]`;
const qualified = (table) => `${table.schema ? `${quote(table.schema)}.` : ''}${quote(table.name)}`;
const isIdentityLike = (column) => column.generated && column.primaryKey && typeInfo(column.type).base in INTEGER_TYPES;
const isSkipped = (column) => {
  const { base } = typeInfo(column.type);
  return base === 'rowversion' || base === 'timestamp' || (column.generated && !column.primaryKey);
};

// The SQL Server script for a plan. rowCounts: { tableName: n } (default 1, the root `rows`).
export function generateSql(plan, { rows = 5, rowCounts = {}, startId = 900001, seed = 1, fillOptional = true, generatedAt = null } = {}) {
  const rand = random(seed);
  const values = new Map(); // table -> [{ column: value }]
  const lines = [];
  const picked = new Set(plan.roots || [plan.root]);
  const counts = new Map(plan.order.map((name) => [name, Math.max(1, Number(rowCounts[name] ?? (picked.has(name) ? rows : 1)) || 1)]));
  const deferredSet = new Set(plan.deferred);
  const updates = [];

  lines.push(
    `-- Test data for ${[...picked].join(', ')}, generated by TalentSuite Atlas${generatedAt ? ` on ${generatedAt}` : ''}.`,
    '-- Every value is made up. Run against a local or test database only.',
    `-- Tables, parents first: ${plan.order.map((name) => `${name} (${counts.get(name)})`).join(', ')}`,
    ...plan.warnings.map((warning) => `-- Note: ${warning}`),
    '',
    'SET XACT_ABORT ON;',
    'BEGIN TRANSACTION;',
    ''
  );

  for (const name of plan.order) {
    const table = plan.tables.get(name);
    const columns = columnsOf(table).filter((column) => !isSkipped(column));
    const outgoing = plan.links.filter((link) => link.from === name);
    const rowsFor = [];
    const identity = columns.some(isIdentityLike);
    for (let row = 0; row < counts.get(name); row += 1) {
      const record = {};
      for (const column of columns) {
        const link = outgoing.find((candidate) => candidate.fromColumns.includes(column.name));
        if (link && !link.missing) {
          const parentRows = values.get(link.to);
          const targetColumn = (link.targetColumns || primaryKey(plan.tables.get(link.to)).map((c) => c.name))[link.fromColumns.indexOf(column.name)];
          if (deferredSet.has(link) || !parentRows) {
            record[column.name] = column.nullable ? 'NULL' : valueFor(column, row, rand, { tableName: name });
            updates.push({ link, row, column: column.name, targetColumn });
            continue;
          }
          record[column.name] = parentRows[row % parentRows.length][targetColumn] ?? 'NULL';
          continue;
        }
        // An optional link that isn't being filled stays empty, so it can't point at a row that doesn't exist.
        const unfollowed = (plan.allLinks?.get(name) || []).find((candidate) => !candidate.missing && candidate.fromColumns.includes(column.name));
        if (unfollowed && column.nullable) { record[column.name] = 'NULL'; continue; }
        if (column.primaryKey && typeInfo(column.type).base in INTEGER_TYPES) { record[column.name] = String(startId + row); continue; }
        if (!column.primaryKey && column.default != null && !column.nullable) { record[column.name] = null; continue; } // let the database default it
        if (!column.primaryKey && column.nullable && !fillOptional) { record[column.name] = null; continue; }
        record[column.name] = valueFor(column, row, rand, { tableName: name });
      }
      rowsFor.push(record);
    }
    values.set(name, rowsFor);
    const written = columns.filter((column) => rowsFor.some((record) => record[column.name] != null));
    lines.push(`-- ${name}${plan.reasons.get(name)?.length ? `: needed by ${plan.reasons.get(name).map((link) => `${link.from}.${link.fromColumns.join(', ')}${link.suggested ? ' (suggested link)' : ''}`).join('; ')}` : ''}`);
    if (identity) lines.push(`SET IDENTITY_INSERT ${qualified(table)} ON;`);
    lines.push(`INSERT INTO ${qualified(table)} (${written.map((column) => quote(column.name)).join(', ')})`);
    lines.push(`VALUES\n${rowsFor.map((record) => `  (${written.map((column) => record[column.name] ?? 'DEFAULT').join(', ')})`).join(',\n')};`);
    if (identity) lines.push(`SET IDENTITY_INSERT ${qualified(table)} OFF;`);
    lines.push('');
  }

  const keyed = updates.filter((update) => values.get(update.link.to));
  if (keyed.length) {
    lines.push('-- Links that close a loop, set once both sides exist');
    for (const update of keyed) {
      const table = plan.tables.get(update.link.from);
      const key = primaryKey(table);
      if (!key.length) continue;
      const parentRows = values.get(update.link.to);
      const record = values.get(update.link.from)[update.row];
      const target = parentRows[update.row % parentRows.length][update.targetColumn];
      lines.push(`UPDATE ${qualified(table)} SET ${quote(update.column)} = ${target} WHERE ${key.map((column) => `${quote(column.name)} = ${record[column.name]}`).join(' AND ')};`);
    }
    lines.push('');
  }

  lines.push('COMMIT TRANSACTION;', '-- To try it without keeping the rows, change COMMIT TRANSACTION to ROLLBACK TRANSACTION.');
  return lines.join('\n');
}
