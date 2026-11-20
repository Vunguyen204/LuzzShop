const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const testDatabase = `luzzshop_paddle_it_${process.pid}_${Date.now()}`;
if (!/^luzzshop_paddle_it_\d+_\d+$/.test(testDatabase)) throw new Error("Unsafe test database name");

let adminConnection;
let db;
let server;
let baseUrl;
let adminToken;
let userToken;
let sourceId;

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const request = async (url, options = {}) => {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
};

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

const technicalPayload = {
  static_weight_min_g: 220,
  static_weight_max_g: 230,
  core_thickness_mm: 16,
  paddle_length_mm: 420,
  paddle_width_mm: 190,
  handle_length_mm: 140,
  grip_circumference_mm: 105,
  balance_point_mm: 235,
  swing_weight: 115,
  twist_weight: 6.5,
  face_material: "Verified test carbon",
  core_material: "Verified test polymer",
  construction: "Verified test construction",
  paddle_shape: "HYBRID",
};

const supportedFields = [
  ...Object.keys(technicalPayload),
  "power_score", "control_score", "spin_score", "forgiveness_score", "maneuverability_score", "comfort_score",
];

before(async () => {
  adminConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await adminConnection.query(`CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`);
  process.env.DB_NAME = testDatabase;
  process.env.JWT_SECRET = "paddle-integration-test-secret";
  db = require("../config/db").promise();

  const baseSchema = [
    `CREATE TABLE roles (role_id INT PRIMARY KEY, role_name VARCHAR(50) NOT NULL) ENGINE=InnoDB`,
    `CREATE TABLE users (
       user_id INT PRIMARY KEY, full_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL, phone VARCHAR(30), address TEXT, role_id INT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB`,
    `CREATE TABLE brands (
       brand_id INT PRIMARY KEY, brand_name VARCHAR(100) NOT NULL, slug VARCHAR(45),
       logo_url VARCHAR(255), status TINYINT DEFAULT 1
     ) ENGINE=InnoDB`,
    `CREATE TABLE categories (
       category_id INT PRIMARY KEY, parent_id INT NULL, category_name VARCHAR(100) NOT NULL,
       description TEXT, slug VARCHAR(100), ordering INT DEFAULT 0, status TINYINT DEFAULT 1
     ) ENGINE=InnoDB`,
    `CREATE TABLE products (
       product_id INT PRIMARY KEY, category_id INT NOT NULL, brand_id INT NOT NULL,
       product_name VARCHAR(255) NOT NULL, slug VARCHAR(255), sku VARCHAR(100), description LONGTEXT,
       price DECIMAL(12,2) NOT NULL, old_price DECIMAL(12,2), image_url VARCHAR(500),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status TINYINT DEFAULT 1
     ) ENGINE=InnoDB`,
    `CREATE TABLE product_variants (
       variant_id INT PRIMARY KEY, product_id INT NOT NULL, color VARCHAR(100), size VARCHAR(50),
       stock INT DEFAULT 0, image_url VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       status TINYINT DEFAULT 1
     ) ENGINE=InnoDB`,
  ];
  for (const statement of baseSchema) await db.query(statement);
  const migration = fs.readFileSync(path.join(__dirname, "../../Database/migrations/001_create_paddle_specs.up.sql"), "utf8");
  for (const statement of splitMigration(migration)) await db.query(statement);
  const migration002 = fs.readFileSync(path.join(__dirname, "../../Database/migrations/002_separate_technical_radar_invalidation.up.sql"), "utf8");
  for (const statement of splitMigration(migration002)) await db.query(statement);

  await db.query("INSERT INTO roles VALUES (1,'Admin'),(2,'Customer')");
  await db.query(`INSERT INTO users (user_id,full_name,email,password,role_id) VALUES
    (1,'Admin','admin@paddle.test','unused',1),(2,'User','user@paddle.test','unused',2)`);
  await db.query("INSERT INTO brands VALUES (1,'Test Brand','test-brand',NULL,1)");
  await db.query(`INSERT INTO categories VALUES
    (1,NULL,'Vợt Pickleball',NULL,'vot-pickleball',1,1),
    (2,NULL,'Giày Pickleball',NULL,'giay-pickleball',2,1)`);
  await db.query(`INSERT INTO products
    (product_id,category_id,brand_id,product_name,slug,sku,description,price,image_url,status) VALUES
    (101,1,1,'Test Paddle','test-paddle','PAD-101','Synthetic integration fixture',3000000,'paddle.jpg',1),
    (102,2,1,'Test Shoe','test-shoe','SHOE-102','Synthetic integration fixture',1000000,'shoe.jpg',1),
    (103,1,1,'Second Paddle','second-paddle','PAD-103','Synthetic integration fixture',4000000,'paddle-2.jpg',1)`);
  await db.query(`INSERT INTO product_variants (variant_id,product_id,stock,status) VALUES
    (201,101,5,1),(202,102,5,1),(203,103,0,1)`);

  adminToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1h" });
  userToken = jwt.sign({ id: 2 }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const app = require("../server");
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.end();
  if (adminConnection) {
    if (!/^luzzshop_paddle_it_\d+_\d+$/.test(testDatabase)) throw new Error("Unsafe cleanup database name");
    await adminConnection.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``);
    await adminConnection.end();
  }
});

test("Paddle Specs endpoints require authentication and Admin role", async () => {
  const guest = await request("/api/admin/paddle-specs");
  const user = await request("/api/admin/paddle-specs", { headers: auth(userToken) });
  const admin = await request("/api/admin/paddle-specs", { headers: auth(adminToken) });
  assert.equal(guest.status, 401);
  assert.equal(user.status, 403);
  assert.equal(admin.status, 200);
  assert.equal(admin.body.length, 2);
});

test("Admin can create one spec only for a paddle product", async () => {
  const created = await request("/api/admin/paddle-specs/101", { method: "POST", headers: auth(adminToken), body: "{}" });
  const duplicate = await request("/api/admin/paddle-specs/101", { method: "POST", headers: auth(adminToken), body: "{}" });
  const shoe = await request("/api/admin/paddle-specs/102", { method: "POST", headers: auth(adminToken), body: "{}" });
  assert.equal(created.status, 201);
  assert.equal(created.body.spec.verification_status, "DRAFT");
  assert.equal(duplicate.status, 409);
  assert.equal(shoe.status, 400);
});

test("Technical and score validation rejects invalid input without leaking SQL", async () => {
  const invalidTechnical = await request("/api/admin/paddle-specs/101/technical", {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ paddle_length_mm: 400, handle_length_mm: 450 }),
  });
  const invalidScore = await request("/api/admin/paddle-specs/101/scores", {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ power_score: 101 }),
  });
  assert.equal(invalidTechnical.status, 400);
  assert.equal(invalidScore.status, 400);
  assert.equal(JSON.stringify(invalidTechnical.body).includes("sql"), false);
  assert.equal(JSON.stringify(invalidScore.body).includes("sql"), false);
});

test("Incomplete IN_REVIEW spec cannot be VERIFIED", async () => {
  const submitted = await request("/api/admin/paddle-specs/101/submit", {
    method: "POST", headers: auth(adminToken), body: "{}",
  });
  const verified = await request("/api/admin/paddle-specs/101/review", {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({ decision: "VERIFIED" }),
  });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.spec.verification_status, "IN_REVIEW");
  assert.equal(verified.status, 400);
  assert.ok(verified.body.details?.includes("technical_fact_required"), JSON.stringify(verified.body));

  const rejected = await request("/api/admin/paddle-specs/101/review", {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({ decision: "REJECTED", review_note: "Thiếu bằng chứng" }),
  });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.spec.verification_status, "REJECTED");
});

test("Admin can edit rejected spec, CRUD and verify an evidence source", async () => {
  const technical = await request("/api/admin/paddle-specs/101/technical", {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify(technicalPayload),
  });
  assert.equal(technical.status, 200);
  assert.equal(technical.body.spec.verification_status, "DRAFT");

  const source = await request("/api/admin/paddle-specs/101/sources", {
    method: "POST", headers: auth(adminToken),
    body: JSON.stringify({
      source_type: "MANUFACTURER",
      source_title: "Synthetic manufacturer source",
      source_locator: "https://example.invalid/paddle-101",
      accessed_at: "2026-11-18T10:00:00Z",
      supported_fields: supportedFields,
      evidence_note: "Synthetic evidence used only in isolated integration database",
      is_primary: true,
    }),
  });
  assert.equal(source.status, 201);
  sourceId = Number(source.body.source_id);
  assert.ok(sourceId > 0);

  const detail = await request(`/api/admin/paddle-specs/101/sources/${sourceId}`, { headers: auth(adminToken) });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.verification_status, "PENDING");

  const prematureConfirmation = await request("/api/admin/paddle-specs/101/confirm", {
    method: "POST", headers: auth(adminToken), body: "{}",
  });
  assert.equal(prematureConfirmation.status, 400);
  assert.ok(prematureConfirmation.body.details.includes("pending_technical_evidence"));

  const sourceReview = await request(`/api/admin/paddle-specs/101/sources/${sourceId}/review`, {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({ decision: "VERIFIED" }),
  });
  assert.equal(sourceReview.status, 200);
  assert.equal(sourceReview.body.sources[0].verification_status, "VERIFIED");

  const duplicate = await request("/api/admin/paddle-specs/101/sources", {
    method: "POST", headers: auth(adminToken),
    body: JSON.stringify({
      source_type: "MANUFACTURER", source_title: "Duplicate",
      source_locator: "https://example.invalid/paddle-101", accessed_at: "2026-11-18T10:00:00Z",
      supported_fields: [],
    }),
  });
  assert.equal(duplicate.status, 409);
});

test("Admin directly confirms technical specs without Radar", async () => {
  const confirmed = await request("/api/admin/paddle-specs/101/confirm", {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({ review_note: "Synthetic direct confirmation" }),
  });
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.spec.verification_status, "VERIFIED");
  assert.equal(confirmed.body.quality.technical_verified, true);
  assert.equal(confirmed.body.quality.recommendation_eligible, true);
  assert.equal(confirmed.body.quality.finder_ready, true);
  assert.equal(confirmed.body.quality.radar_status, "UNSCORED");
  assert.equal(confirmed.body.quality.radar_ready, false);
  assert.ok(confirmed.body.spec.reviewed_by_user_id);
  assert.ok(confirmed.body.spec.reviewed_at);
});

test("Radar v1.1 can be PARTIAL then READY without revoking technical VERIFIED", async () => {
  const partialRationale = {
    power: {
      band: "HIGH", reason: "Synthetic power evidence", sourceIds: [sourceId],
      method: "EVIDENCE_BASED_ESTIMATE", confidence: "MEDIUM", limitations: "Synthetic test limitation",
    },
  };
  const partial = await request("/api/admin/paddle-specs/101/scores", {
    method: "PUT", headers: auth(adminToken),
    body: JSON.stringify({ power_score: 70, rubric_version: "v1.1", score_rationale: partialRationale }),
  });
  assert.equal(partial.status, 200);
  assert.equal(partial.body.spec.verification_status, "VERIFIED");
  assert.equal(partial.body.quality.radar_status, "PARTIAL");
  assert.equal(partial.body.quality.radar_coverage, 16.67);
  assert.equal(partial.body.quality.finder_ready, true);

  const rationale = Object.fromEntries(["power", "control", "spin", "forgiveness", "maneuverability", "comfort"]
    .map((axis) => [axis, {
      band: "HIGH", reason: `Synthetic ${axis} rationale`, sourceIds: [sourceId],
      method: "EVIDENCE_BASED_ESTIMATE", confidence: "MEDIUM", limitations: "Synthetic test limitation",
    }]));
  const scores = await request("/api/admin/paddle-specs/101/scores", {
    method: "PUT", headers: auth(adminToken),
    body: JSON.stringify({
      power_score: 70, control_score: 70, spin_score: 70,
      forgiveness_score: 70, maneuverability_score: 70, comfort_score: 70,
      rubric_version: "v1.1", score_rationale: rationale,
    }),
  });
  assert.equal(scores.status, 200);
  assert.equal(scores.body.spec.verification_status, "VERIFIED");
  assert.equal(scores.body.quality.radar_status, "READY");
  assert.equal(scores.body.quality.radar_ready, true);
  assert.equal(scores.body.quality.radar_confidence, "MEDIUM");
  assert.equal(scores.body.quality.finder_ready, true);
});

test("Spec and source edits invalidate VERIFIED state and API returns actual database state", async () => {
  const changedSpec = await request("/api/admin/paddle-specs/101/technical", {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ static_weight_max_g: 231 }),
  });
  assert.equal(changedSpec.status, 200);
  assert.equal(changedSpec.body.spec.verification_status, "IN_REVIEW");
  assert.equal(changedSpec.body.quality.finder_ready, false);

  const reverified = await request("/api/admin/paddle-specs/101/review", {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({ decision: "VERIFIED" }),
  });
  assert.equal(reverified.status, 200);

  const changedSource = await request(`/api/admin/paddle-specs/101/sources/${sourceId}`, {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ source_title: "Updated synthetic source" }),
  });
  assert.equal(changedSource.status, 200);
  assert.equal(changedSource.body.spec.verification_status, "IN_REVIEW");
  assert.equal(changedSource.body.quality.finder_ready, false);
});

test("Source delete and out-of-stock Finder readiness behave correctly", async () => {
  const second = await request("/api/admin/paddle-specs/103", { method: "POST", headers: auth(adminToken), body: "{}" });
  assert.equal(second.status, 201);
  assert.equal(second.body.quality.finder_ready, false);
  assert.ok(second.body.quality.missing.includes("available_stock"));

  const secondTechnical = {
    static_weight_min_g: 220, static_weight_max_g: 230, core_thickness_mm: 16,
    paddle_length_mm: 420, paddle_width_mm: 190, face_material: "Synthetic verified face",
  };
  await request("/api/admin/paddle-specs/103/technical", {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify(secondTechnical),
  });
  const secondSource = await request("/api/admin/paddle-specs/103/sources", {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({
      source_type: "MANUFACTURER", source_title: "Second synthetic source",
      source_locator: "https://example.invalid/paddle-103", accessed_at: "2026-11-18T10:00:00Z",
      supported_fields: [...Object.keys(secondTechnical),
        "power_score", "control_score", "spin_score", "forgiveness_score", "maneuverability_score", "comfort_score"],
      evidence_note: "Isolated test evidence",
    }),
  });
  const secondSourceId = Number(secondSource.body.source_id);
  await request(`/api/admin/paddle-specs/103/sources/${secondSourceId}/review`, {
    method: "POST", headers: auth(adminToken), body: JSON.stringify({ decision: "VERIFIED" }),
  });
  const secondConfirmed = await request("/api/admin/paddle-specs/103/confirm", {
    method: "POST", headers: auth(adminToken), body: "{}",
  });
  assert.equal(secondConfirmed.status, 200);
  assert.equal(secondConfirmed.body.quality.recommendation_eligible, true);
  assert.equal(secondConfirmed.body.quality.finder_ready, false);
  assert.equal(secondConfirmed.body.quality.radar_status, "UNSCORED");

  const legacyRationale = Object.fromEntries(["power", "control", "spin", "forgiveness", "maneuverability", "comfort"]
    .map((axis) => [axis, { band: "HIGH", reason: `Legacy ${axis} evidence`, sourceIds: [secondSourceId] }]));
  await db.query(`UPDATE paddle_specs SET
    power_score = 72, control_score = 68, spin_score = 74, forgiveness_score = 66,
    maneuverability_score = 71, comfort_score = 69, rubric_version = 'v1.0',
    score_rationale = ? WHERE product_id = 103`, [JSON.stringify(legacyRationale)]);
  const legacyScores = await request("/api/admin/paddle-specs/103", { headers: auth(adminToken) });
  assert.equal(legacyScores.status, 200);
  assert.equal(legacyScores.body.spec.verification_status, "VERIFIED");
  assert.equal(legacyScores.body.quality.radar.legacy, true);
  assert.equal(legacyScores.body.quality.radar_status, "LEGACY_REVIEW_REQUIRED");
  assert.equal(legacyScores.body.quality.radar_ready, false);

  const rejectedLegacyWrite = await request("/api/admin/paddle-specs/103/scores", {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({
      power_score: 72, control_score: 68, spin_score: 74, forgiveness_score: 66,
      maneuverability_score: 71, comfort_score: 69, rubric_version: "v1.0",
      score_rationale: legacyRationale,
    }),
  });
  assert.equal(rejectedLegacyWrite.status, 400);
  assert.ok(rejectedLegacyWrite.body.details.includes("radar.rubric_v1_1_required"));

  const rejectedSource = await request(`/api/admin/paddle-specs/103/sources/${secondSourceId}/review`, {
    method: "POST", headers: auth(adminToken),
    body: JSON.stringify({ decision: "REJECTED", review_note: "Synthetic evidence rejected" }),
  });
  assert.equal(rejectedSource.status, 200);
  assert.equal(rejectedSource.body.spec.verification_status, "IN_REVIEW");
  assert.equal(rejectedSource.body.quality.technical_verified, false);
  assert.equal(rejectedSource.body.quality.technical_evidence_coverage, 0);

  const removed = await request(`/api/admin/paddle-specs/101/sources/${sourceId}`, {
    method: "DELETE", headers: auth(adminToken), body: "{}",
  });
  assert.equal(removed.status, 200);
  assert.equal(removed.body.sources.length, 0);
  assert.equal(removed.body.quality.technical_evidence_coverage, 0);
  assert.equal(removed.body.quality.technical_verified, false);
  assert.equal(removed.body.quality.recommendation_eligible, false);
  assert.ok(removed.body.quality.technical_evidence.blockers.includes("verified_technical_source_required"));
});

