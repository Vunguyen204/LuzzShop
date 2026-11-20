/*
 * Phase 4D.3 coordinated deployment rehearsal.
 * Production `luzzshop` is read-only. All mutations are restricted to a
 * generated clone matching luzzshop_4d3_test_<pid>_<timestamp>.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mysql = require("../../Backend/node_modules/mysql2/promise");
const jwt = require("../../Backend/node_modules/jsonwebtoken");
require("../../Backend/node_modules/dotenv").config({
  path: path.join(__dirname, "../../Backend/.env"),
  quiet: true,
});

const productionSchema = process.env.DB_NAME;
const cloneSchema = `luzzshop_4d3_test_${process.pid}_${Date.now()}`;
const safeCloneName = /^luzzshop_4d3_test_\d+_\d+$/;
const migrationPath = path.join(__dirname, "../migrations/002_separate_technical_radar_invalidation.up.sql");
const qid = (value) => `\`${String(value).replace(/`/g, "``")}\``;

if (productionSchema !== "luzzshop") throw new Error("Safety stop: DB_NAME must be exactly luzzshop");
if (!safeCloneName.test(cloneSchema) || cloneSchema === productionSchema) throw new Error("Safety stop: invalid clone name");

const splitMigration = (sql) => {
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
  if (buffer.trim()) throw new Error("Unterminated migration statement");
  return statements.filter(Boolean);
};

const report = {
  productionSchema,
  cloneSchema,
  productionWriteOperations: 0,
  tests: [],
  cleanup: false,
};

const check = (label, condition, detail) => {
  report.tests.push({ label, pass: Boolean(condition), detail });
  if (!condition) throw new Error(`FAIL: ${label}`);
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function run() {
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: false,
  });
  let clone;
  let appPool;
  let server;
  try {
    const [[serverInfo]] = await admin.query("SELECT VERSION() version, @@version_comment version_comment");
    report.server = serverInfo;
    check("MariaDB 11.5.2 detected", String(serverInfo.version).startsWith("11.5.2"), serverInfo.version);

    const [tables] = await admin.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
      [productionSchema],
    );
    check("production has 17 base tables", tables.length === 17, tables.length);

    const productionCounts = {};
    for (const { TABLE_NAME: table } of tables) {
      const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(productionSchema)}.${qid(table)}`);
      productionCounts[table] = Number(row.count);
    }
    const [productionTriggers] = await admin.query(
      `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN ('paddle_specs','paddle_spec_sources')
        ORDER BY TRIGGER_NAME`,
      [productionSchema],
    );
    check("production currently has four Paddle triggers", productionTriggers.length === 4, productionTriggers.map((row) => row.TRIGGER_NAME));

    await admin.query(`CREATE DATABASE ${qid(cloneSchema)} CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`);
    clone = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: cloneSchema,
      multipleStatements: false,
    });
    const [[identity]] = await clone.query("SELECT DATABASE() current_database");
    check("Backend target is isolated clone", identity.current_database === cloneSchema, identity.current_database);

    await clone.query("SET FOREIGN_KEY_CHECKS=0");
    for (const { TABLE_NAME: table } of tables) {
      const [[ddlRow]] = await admin.query(`SHOW CREATE TABLE ${qid(productionSchema)}.${qid(table)}`);
      const ddl = ddlRow["Create Table"].replace(/^CREATE TABLE `[^`]+`/, `CREATE TABLE ${qid(table)}`);
      await clone.query(ddl);
      await clone.query(`INSERT INTO ${qid(table)} SELECT * FROM ${qid(productionSchema)}.${qid(table)}`);
    }
    await clone.query("SET FOREIGN_KEY_CHECKS=1");

    for (const [table, count] of Object.entries(productionCounts)) {
      const [[row]] = await clone.query(`SELECT COUNT(*) count FROM ${qid(table)}`);
      check(`clone row count matches: ${table}`, Number(row.count) === count, Number(row.count));
    }

    for (const statement of splitMigration(fs.readFileSync(migrationPath, "utf8"))) await clone.query(statement);
    const [cloneTriggers] = await clone.query(
      `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN ('paddle_specs','paddle_spec_sources')
        ORDER BY TRIGGER_NAME`,
      [cloneSchema],
    );
    check("migration 002 installs exactly four triggers", cloneTriggers.length === 4, cloneTriggers.map((row) => row.TRIGGER_NAME));

    const [[adminUser]] = await clone.query("SELECT user_id FROM users WHERE role_id=1 ORDER BY user_id LIMIT 1");
    if (!adminUser) throw new Error("Clone has no Admin user");
    const [products] = await clone.query(`
      SELECT p.product_id
        FROM products p
        JOIN categories c ON c.category_id=p.category_id AND c.slug='vot-pickleball'
        LEFT JOIN paddle_specs ps ON ps.product_id=p.product_id
       WHERE ps.product_id IS NULL AND p.status=1 AND p.price>0
         AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id=p.product_id AND pv.status=1 AND pv.stock>0)
       ORDER BY p.product_id LIMIT 2
    `);
    if (products.length < 2) throw new Error("Clone needs two active in-stock paddles without specs");
    const productId = Number(products[0].product_id);
    const legacyProductId = Number(products[1].product_id);

    process.env.DB_NAME = cloneSchema;
    process.env.JWT_SECRET = `phase-4d3-${crypto.randomBytes(24).toString("hex")}`;
    const app = require("../../Backend/server");
    appPool = require("../../Backend/config/db");
    await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const token = jwt.sign({ id: adminUser.user_id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const request = async (url, options = {}) => {
      const response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...auth(token), ...(options.headers || {}) },
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    };

    let response = await request(`/api/admin/paddle-specs/${productId}`, { method: "POST", body: "{}" });
    check("Admin creates DRAFT profile", response.status === 201 && response.body.spec.verification_status === "DRAFT", response.status);

    const technical = {
      static_weight_min_g: 220,
      static_weight_max_g: 230,
      core_thickness_mm: 16,
      paddle_length_mm: 420,
      paddle_width_mm: 190,
      face_material: "Synthetic clone-only carbon",
    };
    response = await request(`/api/admin/paddle-specs/${productId}/technical`, {
      method: "PUT", body: JSON.stringify(technical),
    });
    check("technical fields save without inferred advanced metrics", response.status === 200
      && response.body.spec.swing_weight === null
      && response.body.spec.twist_weight === null
      && response.body.spec.balance_point_mm === null, response.body.spec);
    check("missing Radar stays NULL", ["power", "control", "spin", "forgiveness", "maneuverability", "comfort"]
      .every((axis) => response.body.spec[`${axis}_score`] === null), "all six axes null");

    response = await request(`/api/admin/paddle-specs/${productId}/sources`, {
      method: "POST",
      body: JSON.stringify({
        source_type: "MANUFACTURER",
        source_title: "Phase 4D.3 synthetic clone-only source",
        source_locator: `https://example.invalid/phase-4d3/${cloneSchema}`,
        accessed_at: "2026-11-20T10:00:00Z",
        supported_fields: Object.keys(technical),
        evidence_note: "Synthetic evidence in disposable clone only",
        is_primary: true,
      }),
    });
    const sourceId = Number(response.body?.source_id);
    check("Admin adds PENDING technical source", response.status === 201 && sourceId > 0, sourceId);

    response = await request(`/api/admin/paddle-specs/${productId}/sources/${sourceId}/review`, {
      method: "POST", body: JSON.stringify({ decision: "VERIFIED" }),
    });
    check("Admin verifies source", response.status === 200 && response.body.sources[0].verification_status === "VERIFIED", response.status);

    response = await request(`/api/admin/paddle-specs/${productId}/confirm`, {
      method: "POST", body: JSON.stringify({ review_note: "Phase 4D.3 clone rehearsal" }),
    });
    check("direct confirm makes technical profile VERIFIED without Radar", response.status === 200
      && response.body.spec.verification_status === "VERIFIED"
      && response.body.quality.technical_verified === true
      && response.body.quality.radar_status === "UNSCORED", response.body.quality);
    check("recommendation and Finder readiness are specification-first", response.body.quality.recommendation_eligible === true
      && response.body.quality.finder_ready === true, response.body.quality);

    const radarSourceResponse = await request(`/api/admin/paddle-specs/${productId}/sources`, {
      method: "POST",
      body: JSON.stringify({
        source_type: "CERTIFIED_DOCUMENT",
        source_title: "Phase 4D.3 synthetic Radar-only source",
        source_locator: `https://example.invalid/phase-4d3/radar/${cloneSchema}`,
        accessed_at: "2026-11-20T10:00:00Z",
        supported_fields: ["power_score"],
        evidence_note: "Synthetic Radar evidence in disposable clone only",
      }),
    });
    const radarSourceId = Number(radarSourceResponse.body?.source_id);
    check("Radar-only source insert keeps technical VERIFIED", radarSourceResponse.status === 201
      && radarSourceResponse.body.spec.verification_status === "VERIFIED", radarSourceResponse.body.spec.verification_status);
    const radarSourceReview = await request(`/api/admin/paddle-specs/${productId}/sources/${radarSourceId}/review`, {
      method: "POST", body: JSON.stringify({ decision: "VERIFIED" }),
    });
    check("Radar-only source verification keeps technical VERIFIED", radarSourceReview.status === 200
      && radarSourceReview.body.spec.verification_status === "VERIFIED", radarSourceReview.body.spec.verification_status);

    response = await request(`/api/admin/paddle-specs/${productId}/scores`, {
      method: "PUT",
      body: JSON.stringify({
        power_score: 70,
        rubric_version: "v1.1",
        score_rationale: {
          power: {
            band: "HIGH",
            reason: "Synthetic clone-only Radar evidence",
            sourceIds: [radarSourceId],
            method: "EVIDENCE_BASED_ESTIMATE",
            confidence: "MEDIUM",
            limitations: "No instrument measurement; deployment rehearsal only",
          },
        },
      }),
    });
    check("Radar mutation keeps technical VERIFIED", response.status === 200
      && response.body.spec.verification_status === "VERIFIED"
      && response.body.quality.technical_verified === true
      && response.body.quality.radar_status === "PARTIAL"
      && Number(response.body.quality.radar_coverage) === 16.67, response.body.quality);

    response = await request(`/api/admin/paddle-specs/${productId}/technical`, {
      method: "PUT", body: JSON.stringify({ static_weight_max_g: 231 }),
    });
    check("technical fact mutation invalidates confirmation", response.status === 200
      && response.body.spec.verification_status === "IN_REVIEW"
      && response.body.quality.technical_verified === false, response.body.spec.verification_status);

    response = await request(`/api/admin/paddle-specs/${productId}/confirm`, { method: "POST", body: "{}" });
    check("Admin can reconfirm after rechecking still-valid field coverage", response.status === 200
      && response.body.spec.verification_status === "VERIFIED", response.status);

    response = await request(`/api/admin/paddle-specs/${productId}/sources/${sourceId}`, {
      method: "PUT", body: JSON.stringify({ source_title: "Edited Phase 4D.3 source" }),
    });
    check("technical source edit invalidates confirmation", response.status === 200
      && response.body.spec.verification_status === "IN_REVIEW", response.body.spec.verification_status);

    response = await request(`/api/admin/paddle-specs/${productId}/confirm`, { method: "POST", body: "{}" });
    check("Admin reconfirms after source review", response.status === 200
      && response.body.spec.verification_status === "VERIFIED", response.status);

    response = await request(`/api/admin/paddle-specs/${productId}/sources/${sourceId}/review`, {
      method: "POST", body: JSON.stringify({ decision: "REJECTED", review_note: "Synthetic rejection test" }),
    });
    check("technical source rejection invalidates confirmation and evidence", response.status === 200
      && response.body.spec.verification_status === "IN_REVIEW"
      && response.body.quality.technical_verified === false
      && Number(response.body.quality.technical_evidence_coverage) === 0, response.body.quality);

    response = await request(`/api/admin/paddle-specs/${legacyProductId}`, { method: "POST", body: "{}" });
    check("legacy create endpoint remains compatible", response.status === 201, response.status);
    response = await request(`/api/admin/paddle-specs/${legacyProductId}/technical`, {
      method: "PUT", body: JSON.stringify(technical),
    });
    const legacySource = await request(`/api/admin/paddle-specs/${legacyProductId}/sources`, {
      method: "POST",
      body: JSON.stringify({
        source_type: "MANUFACTURER",
        source_title: "Legacy workflow clone source",
        source_locator: `https://example.invalid/phase-4d3/legacy/${cloneSchema}`,
        accessed_at: "2026-11-20T10:00:00Z",
        supported_fields: Object.keys(technical),
      }),
    });
    const legacySourceId = Number(legacySource.body.source_id);
    await request(`/api/admin/paddle-specs/${legacyProductId}/sources/${legacySourceId}/review`, {
      method: "POST", body: JSON.stringify({ decision: "VERIFIED" }),
    });
    response = await request(`/api/admin/paddle-specs/${legacyProductId}/submit`, { method: "POST", body: "{}" });
    check("legacy submit endpoint remains compatible", response.status === 200 && response.body.spec.verification_status === "IN_REVIEW", response.status);
    response = await request(`/api/admin/paddle-specs/${legacyProductId}/review`, {
      method: "POST", body: JSON.stringify({ decision: "VERIFIED", review_note: "Legacy workflow rehearsal" }),
    });
    check("legacy review VERIFIED endpoint remains compatible", response.status === 200
      && response.body.spec.verification_status === "VERIFIED", response.status);
    response = await request(`/api/admin/paddle-specs/${legacyProductId}/scores`, {
      method: "PUT",
      body: JSON.stringify({ power_score: 70, rubric_version: "v1.0", score_rationale: {
        power: { band: "HIGH", reason: "Legacy payload", sourceIds: [legacySourceId] },
      } }),
    });
    check("Frontend 4B legacy Radar payload is rejected explicitly", response.status === 400
      && response.body.details?.includes("radar.rubric_v1_1_required"), response.body);

    response = await request("/api/admin/paddle-specs");
    check("legacy list endpoint remains available", response.status === 200 && Array.isArray(response.body), response.status);
    response = await request(`/api/admin/paddle-specs/${legacyProductId}`);
    check("legacy detail endpoint remains available", response.status === 200 && response.body.spec, response.status);

    await new Promise((resolve) => server.close(resolve));
    server = null;
    await appPool.promise().end();
    appPool = null;

    let productionUnchanged = true;
    for (const [table, count] of Object.entries(productionCounts)) {
      const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(productionSchema)}.${qid(table)}`);
      if (Number(row.count) !== count) productionUnchanged = false;
    }
    check("all production row counts remain unchanged", productionUnchanged, `${tables.length} tables checked`);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (appPool) await appPool.promise().end().catch(() => {});
    if (clone) await clone.end();
    if (safeCloneName.test(cloneSchema)) {
      await admin.query(`DROP DATABASE IF EXISTS ${qid(cloneSchema)}`);
      report.cleanup = true;
    }
    const [[remaining]] = await admin.query(
      "SELECT COUNT(*) count FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?",
      [cloneSchema],
    );
    report.cloneExistsAfterCleanup = Number(remaining.count) > 0;
    await admin.end();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
}

run().catch((error) => {
  report.fatal = { code: error.code, message: error.message };
  process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = 1;
});
