/*
 * Destructive only to a generated disposable schema whose name matches the
 * strict luzzshop_migration_test_YYYYMMDDHHMMSS pattern. It never issues a
 * write statement against the configured main schema.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('../../Backend/node_modules/mysql2/promise');
require('../../Backend/node_modules/dotenv').config({
  path: path.join(__dirname, '../../Backend/.env'),
});

const mainSchema = process.env.DB_NAME;
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const testSchema = `luzzshop_migration_test_${stamp}`;
const safeTestName = /^luzzshop_migration_test_\d{14}$/;
const qid = (value) => `\`${value.replace(/`/g, '``')}\``;

if (!mainSchema || mainSchema.toLowerCase() !== 'luzzshop') {
  throw new Error('Safety stop: configured DB_NAME is not exactly luzzshop');
}
if (!safeTestName.test(testSchema) || testSchema === mainSchema) {
  throw new Error('Safety stop: invalid disposable schema name');
}

const upPath = path.join(__dirname, '../migrations/001_create_paddle_specs.up.sql');
const downPath = path.join(__dirname, '../migrations/001_create_paddle_specs.down.sql');

function splitMigration(sql) {
  const statements = [];
  let delimiter = ';';
  let buffer = '';
  for (const line of sql.split(/\r?\n/)) {
    const directive = line.match(/^DELIMITER\s+(.+)$/i);
    if (directive) {
      delimiter = directive[1];
      continue;
    }
    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      statements.push(buffer.trim().slice(0, -delimiter.length).trim());
      buffer = '';
    }
  }
  if (buffer.trim()) throw new Error('Unterminated SQL statement in migration');
  return statements.filter(Boolean);
}

async function expectRejected(label, action) {
  try {
    await action();
    return { label, pass: false, detail: 'unexpectedly accepted' };
  } catch (error) {
    return { label, pass: true, detail: error.code || error.message };
  }
}

async function run() {
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: false,
  });
  const report = { mainSchema, testSchema, tests: [], cleanup: false };
  let test;
  try {
    const [[server]] = await admin.query(
      'SELECT VERSION() version, @@character_set_database charset, @@collation_database collation'
    );
    report.server = server;

    const [originalTables] = await admin.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME',
      [mainSchema]
    );
    const originalCounts = {};
    for (const { TABLE_NAME: table } of originalTables) {
      const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(mainSchema)}.${qid(table)}`);
      originalCounts[table] = Number(row.count);
    }

    await admin.query(`CREATE DATABASE ${qid(testSchema)} CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`);
    test = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: testSchema,
      multipleStatements: false,
    });
    const [[identity]] = await test.query('SELECT DATABASE() current_database');
    if (identity.current_database !== testSchema || identity.current_database === mainSchema) {
      throw new Error('Safety stop: test connection identity mismatch');
    }
    report.tests.push({ label: 'isolated schema identity', pass: true, detail: identity.current_database });

    await test.query('SET FOREIGN_KEY_CHECKS=0');
    for (const { TABLE_NAME: table } of originalTables) {
      const [[ddlRow]] = await admin.query(`SHOW CREATE TABLE ${qid(mainSchema)}.${qid(table)}`);
      const ddl = ddlRow['Create Table'].replace(/^CREATE TABLE `[^`]+`/, `CREATE TABLE ${qid(table)}`);
      await test.query(ddl);
      await test.query(`INSERT INTO ${qid(table)} SELECT * FROM ${qid(mainSchema)}.${qid(table)}`);
    }
    await test.query('SET FOREIGN_KEY_CHECKS=1');

    for (const statement of splitMigration(fs.readFileSync(upPath, 'utf8'))) await test.query(statement);
    const [newTables] = await test.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME IN ('paddle_specs','paddle_spec_sources') ORDER BY TABLE_NAME",
      [testSchema]
    );
    report.tests.push({ label: 'UP creates two tables', pass: newTables.length === 2, detail: newTables.map(x => x.TABLE_NAME) });

    const [[product]] = await test.query('SELECT product_id FROM products ORDER BY product_id LIMIT 1');
    const [[user]] = await test.query('SELECT user_id FROM users ORDER BY user_id LIMIT 1');
    if (!product || !user) throw new Error('Clone lacks product/user fixtures');

    const [specInsert] = await test.query(
      'INSERT INTO paddle_specs (product_id, created_by_user_id) VALUES (?, ?)',
      [product.product_id, user.user_id]
    );
    const specId = specInsert.insertId;
    report.tests.push({ label: 'sparse draft accepted', pass: true });
    report.tests.push(await expectRejected('one-to-one UNIQUE enforced', () =>
      test.query('INSERT INTO paddle_specs (product_id) VALUES (?)', [product.product_id])));
    report.tests.push(await expectRejected('unknown product FK rejected', () =>
      test.query('INSERT INTO paddle_specs (product_id) VALUES (2147483647)')));
    report.tests.push(await expectRejected('score above 100 rejected', () =>
      test.query('UPDATE paddle_specs SET power_score=101 WHERE paddle_spec_id=?', [specId])));
    report.tests.push(await expectRejected('reversed weight range rejected', () =>
      test.query('UPDATE paddle_specs SET static_weight_min_g=250, static_weight_max_g=200 WHERE paddle_spec_id=?', [specId])));
    report.tests.push(await expectRejected('handle longer than paddle rejected', () =>
      test.query('UPDATE paddle_specs SET paddle_length_mm=400, handle_length_mm=450 WHERE paddle_spec_id=?', [specId])));
    report.tests.push(await expectRejected('invalid shape rejected', () =>
      test.query("UPDATE paddle_specs SET paddle_shape='ROUND' WHERE paddle_spec_id=?", [specId])));
    report.tests.push(await expectRejected('completeness above 100 rejected', () =>
      test.query('UPDATE paddle_specs SET data_completeness=100.01 WHERE paddle_spec_id=?', [specId])));
    report.tests.push(await expectRejected('invalid rationale JSON shape rejected', () =>
      test.query("UPDATE paddle_specs SET score_rationale='[]' WHERE paddle_spec_id=?", [specId])));
    report.tests.push(await expectRejected('VERIFIED without review rejected', () =>
      test.query("UPDATE paddle_specs SET verification_status='VERIFIED', submitted_at=NOW() WHERE paddle_spec_id=?", [specId])));

    await test.query(
      "UPDATE paddle_specs SET submitted_at=NOW(), reviewed_by_user_id=?, reviewed_at=NOW(), data_completeness=75, verification_status='VERIFIED' WHERE paddle_spec_id=?",
      [user.user_id, specId]
    );
    await test.query('UPDATE paddle_specs SET power_score=70 WHERE paddle_spec_id=?', [specId]);
    const [[invalidatedFact]] = await test.query(
      'SELECT verification_status, reviewed_by_user_id, reviewed_at, data_completeness FROM paddle_specs WHERE paddle_spec_id=?',
      [specId]
    );
    report.tests.push({
      label: 'verified spec edit invalidates approval',
      pass: invalidatedFact.verification_status === 'IN_REVIEW' && invalidatedFact.reviewed_by_user_id === null && invalidatedFact.reviewed_at === null && Number(invalidatedFact.data_completeness) === 0,
      detail: invalidatedFact,
    });

    await test.query(
      "UPDATE paddle_specs SET reviewed_by_user_id=?, reviewed_at=NOW(), data_completeness=75, verification_status='VERIFIED' WHERE paddle_spec_id=?",
      [user.user_id, specId]
    );
    const fingerprint = crypto.createHash('sha256').update('MANUFACTURER:https://example.invalid/spec').digest();
    const [sourceInsert] = await test.query(
      "INSERT INTO paddle_spec_sources (paddle_spec_id,source_type,source_title,source_locator,source_fingerprint,accessed_at,supported_fields,created_by_user_id) VALUES (?,'MANUFACTURER','Nguồn thử nghiệm','https://example.invalid/spec',?,NOW(),'[\"power_score\"]',?)",
      [specId, fingerprint, user.user_id]
    );
    const [[invalidatedSource]] = await test.query(
      'SELECT verification_status, data_completeness FROM paddle_specs WHERE paddle_spec_id=?',
      [specId]
    );
    report.tests.push({ label: 'source insert invalidates verified spec', pass: invalidatedSource.verification_status === 'IN_REVIEW' && Number(invalidatedSource.data_completeness) === 0, detail: invalidatedSource });
    report.tests.push(await expectRejected('duplicate source fingerprint rejected', () =>
      test.query("INSERT INTO paddle_spec_sources (paddle_spec_id,source_type,source_title,source_locator,source_fingerprint,accessed_at,supported_fields) VALUES (?,'MANUFACTURER','Trùng','https://example.invalid/spec',?,NOW(),'[]')", [specId, fingerprint])));
    report.tests.push(await expectRejected('non-array supported_fields rejected', () =>
      test.query("UPDATE paddle_spec_sources SET supported_fields='{}' WHERE paddle_spec_source_id=?", [sourceInsert.insertId])));
    report.tests.push(await expectRejected('source VERIFIED without verifier rejected', () =>
      test.query("UPDATE paddle_spec_sources SET verification_status='VERIFIED' WHERE paddle_spec_source_id=?", [sourceInsert.insertId])));

    const [[unicodeSource]] = await test.query(
      'SELECT source_title, evidence_note FROM paddle_spec_sources WHERE paddle_spec_source_id=?',
      [sourceInsert.insertId]
    );
    report.tests.push({
      label: 'utf8mb4 Vietnamese source text round-trips',
      pass: unicodeSource.source_title === 'Nguồn thử nghiệm',
      detail: unicodeSource.source_title,
    });

    await test.query(
      "UPDATE paddle_specs SET reviewed_by_user_id=?, reviewed_at=NOW(), data_completeness=75, verification_status='VERIFIED' WHERE paddle_spec_id=?",
      [user.user_id, specId]
    );
    await test.query(
      "UPDATE paddle_spec_sources SET source_title='Nguồn thử nghiệm đã sửa' WHERE paddle_spec_source_id=?",
      [sourceInsert.insertId]
    );
    const [[invalidatedSourceUpdate]] = await test.query(
      'SELECT verification_status, data_completeness FROM paddle_specs WHERE paddle_spec_id=?',
      [specId]
    );
    report.tests.push({
      label: 'source update invalidates verified spec',
      pass: invalidatedSourceUpdate.verification_status === 'IN_REVIEW' && Number(invalidatedSourceUpdate.data_completeness) === 0,
      detail: invalidatedSourceUpdate,
    });

    await test.query(
      "UPDATE paddle_specs SET reviewed_by_user_id=?, reviewed_at=NOW(), data_completeness=75, verification_status='VERIFIED' WHERE paddle_spec_id=?",
      [user.user_id, specId]
    );
    await test.query('DELETE FROM paddle_spec_sources WHERE paddle_spec_source_id=?', [sourceInsert.insertId]);
    const [[invalidatedSourceDelete]] = await test.query(
      'SELECT verification_status, data_completeness FROM paddle_specs WHERE paddle_spec_id=?',
      [specId]
    );
    report.tests.push({
      label: 'source delete invalidates verified spec',
      pass: invalidatedSourceDelete.verification_status === 'IN_REVIEW' && Number(invalidatedSourceDelete.data_completeness) === 0,
      detail: invalidatedSourceDelete,
    });

    const [[triggerCount]] = await test.query(
      'SELECT COUNT(*) count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN (?, ?)',
      [testSchema, 'paddle_specs', 'paddle_spec_sources']
    );
    report.tests.push({ label: 'four invalidation triggers installed', pass: Number(triggerCount.count) === 4, detail: Number(triggerCount.count) });

    const productDelete = await expectRejected('product delete restricted by spec FK', () =>
      test.query('DELETE FROM products WHERE product_id=?', [product.product_id]));
    report.tests.push(productDelete);

    const [explain] = await test.query("EXPLAIN SELECT * FROM paddle_specs WHERE verification_status='VERIFIED' AND data_completeness>=75");
    report.tests.push({ label: 'workflow index available to optimizer', pass: explain.some(x => x.key === 'idx_paddle_specs_workflow' || x.possible_keys?.includes('idx_paddle_specs_workflow')), detail: explain[0] });

    for (const statement of splitMigration(fs.readFileSync(downPath, 'utf8'))) await test.query(statement);
    const [[remaining]] = await test.query(
      "SELECT COUNT(*) count FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME IN ('paddle_specs','paddle_spec_sources')",
      [testSchema]
    );
    report.tests.push({ label: 'DOWN removes new tables', pass: Number(remaining.count) === 0 });
    const [[remainingTriggers]] = await test.query(
      'SELECT COUNT(*) count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN (?, ?)',
      [testSchema, 'paddle_specs', 'paddle_spec_sources']
    );
    report.tests.push({ label: 'DOWN removes invalidation triggers', pass: Number(remainingTriggers.count) === 0 });

    let unchanged = true;
    for (const [table, count] of Object.entries(originalCounts)) {
      const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(mainSchema)}.${qid(table)}`);
      if (Number(row.count) !== count) unchanged = false;
    }
    report.tests.push({ label: 'main table counts unchanged', pass: unchanged, detail: `${Object.keys(originalCounts).length} tables checked` });
    report.originalTableCount = originalTables.length;
  } finally {
    if (test) await test.end();
    if (safeTestName.test(testSchema)) {
      await admin.query(`DROP DATABASE IF EXISTS ${qid(testSchema)}`);
      report.cleanup = true;
    }
    await admin.end();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  if (report.tests.some(testCase => !testCase.pass)) process.exitCode = 1;
}

run().catch(error => {
  console.error(JSON.stringify({ fatal: true, code: error.code, message: error.message }, null, 2));
  process.exitCode = 1;
});
