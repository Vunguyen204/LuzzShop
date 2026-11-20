/*
 * Phase 4D.1 rehearsal. Destructive only to a generated disposable schema
 * matching luzzshop_policy_test_YYYYMMDDHHMMSS. The configured luzzshop schema
 * is read-only: schema/data cloning plus before/after row-count checks.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mysql = require("../../Backend/node_modules/mysql2/promise");
require("../../Backend/node_modules/dotenv").config({ path: path.join(__dirname, "../../Backend/.env") });

const mainSchema = process.env.DB_NAME;
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const testSchema = `luzzshop_policy_test_${stamp}`;
const safeTestName = /^luzzshop_policy_test_\d{14}$/;
const qid = (value) => `\`${value.replace(/`/g, "``")}\``;
const normalizeTableDdl = (ddl) => ddl.replace(/ AUTO_INCREMENT=\d+/g, " AUTO_INCREMENT=<counter>");
const upPath = path.join(__dirname, "../migrations/002_separate_technical_radar_invalidation.up.sql");
const downPath = path.join(__dirname, "../migrations/002_separate_technical_radar_invalidation.down.sql");

if (!mainSchema || mainSchema.toLowerCase() !== "luzzshop") throw new Error("Safety stop: DB_NAME must be exactly luzzshop");
if (!safeTestName.test(testSchema) || testSchema === mainSchema) throw new Error("Safety stop: invalid clone name");

function splitMigration(sql) {
  const statements = [];
  let delimiter = ";";
  let buffer = "";
  for (const line of sql.split(/\r?\n/)) {
    const directive = line.match(/^DELIMITER\s+(.+)$/i);
    if (directive) { delimiter = directive[1]; continue; }
    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      statements.push(buffer.trim().slice(0, -delimiter.length).trim());
      buffer = "";
    }
  }
  if (buffer.trim()) throw new Error("Unterminated SQL statement");
  return statements.filter(Boolean);
}

const pass = (report, label, condition, detail) => report.tests.push({ label, pass: Boolean(condition), detail });

async function markVerified(connection, specId, userId, completeness = 80) {
  await connection.query(
    `UPDATE paddle_specs SET verification_status='VERIFIED', submitted_at=COALESCE(submitted_at,NOW()),
       reviewed_by_user_id=?, reviewed_at=NOW(), data_completeness=? WHERE paddle_spec_id=?`,
    [userId, completeness, specId],
  );
}

async function getState(connection, specId) {
  const [[row]] = await connection.query(
    "SELECT verification_status, reviewed_by_user_id, reviewed_at, data_completeness, rubric_version, power_score FROM paddle_specs WHERE paddle_spec_id=?",
    [specId],
  );
  return row;
}

async function addSource(connection, specId, userId, suffix, supportedFields) {
  const locator = `https://example.invalid/policy-${suffix}`;
  const fingerprint = crypto.createHash("sha256").update(`MANUFACTURER:${locator}`).digest();
  const [result] = await connection.query(
    `INSERT INTO paddle_spec_sources
       (paddle_spec_id,source_type,source_title,source_locator,source_fingerprint,
        accessed_at,supported_fields,created_by_user_id)
     VALUES (?,'MANUFACTURER',?,?,?,NOW(),?,?)`,
    [specId, `Nguồn kiểm thử ${suffix}`, locator, fingerprint, JSON.stringify(supportedFields), userId],
  );
  return result.insertId;
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
    const [[server]] = await admin.query("SELECT VERSION() version, @@version_comment version_comment");
    report.server = server;
    const [originalTables] = await admin.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
      [mainSchema],
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
    const [[identity]] = await test.query("SELECT DATABASE() current_database");
    if (identity.current_database !== testSchema || identity.current_database === mainSchema) throw new Error("Safety stop: clone identity mismatch");
    pass(report, "isolated clone identity", true, identity.current_database);

    await test.query("SET FOREIGN_KEY_CHECKS=0");
    for (const { TABLE_NAME: table } of originalTables) {
      const [[ddlRow]] = await admin.query(`SHOW CREATE TABLE ${qid(mainSchema)}.${qid(table)}`);
      const ddl = ddlRow["Create Table"].replace(/^CREATE TABLE `[^`]+`/, `CREATE TABLE ${qid(table)}`);
      await test.query(ddl);
      await test.query(`INSERT INTO ${qid(table)} SELECT * FROM ${qid(mainSchema)}.${qid(table)}`);
    }
    await test.query("SET FOREIGN_KEY_CHECKS=1");
    pass(report, "all production tables cloned", originalTables.length === 17, `${originalTables.length} tables`);

    const [[product]] = await test.query(
      "SELECT p.product_id FROM products p LEFT JOIN paddle_specs ps ON ps.product_id=p.product_id WHERE ps.product_id IS NULL ORDER BY p.product_id LIMIT 1",
    );
    const [[user]] = await test.query("SELECT user_id FROM users ORDER BY user_id LIMIT 1");
    if (!product || !user) throw new Error("Clone lacks an unused product or user fixture");

    const legacyRationale = JSON.stringify({
      power: { band: "HIGH", reason: "Legacy v1.0 clone fixture", sourceIds: [999999] },
    });
    const [specInsert] = await test.query(
      `INSERT INTO paddle_specs
       (product_id,static_weight_min_g,static_weight_max_g,power_score,control_score,spin_score,
        forgiveness_score,maneuverability_score,comfort_score,score_rationale,rubric_version,
        verification_status,data_completeness,submitted_at,reviewed_by_user_id,reviewed_at,created_by_user_id)
       VALUES (?,220,230,70,50,50,50,50,50,?,'v1.0','VERIFIED',80,NOW(),?,NOW(),?)`,
      [product.product_id, legacyRationale, user.user_id, user.user_id],
    );
    const specId = specInsert.insertId;
    const beforeUp = await getState(test, specId);
    const [[specDdlBefore]] = await test.query("SHOW CREATE TABLE paddle_specs");
    const [[sourceDdlBefore]] = await test.query("SHOW CREATE TABLE paddle_spec_sources");
    const [[specCountBefore]] = await test.query("SELECT COUNT(*) count FROM paddle_specs");
    const [[sourceCountBefore]] = await test.query("SELECT COUNT(*) count FROM paddle_spec_sources");

    for (const statement of splitMigration(fs.readFileSync(upPath, "utf8"))) await test.query(statement);
    const afterUp = await getState(test, specId);
    pass(report, "UP preserves v1.0 row and approval", JSON.stringify(beforeUp) === JSON.stringify(afterUp), afterUp);
    const [[specDdlAfterUp]] = await test.query("SHOW CREATE TABLE paddle_specs");
    const [[sourceDdlAfterUp]] = await test.query("SHOW CREATE TABLE paddle_spec_sources");
    pass(report, "UP leaves both table definitions unchanged",
      normalizeTableDdl(specDdlBefore["Create Table"]) === normalizeTableDdl(specDdlAfterUp["Create Table"])
      && normalizeTableDdl(sourceDdlBefore["Create Table"]) === normalizeTableDdl(sourceDdlAfterUp["Create Table"]), "SHOW CREATE TABLE compared; AUTO_INCREMENT counter ignored");
    const [[specCountAfterUp]] = await test.query("SELECT COUNT(*) count FROM paddle_specs");
    const [[sourceCountAfterUp]] = await test.query("SELECT COUNT(*) count FROM paddle_spec_sources");
    pass(report, "UP leaves row counts unchanged",
      Number(specCountBefore.count) === Number(specCountAfterUp.count)
      && Number(sourceCountBefore.count) === Number(sourceCountAfterUp.count),
      { paddle_specs: Number(specCountAfterUp.count), paddle_spec_sources: Number(sourceCountAfterUp.count) });
    const [[upTriggers]] = await test.query(
      "SELECT COUNT(*) count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN ('paddle_specs','paddle_spec_sources')",
      [testSchema],
    );
    pass(report, "UP installs exactly four triggers", Number(upTriggers.count) === 4, Number(upTriggers.count));

    await test.query("UPDATE paddle_specs SET power_score=90 WHERE paddle_spec_id=?", [specId]);
    let state = await getState(test, specId);
    pass(report, "Radar score edit keeps technical VERIFIED", state.verification_status === "VERIFIED" && state.reviewed_by_user_id !== null, state);

    await test.query("UPDATE paddle_specs SET rubric_version='v1.1', score_rationale=JSON_SET(score_rationale,'$.power.confidence','MEDIUM') WHERE paddle_spec_id=?", [specId]);
    state = await getState(test, specId);
    pass(report, "rubric/rationale edit keeps technical VERIFIED", state.verification_status === "VERIFIED" && state.rubric_version === "v1.1", state);

    await test.query("UPDATE paddle_specs SET static_weight_min_g=221 WHERE paddle_spec_id=?", [specId]);
    state = await getState(test, specId);
    pass(report, "technical fact edit invalidates approval", state.verification_status === "IN_REVIEW" && state.reviewed_by_user_id === null && Number(state.data_completeness) === 0, state);

    await markVerified(test, specId, user.user_id);
    const radarSource = await addSource(test, specId, user.user_id, "radar", ["power_score"]);
    state = await getState(test, specId);
    pass(report, "Radar-only source insert keeps technical VERIFIED", state.verification_status === "VERIFIED", state);
    await test.query("UPDATE paddle_spec_sources SET source_title='Nguồn Radar đã sửa' WHERE paddle_spec_source_id=?", [radarSource]);
    state = await getState(test, specId);
    pass(report, "Radar-only source update keeps technical VERIFIED", state.verification_status === "VERIFIED", state);
    await test.query("DELETE FROM paddle_spec_sources WHERE paddle_spec_source_id=?", [radarSource]);
    state = await getState(test, specId);
    pass(report, "Radar-only source delete keeps technical VERIFIED", state.verification_status === "VERIFIED", state);

    const technicalSource = await addSource(test, specId, user.user_id, "technical", ["static_weight_min_g"]);
    state = await getState(test, specId);
    pass(report, "technical source insert invalidates approval", state.verification_status === "IN_REVIEW", state);
    await markVerified(test, specId, user.user_id);
    await test.query("UPDATE paddle_spec_sources SET evidence_note='Thay đổi bằng chứng kỹ thuật' WHERE paddle_spec_source_id=?", [technicalSource]);
    state = await getState(test, specId);
    pass(report, "technical source update invalidates approval", state.verification_status === "IN_REVIEW", state);
    await markVerified(test, specId, user.user_id);
    await test.query("DELETE FROM paddle_spec_sources WHERE paddle_spec_source_id=?", [technicalSource]);
    state = await getState(test, specId);
    pass(report, "technical source delete invalidates approval", state.verification_status === "IN_REVIEW", state);

    await markVerified(test, specId, user.user_id);
    const changedCoverageSource = await addSource(test, specId, user.user_id, "coverage", ["power_score"]);
    await test.query("UPDATE paddle_spec_sources SET supported_fields='[\"power_score\",\"core_thickness_mm\"]' WHERE paddle_spec_source_id=?", [changedCoverageSource]);
    state = await getState(test, specId);
    pass(report, "source changing from Radar-only to technical invalidates approval", state.verification_status === "IN_REVIEW", state);

    for (const statement of splitMigration(fs.readFileSync(downPath, "utf8"))) await test.query(statement);
    const [[specDdlAfterDown]] = await test.query("SHOW CREATE TABLE paddle_specs");
    const [[sourceDdlAfterDown]] = await test.query("SHOW CREATE TABLE paddle_spec_sources");
    pass(report, "DOWN leaves both table definitions unchanged",
      normalizeTableDdl(specDdlBefore["Create Table"]) === normalizeTableDdl(specDdlAfterDown["Create Table"])
      && normalizeTableDdl(sourceDdlBefore["Create Table"]) === normalizeTableDdl(sourceDdlAfterDown["Create Table"]), "SHOW CREATE TABLE compared; AUTO_INCREMENT counter ignored");
    const [[downTriggers]] = await test.query(
      "SELECT COUNT(*) count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN ('paddle_specs','paddle_spec_sources')",
      [testSchema],
    );
    pass(report, "DOWN restores exactly four legacy triggers", Number(downTriggers.count) === 4, Number(downTriggers.count));

    await markVerified(test, specId, user.user_id);
    await test.query("UPDATE paddle_specs SET control_score=70 WHERE paddle_spec_id=?", [specId]);
    state = await getState(test, specId);
    pass(report, "DOWN restores legacy score invalidation", state.verification_status === "IN_REVIEW", state);
    await markVerified(test, specId, user.user_id);
    await addSource(test, specId, user.user_id, "legacy-radar", ["spin_score"]);
    state = await getState(test, specId);
    pass(report, "DOWN restores legacy all-source invalidation", state.verification_status === "IN_REVIEW", state);

    let mainCountsUnchanged = true;
    for (const [table, count] of Object.entries(originalCounts)) {
      const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(mainSchema)}.${qid(table)}`);
      if (Number(row.count) !== count) mainCountsUnchanged = false;
    }
    pass(report, "production row counts unchanged", mainCountsUnchanged, `${originalTables.length} tables checked`);
  } finally {
    if (test) await test.end();
    if (safeTestName.test(testSchema)) {
      await admin.query(`DROP DATABASE IF EXISTS ${qid(testSchema)}`);
      report.cleanup = true;
    }
    const [[remaining]] = await admin.query("SELECT COUNT(*) count FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?", [testSchema]);
    report.cloneExistsAfterCleanup = Number(remaining.count) > 0;
    await admin.end();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  if (report.tests.some((testCase) => !testCase.pass)) process.exitCode = 1;
}

run().catch((error) => {
  console.error(JSON.stringify({ fatal: true, code: error.code, message: error.message }, null, 2));
  process.exitCode = 1;
});
