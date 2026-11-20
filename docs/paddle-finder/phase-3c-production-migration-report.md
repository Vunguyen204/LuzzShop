# LuzzShop Paddle Finder — Phase 3C Production Migration Report

Date: 2026-11-18 (Asia/Saigon)  
Result: **SUCCESS**  
Target database: `luzzshop` on MariaDB 11.5.2

## Authorization and safety gates

Production execution began only after the user supplied the exact approval sentence. The runner then revalidated:

- `DB_NAME` was exactly `luzzshop`.
- Server identity was MariaDB 11.5.2 on host `vunguyen`, port 3306.
- Exactly 15 original tables existed.
- Neither Paddle table existed.
- None of the four planned trigger names existed.
- The verified backup still existed and its SHA-256 remained `EAA71EC96F0FB6F4788F0AE01B6F28353E927179B308D775EF81FF3C73D6ADC5`.
- Parsed migration allowlist contained only two `CREATE TABLE` and four `CREATE TRIGGER` statements.

No DOWN migration, seed, DROP or ALTER of an original table was permitted by the runner.

## Statements applied

All 6/6 statements completed successfully, in order:

1. `CREATE TABLE paddle_specs`
2. `CREATE TABLE paddle_spec_sources`
3. `CREATE TRIGGER trg_paddle_specs_invalidate_before_update`
4. `CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_insert`
5. `CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_update`
6. `CREATE TRIGGER trg_paddle_spec_sources_invalidate_after_delete`

MariaDB DDL implicitly commits. No partial failure occurred.

## Post-migration verification

### Tables

- Total database tables: 17.
- `paddle_specs`: InnoDB, `utf8mb4_uca1400_ai_ci`, zero rows.
- `paddle_spec_sources`: InnoDB, `utf8mb4_uca1400_ai_ci`, zero rows.

### Relationships

- `paddle_specs.product_id → products.product_id`: UPDATE RESTRICT, DELETE RESTRICT.
- Creator/updater references: DELETE SET NULL.
- Reviewer/verifier references: DELETE RESTRICT.
- `paddle_spec_sources.paddle_spec_id → paddle_specs.paddle_spec_id`: DELETE CASCADE.

### Constraints and indexes

- One-to-one unique index `uq_paddle_specs_product` exists.
- Unique evidence index `(paddle_spec_id, source_fingerprint)` exists.
- All named field-domain, JSON, score, completeness and workflow CHECK constraints exist.
- MariaDB also exposes its automatic JSON validity CHECKs under the JSON column names; this is expected.
- Workflow, review, update-time, source-status/type and FK-supporting indexes exist.

### Triggers

The production migration connection confirmed all four triggers with the intended events:

- Paddle spec: BEFORE UPDATE.
- Source: AFTER INSERT.
- Source: AFTER UPDATE.
- Source: AFTER DELETE.

A secondary read-only connector could not enumerate trigger metadata due to its restricted account permissions, but independently confirmed the two tables and FK policies. The migration account's postflight result is authoritative for trigger installation.

## Original table integrity

Exact row counts before and after migration were identical:

| Table | Before | After |
|---|---:|---:|
| brands | 7 | 7 |
| carts | 0 | 0 |
| cart_items | 0 | 0 |
| categories | 6 | 6 |
| menus | 6 | 6 |
| news | 0 | 0 |
| orders | 10 | 10 |
| order_details | 13 | 13 |
| payments | 0 | 0 |
| products | 22 | 22 |
| product_images | 0 | 0 |
| product_variants | 84 | 84 |
| roles | 2 | 2 |
| users | 4 | 4 |
| wishlists | 0 | 0 |

No product, variant, inventory, cart, checkout or order data was changed.

## Final state and next steps

- Schema migration is complete.
- Both new tables are intentionally empty.
- No fake paddle specifications were seeded.
- Backend and Frontend runtime code remains unchanged.
- No commit or push was performed.
- DOWN was not run and should not be used on production without exporting new Paddle data and receiving separate destructive-action approval.

Recommended next phase:

1. Implement the Paddle Specs repository/service/validator and Admin-only API.
2. Mirror database invalidation behavior in service transactions.
3. Implement completeness v1.0 calculation and Finder-ready validation.
4. Build the Admin data-entry/review UI.
5. Collect and verify real sources for the 17 paddles before entering facts or rubric scores.

