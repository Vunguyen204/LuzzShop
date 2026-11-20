/* Setup/cleanup a disposable full-stack UAT clone. Production is read-only. */
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("../../Backend/node_modules/mysql2/promise");
const bcrypt = require("../../Backend/node_modules/bcryptjs");
require("../../Backend/node_modules/dotenv").config({ path: path.join(__dirname, "../../Backend/.env"), quiet: true });

const mode = process.argv[2];
const requestedClone = process.argv[3];
const production = process.env.DB_NAME;
const generatedClone = `luzzshop_4d5_uat_${process.pid}_${Date.now()}`;
const clone = mode === "cleanup" ? requestedClone : generatedClone;
const safeName = /^luzzshop_4d5_uat_\d+_\d+$/;
const qid = (value) => `\`${String(value).replace(/`/g, "``")}\``;
const uatFixturePassword = process.env.PADDLE_UAT_FIXTURE_PASSWORD;

if (production !== "luzzshop") throw new Error("Safety stop: DB_NAME must be exactly luzzshop");
if (!safeName.test(clone) || clone === production) throw new Error("Safety stop: invalid UAT clone name");
if (!uatFixturePassword) throw new Error("Safety stop: PADDLE_UAT_FIXTURE_PASSWORD is required");

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

async function main() {
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: false,
  });
  try {
    if (mode === "verify-production") {
      const [tables] = await admin.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
        [production],
      );
      const counts = {};
      for (const { TABLE_NAME: table } of tables) {
        const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(production)}.${qid(table)}`);
        counts[table] = Number(row.count);
      }
      process.stdout.write(`${JSON.stringify({ mode, database: production, tables: tables.length, counts })}\n`);
      return;
    }
    if (mode === "cleanup") {
      await admin.query(`DROP DATABASE IF EXISTS ${qid(clone)}`);
      const [[remaining]] = await admin.query("SELECT COUNT(*) count FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?", [clone]);
      process.stdout.write(`${JSON.stringify({ mode, clone, removed: Number(remaining.count) === 0 })}\n`);
      return;
    }
    if (mode !== "setup") throw new Error("Usage: setup | cleanup <safe-clone-name>");

    const [tables] = await admin.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
      [production],
    );
    if (tables.length !== 17) throw new Error(`Expected 17 production tables, found ${tables.length}`);
    const productionCounts = {};
    for (const { TABLE_NAME: table } of tables) {
      const [[row]] = await admin.query(`SELECT COUNT(*) count FROM ${qid(production)}.${qid(table)}`);
      productionCounts[table] = Number(row.count);
    }

    await admin.query(`CREATE DATABASE ${qid(clone)} CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`);
    const test = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: clone,
      multipleStatements: false,
    });
    try {
      const [[identity]] = await test.query("SELECT DATABASE() current_database");
      if (identity.current_database !== clone) throw new Error("Clone identity mismatch");
      await test.query("SET FOREIGN_KEY_CHECKS=0");
      for (const { TABLE_NAME: table } of tables) {
        const [[ddlRow]] = await admin.query(`SHOW CREATE TABLE ${qid(production)}.${qid(table)}`);
        const ddl = ddlRow["Create Table"].replace(/^CREATE TABLE `[^`]+`/, `CREATE TABLE ${qid(table)}`);
        await test.query(ddl);
        await test.query(`INSERT INTO ${qid(table)} SELECT * FROM ${qid(production)}.${qid(table)}`);
      }
      await test.query("SET FOREIGN_KEY_CHECKS=1");
      const migrationPath = path.join(__dirname, "../migrations/002_separate_technical_radar_invalidation.up.sql");
      for (const statement of splitMigration(fs.readFileSync(migrationPath, "utf8"))) await test.query(statement);

      const passwordHash = await bcrypt.hash(uatFixturePassword, 10);
      await test.query(
        "INSERT INTO users (full_name,email,password,role_id) VALUES (?,?,?,1)",
        ["Admin UAT Clone", "uat.admin@luzzshop.test", passwordHash],
      );
      await test.query(
        "INSERT INTO users (full_name,email,password,role_id) VALUES (?,?,?,2)",
        ["User UAT Clone", "uat.user@luzzshop.test", passwordHash],
      );

      const [targets] = await test.query(`
        SELECT p.product_id, p.product_name
          FROM products p
          JOIN categories c ON c.category_id=p.category_id AND c.slug='vot-pickleball'
          LEFT JOIN paddle_specs ps ON ps.product_id=p.product_id
         WHERE ps.product_id IS NULL AND p.status=1 AND p.price>0
           AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id=p.product_id AND pv.status=1 AND pv.stock>0)
         ORDER BY p.product_id LIMIT 4
      `);
      if (targets.length < 4) throw new Error("Need four unused in-stock paddles for browser UAT");
      const [triggers] = await test.query(
        "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? AND EVENT_OBJECT_TABLE IN ('paddle_specs','paddle_spec_sources')",
        [clone],
      );
      if (triggers.length !== 4) throw new Error(`Expected four migration 002 triggers, found ${triggers.length}`);
      process.stdout.write(`${JSON.stringify({
        mode, clone, tables: tables.length, productionCounts, triggers: triggers.length, targets,
        adminEmail: "uat.admin@luzzshop.test", userEmail: "uat.user@luzzshop.test",
      })}\n`);
    } catch (error) {
      await test.end();
      await admin.query(`DROP DATABASE IF EXISTS ${qid(clone)}`);
      throw error;
    }
    await test.end();
  } finally { await admin.end(); }
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ fatal: true, code: error.code, message: error.message })}\n`);
  process.exitCode = 1;
});
