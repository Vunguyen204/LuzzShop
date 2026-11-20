# LuzzShop Paddle Finder — Phase 2 Data Design

Status: design draft; no migration has been executed.

## 1. Verified database baseline

Read-only inspection on 2026-11-18 established that the configured database is `luzzshop` on **MariaDB 11.5.2**, not Oracle MySQL. It uses InnoDB, `utf8mb4`, `utf8mb4_uca1400_ai_ci`, row format `Dynamic`, and `STRICT_TRANS_TABLES`.

The existing `products.product_id` and `users.user_id` are signed `INT`. New foreign-key columns that reference them therefore remain signed `INT`. New surrogate keys use `BIGINT UNSIGNED`. Existing tables are not altered.

MariaDB DDL implicitly commits. The up migration is fail-fast and the down file is a compensating destructive script, not an atomic transaction rollback. Execute only after preflight checks, backup, and a successful rehearsal on a cloned schema.

## 2. Boundaries and data classes

### 2.1 Verified technical facts

These are values attributable to an approved source. Numeric units are canonical in column names: grams and millimetres. Text is stored as a normalized manufacturer term where possible.

- Weight is a range because published paddle weights commonly have tolerance. A single value is represented by equal min/max.
- `swing_weight` and `twist_weight` are unitless/index-style fields because source methodologies can differ; the source and evidence note must identify the methodology.
- `balance_point_mm` is measured from the handle butt. The application must label this convention.
- Materials and construction remain nullable text rather than enums because manufacturer terminology changes.
- Shape uses a controlled vocabulary: `STANDARD`, `ELONGATED`, `WIDEBODY`, `HYBRID`, `OTHER`.
- Missing values remain `NULL`; zero never means unknown.

### 2.2 Editorial characteristic scores

The six 0–100 scores are not physical measurements. They are reviewer assessments derived from verified facts and claims under a named rubric version. Every completed scoring set requires `rubric_version` and a structured `score_rationale` object with one entry per scored axis. A recommended shape is:

```json
{
  "power": {"band": "HIGH", "reason": "...", "sourceIds": [1]},
  "control": {"band": "MEDIUM_HIGH", "reason": "...", "sourceIds": [1, 2]}
}
```

The API must validate keys and source IDs later; SQL only validates JSON syntax. AI does not assign or modify these scores.

### 2.3 Verification metadata

Specification workflow: `DRAFT → IN_REVIEW → VERIFIED` or `REJECTED`.

Source workflow: `PENDING → VERIFIED` or `REJECTED`.

`VERIFIED` means a reviewer accepted the entered claims and their evidence. It does not automatically mean Finder-ready. Finder eligibility is a query/application rule requiring: product active, available stock, spec verified, all six rubric scores present, rubric version present, six rationale entries, at least one verified source, and completeness at or above the approved threshold.

Verified-state invalidation is enforced defensively in two layers. The database migration installs triggers that move a verified spec back to `IN_REVIEW`, clear reviewer approval and reset cached completeness to zero whenever governed facts, scores or evidence sources change. The future service must perform the same transition and recompute completeness transactionally so users receive an immediate, explicit explanation. Product status and live stock are evaluated dynamically and do not mutate verification status.

## 3. Table design

### 3.1 `paddle_specs`

`UNIQUE(product_id)` enforces the one-to-one relation. `ON DELETE RESTRICT` prevents accidental deletion of a product that owns governed specifications. Creator/updater references use `ON DELETE SET NULL`. Reviewer/verifier references use `ON DELETE RESTRICT`: MariaDB 11.5 does not allow a CHECK constraint to depend on a column whose foreign key uses `ON DELETE SET NULL`, and retaining the reviewer identity is necessary for a verified record. An admin must reassign or return governed records to draft before deleting such a user.

Physical fields and editorial scores are nullable to support progressive data collection. Workflow, completeness and timestamps are non-null. CHECK constraints protect value domains and state transitions that can be expressed safely in SQL.

No speculative min/max upper bounds are imposed on physical measurements. Positive-value and relational checks catch invalid input without rejecting a future legitimate format. Business plausibility ranges belong in the later validation layer and can be versioned without a schema migration.

Indexes are deliberately small:

- Unique product lookup already supplies the primary join path.
- `(verification_status, data_completeness)` supports admin queues and Finder eligibility scans.
- Reviewer and update-time indexes support governance screens.
- Individual score indexes are omitted because the catalog is small and recommendation scoring will evaluate an already filtered set.

### 3.2 `paddle_spec_sources`

One spec has many evidence sources. `supported_fields` is a JSON array of exact `paddle_specs` field names supported by that source, for example:

```json
["static_weight_min_g", "static_weight_max_g", "core_thickness_mm", "face_material"]
```

`source_locator` is the URL, document identifier, or internal review reference. `source_fingerprint` is a 32-byte SHA-256 digest of `source_type + ':' + normalized source_locator`, calculated by the future service. Unique `(paddle_spec_id, source_fingerprint)` prevents duplicate evidence without indexing a 1000-character URL.

Only short paraphrased evidence should be stored in `evidence_note`; do not copy large copyrighted passages. A source can be deleted only by deleting it explicitly or by deleting its new parent spec; deleting a product remains restricted.

## 4. Rubric v1.0

### 4.1 Common scoring procedure

Each axis is assigned one of five anchored bands, then a reviewer may select an integer inside the band. Do not imply measurement precision beyond the evidence.

| Band | Range | Meaning |
|---|---:|---|
| Very low | 0–20 | Strongly deprioritized characteristic |
| Low | 21–40 | Below balanced baseline |
| Medium | 41–60 | Balanced or evidence is neutral |
| High | 61–80 | Clearly emphasized |
| Very high | 81–100 | Dominant design characteristic with strong evidence |

Rules:

1. Score only from verified sources and verified technical facts.
2. Product-name tokens such as `16mm` are not evidence by themselves.
3. Manufacturer marketing claims may support a band but not an exact score without reviewer rationale.
4. Relative catalog comparison may inform a score only after units/methods are comparable.
5. Conflicting sources block verification until resolved or explicitly documented.
6. Reviewer records a short rationale and source IDs for each axis.
7. Score `NULL`, not 50, when evidence is insufficient.

### 4.2 Power

Meaning: potential to generate pace from the paddle's design, not player strength.

Evidence priority: comparable swing weight/static weight and balance; construction/core response; verified manufacturer positioning; controlled test evidence.

- 0–20: explicitly soft/low-output design with corroborating evidence.
- 21–40: control-first design with limited rebound or mass contribution.
- 41–60: balanced output; no clear power or control dominance.
- 61–80: power-oriented construction, mass distribution, or verified performance evidence.
- 81–100: consistently power-dominant across multiple strong indicators.

### 4.3 Control

Meaning: predictability and placement precision, especially on touch shots.

Evidence priority: verified soft-response/control positioning; core thickness and construction when their effect is supported; controlled tests; reviewer evidence.

- 0–20: highly reactive with poor predictability evidence.
- 21–40: power-first with limited touch evidence.
- 41–60: balanced precision.
- 61–80: clearly control/touch oriented.
- 81–100: exceptional, consistently corroborated placement and touch emphasis.

### 4.4 Spin

Meaning: design support for imparting ball rotation.

Evidence priority: standardized spin test where available; verified surface texture/material and manufacturer claim; controlled reviewer evidence.

- 0–20: smooth/low-spin evidence.
- 21–40: below-average spin support.
- 41–60: ordinary/balanced spin support.
- 61–80: texture/material or tests show high spin potential.
- 81–100: leading, repeatably measured spin evidence.

### 4.5 Forgiveness

Meaning: retention of useful response away from the geometric center; not injury prevention.

Evidence priority: twist weight measured comparably; verified sweet-spot/stability tests; shape and width as supporting, not decisive, evidence.

- 0–20: small effective area/low off-center stability.
- 21–40: demanding outside the center.
- 41–60: balanced effective area and stability.
- 61–80: broad effective area or strong off-center stability.
- 81–100: exceptional stability supported by measurements/tests.

### 4.6 Maneuverability

Meaning: ease and speed of repositioning the paddle.

Evidence priority: comparable swing weight, static weight, balance and length; controlled handling tests.

- 0–20: very slow/heavy to reposition.
- 21–40: below-average hand speed.
- 41–60: balanced handling.
- 61–80: quick and easy to reposition.
- 81–100: exceptionally fast handling with strong measurement support.

Power and maneuverability are assessed independently; neither is calculated as the inverse of the other.

### 4.7 Comfort

Meaning: subjective impact feel, vibration perception and ease of prolonged handling. It is not a health claim and must never promise injury prevention.

Evidence priority: controlled vibration/feel evidence; verified construction and damping claims; weight/balance as supporting context; multiple reviewer observations when formal tests are absent.

- 0–20: harsh feel or high vibration consistently reported under controlled evidence.
- 21–40: firm/demanding feel.
- 41–60: neutral/balanced feel.
- 61–80: damped/comfortable feel supported by evidence.
- 81–100: exceptionally damped/easy feel with multiple corroborating sources.

## 5. Data completeness v1.0

Completeness measures documented coverage, not product quality. Optional or rarely published fields do not all have equal weight.

### 5.1 Weighted groups

| Group | Weight | Completion rule |
|---|---:|---|
| Identity linkage | 5 | Product exists and belongs to paddle category |
| Weight range | 10 | Both min/max verified, or equal values for a verified single value |
| Core | 10 | Thickness and core material verified: 5 each |
| Face/construction | 10 | Face material and construction verified: 5 each |
| Dimensions/shape | 10 | Any 2 of length, width, handle length, grip circumference, shape; proportional up to 10 |
| Advanced handling metrics | 5 | Any of balance point, swing weight, twist weight; proportional up to 5 |
| Six rubric scores | 30 | 5 per non-null score with rationale and verified source reference |
| Provenance quality | 15 | At least one verified source: 8; primary/authoritative source: +4; all populated fields covered by a verified source: +3 |
| Review metadata | 5 | Rubric version, reviewer and reviewed timestamp present |

Total is 100. Missing advanced metrics can cost at most 5 points, so they do not make an otherwise well-supported product unusable.

The future service is the source of truth for calculating completeness. `data_completeness` is a persisted, queryable cache rounded to two decimals. It must be recalculated whenever a fact, score, rationale, or source status changes. No SQL trigger is proposed because application-owned versioning and tests are easier to audit.

Initial Finder-ready threshold recommendation: **75.00**, plus all six scores and the verification rules. Threshold must be approved after the 17-product dry run.

## 6. Collection and review workflow for the 17 paddles

1. Export a read-only inventory containing product ID, SKU, name, brand and slug.
2. Create one blank `DRAFT` spec per confirmed paddle product; do not parse names into facts.
3. Research sources in priority order: manufacturer, manufacturer technical sheet, authorized distributor, certified document, documented internal review.
4. Add each source separately with normalized locator, fingerprint, access date and supported fields.
5. Enter only values explicitly supported by pending sources, preserving source units in evidence notes and converting to canonical units in columns.
6. Run automatic validation: units, ranges, cross-field relations, duplicate source and JSON structure.
7. A second person verifies sources independently. The data entry author must not approve their own record in the process policy, even though SQL cannot enforce role separation.
8. Reviewer resolves conflicts, marks sources verified/rejected, and returns incomplete records to draft when necessary.
9. Reviewer applies rubric v1.0 axis by axis, adds rationale and source IDs, then submits the spec for review.
10. The service recalculates completeness and evaluates Finder eligibility.
11. Only an authorized reviewer sets `VERIFIED`; records below eligibility remain sellable but excluded from Finder.
12. Changes to a verified fact or score return the record to `IN_REVIEW`; the prior values should be captured in application audit logs in a later phase.

Suggested operational roles:

- Data editor: creates drafts and sources.
- Reviewer: validates evidence and rubric.
- Admin: resolves disputes and publishes.

For the thesis MVP, these may map to the existing Admin role while the UI still records separate creator/reviewer identities.

## 7. Admin Paddle Specs design

The design follows the current Admin list/form style without changing existing product or variant screens.

### 7.1 List page `/admin/paddle-specs`

Columns: product image, SKU/name, brand, fact coverage, score coverage, completeness, source count, verification status, last reviewer, updated time, actions.

Filters: keyword, brand, status, completeness band, missing score, source issues. Summary cards: 17 total paddles, no spec, draft, in review, verified, Finder-ready.

Actions: Create draft, Edit, View evidence, Submit review, Review. No bulk verify in MVP.

### 7.2 Detail editor `/admin/paddle-specs/:productId`

Tabs/sections:

1. Product context: read-only product data, price and stock summary.
2. Technical facts: value, canonical unit, source badges and validation status.
3. Sources: type, title, locator, supported fields, access date, status and reviewer.
4. Rubric: six sliders/number inputs, band label, required rationale and selected source references.
5. Quality: completeness breakdown, missing coverage and conflicts.
6. Review: diff summary, review note, return/reject/verify controls.

Safety and usability:

- Empty input saves `NULL`, never zero.
- Scores use integer inputs constrained to 0–100 and show rubric anchors alongside.
- A source must be saved before it can be referenced in a rationale.
- Verification button remains disabled until server-side eligibility checks pass.
- URLs open in a new safe tab; UI displays domain and access date.
- Product, variant, price, stock, cart and order fields are read-only on this page.
- Every write will later require backend Admin authorization and server validation.

## 8. Migration and test plan

### 8.1 Preflight

- Confirm version, database name, engine, charset, collation and SQL mode match the recorded baseline.
- Confirm neither new table exists.
- Confirm `products.product_id` and `users.user_id` types still match the FK columns.
- Capture verified schema-only and full backups; test restore.
- Clone production-like data into a disposable database.

### 8.2 Migration tests on the disposable database

- Up script creates exactly two tables and leaves all existing table definitions unchanged.
- `UNIQUE(product_id)` rejects a second spec for one product.
- FK rejects unknown product/user IDs.
- Product deletion is restricted when a spec exists.
- Deleting a source or its parent draft behaves as designed; source cascade is limited to the new tables.
- CHECK tests reject scores below 0/above 100, invalid status/shape, negative dimensions, reversed weight range, handle longer than paddle and malformed JSON.
- Valid sparse draft with all technical fields `NULL` succeeds.
- `VERIFIED` without reviewer/time fails.
- Duplicate source fingerprint for one spec fails; same source for another spec succeeds.
- Deleting a creator/updater nulls the optional audit reference; deleting an active reviewer/verifier is restricted until governed records are reassigned or unverified.
- UTF-8 Vietnamese titles and evidence round-trip correctly.
- Query plans use unique product lookup and workflow indexes.

### 8.3 Synthetic fixtures

Use only synthetic records tied to disposable synthetic products:

- A minimal all-null draft.
- A complete verified record with six scores/rationales and two verified sources.
- A partial record without advanced metrics that demonstrates weighted completeness.
- Boundary scores 0 and 100.
- Conflicting/pending source case.
- Invalid cases for every CHECK/FK/UNIQUE constraint.

No factual fixture values should be associated with the 17 real paddles until collection and review are completed.

### 8.4 Rollback rehearsal

- Export the two new tables before rollback.
- Run down script on the disposable database.
- Confirm both new tables are gone and all original tables/data/counts are unchanged.
- Restore the export to a fresh clone to prove recoverability.

## 9. Planned implementation files (not created in Phase 2)

Expected later additions:

```text
Backend/routes/paddleSpecRoutes.js
Backend/controllers/paddleSpecController.js
Backend/services/paddleSpecService.js
Backend/repositories/paddleSpecRepository.js
Backend/validators/paddleSpecValidator.js
Backend/config/paddleRubric.js
Backend/test/paddleSpec.integration.test.js
Frontend/src/pages/adminPaddleSpecsPage/index.jsx
Frontend/src/pages/adminPaddleSpecsPage/style.scss
Frontend/src/pages/adminPaddleSpecDetailPage/index.jsx
Frontend/src/pages/adminPaddleSpecDetailPage/style.scss
Frontend/src/api/paddleSpecApi.js
```

Expected later modifications: backend route registration, frontend admin routes, and admin navigation only. Existing product, variant, cart, checkout, order and inventory logic must remain unchanged.

## 10. Decisions requiring approval

1. Approve `ON DELETE RESTRICT` from specs to products and `CASCADE` only from specs to their sources.
2. Approve canonical metric units and the balance-point-from-butt convention.
3. Approve free-text materials/construction plus controlled shape vocabulary.
4. Approve SHA-256 source fingerprint generation in the future backend.
5. Approve rubric v1.0 bands and whether integer-within-band scoring is sufficiently reproducible.
6. Approve completeness group weights and initial Finder-ready threshold 75.
7. Decide whether one Admin may enter and verify the same record or whether UI must enforce two-person review.
8. Decide whether verified-record edits require a separate audit-history table in MVP.
9. Decide whether `INTERNAL_REVIEW` evidence is allowed to make a record Finder-ready without a manufacturer/authorized source.
10. Approve the proposed Admin routes and tab structure.

