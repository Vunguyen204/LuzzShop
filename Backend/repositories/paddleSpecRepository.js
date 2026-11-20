const { TECHNICAL_FIELDS, SCORE_FIELDS } = require("../config/paddleRubric");

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch (_error) { return fallback; }
};

const mapSpec = (row) => row ? {
  ...row,
  score_rationale: parseJson(row.score_rationale, null),
} : null;

const mapSource = (row) => ({
  ...row,
  supported_fields: parseJson(row.supported_fields, []),
  is_primary: Boolean(row.is_primary),
});

const listPaddles = async (executor) => {
  const [rows] = await executor.query(`
    SELECT p.product_id, p.product_name, p.slug, p.sku, p.price, p.status AS product_status,
           b.brand_name, b.slug AS brand_slug,
           CONCAT('/uploads/products/', b.slug, '/', p.image_url) AS image_url,
           COALESCE((SELECT SUM(CASE WHEN pv.status = 1 THEN pv.stock ELSE 0 END)
                       FROM product_variants pv WHERE pv.product_id = p.product_id), 0) AS total_stock,
           ps.paddle_spec_id, ps.verification_status, ps.data_completeness,
           ps.rubric_version, ps.updated_at,
           COUNT(DISTINCT pss.paddle_spec_source_id) AS source_count,
           COUNT(DISTINCT CASE WHEN pss.verification_status = 'VERIFIED' THEN pss.paddle_spec_source_id END) AS verified_source_count
      FROM products p
      JOIN categories c ON c.category_id = p.category_id AND c.slug = 'vot-pickleball'
 LEFT JOIN brands b ON b.brand_id = p.brand_id
 LEFT JOIN paddle_specs ps ON ps.product_id = p.product_id
 LEFT JOIN paddle_spec_sources pss ON pss.paddle_spec_id = ps.paddle_spec_id
  GROUP BY p.product_id, p.product_name, p.slug, p.sku, p.price, p.status,
           b.brand_name, b.slug, p.image_url, ps.paddle_spec_id,
           ps.verification_status, ps.data_completeness, ps.rubric_version, ps.updated_at
  ORDER BY p.product_id DESC
  `);
  return rows;
};

const getPaddleProduct = async (executor, productId, lock = false) => {
  const [rows] = await executor.query(`
    SELECT p.product_id, p.product_name, p.slug, p.sku, p.price, p.status AS product_status,
           p.category_id, c.category_name, c.slug AS category_slug,
           p.brand_id, b.brand_name, b.slug AS brand_slug,
           COALESCE((SELECT SUM(CASE WHEN pv.status = 1 THEN pv.stock ELSE 0 END)
                       FROM product_variants pv WHERE pv.product_id = p.product_id), 0) AS total_stock
      FROM products p
      JOIN categories c ON c.category_id = p.category_id
 LEFT JOIN brands b ON b.brand_id = p.brand_id
     WHERE p.product_id = ?
     LIMIT 1 ${lock ? "FOR UPDATE" : ""}
  `, [productId]);
  return rows[0] || null;
};

const getSpecByProductId = async (executor, productId, lock = false) => {
  const [rows] = await executor.query(`
    SELECT ps.*,
           creator.full_name AS created_by_name,
           updater.full_name AS updated_by_name,
           reviewer.full_name AS reviewed_by_name
      FROM paddle_specs ps
 LEFT JOIN users creator ON creator.user_id = ps.created_by_user_id
 LEFT JOIN users updater ON updater.user_id = ps.updated_by_user_id
 LEFT JOIN users reviewer ON reviewer.user_id = ps.reviewed_by_user_id
     WHERE ps.product_id = ?
     LIMIT 1 ${lock ? "FOR UPDATE" : ""}
  `, [productId]);
  return mapSpec(rows[0]);
};

const getSpecById = async (executor, specId, lock = false) => {
  const [rows] = await executor.query(`SELECT * FROM paddle_specs WHERE paddle_spec_id = ? LIMIT 1 ${lock ? "FOR UPDATE" : ""}`, [specId]);
  return mapSpec(rows[0]);
};

const listSources = async (executor, specId) => {
  const [rows] = await executor.query(`
    SELECT pss.*, creator.full_name AS created_by_name, verifier.full_name AS verified_by_name
      FROM paddle_spec_sources pss
 LEFT JOIN users creator ON creator.user_id = pss.created_by_user_id
 LEFT JOIN users verifier ON verifier.user_id = pss.verified_by_user_id
     WHERE pss.paddle_spec_id = ?
  ORDER BY pss.is_primary DESC, pss.paddle_spec_source_id DESC
  `, [specId]);
  return rows.map(mapSource);
};

const getSource = async (executor, specId, sourceId, lock = false) => {
  const [rows] = await executor.query(`
    SELECT * FROM paddle_spec_sources
     WHERE paddle_spec_id = ? AND paddle_spec_source_id = ?
     LIMIT 1 ${lock ? "FOR UPDATE" : ""}
  `, [specId, sourceId]);
  return rows[0] ? mapSource(rows[0]) : null;
};

const createSpec = async (executor, productId, userId) => {
  const [result] = await executor.query(
    "INSERT INTO paddle_specs (product_id, created_by_user_id, updated_by_user_id) VALUES (?, ?, ?)",
    [productId, userId, userId],
  );
  return result.insertId;
};

const updateFields = async (executor, productId, fields, userId) => {
  const entries = Object.entries(fields);
  if (!entries.length) return;
  const set = entries.map(([field]) => `${field} = ?`).join(", ");
  await executor.query(
    `UPDATE paddle_specs SET ${set}, updated_by_user_id = ? WHERE product_id = ?`,
    [...entries.map(([, value]) => fieldValue(value)), userId, productId],
  );
};

const fieldValue = (value) => typeof value === "object" && value !== null ? JSON.stringify(value) : value;

const resetRejectedForEditing = async (executor, productId, userId) => {
  await executor.query(`
    UPDATE paddle_specs
       SET verification_status = 'DRAFT', reviewed_by_user_id = NULL, reviewed_at = NULL,
           review_note = NULL, submitted_at = NULL, updated_by_user_id = ?
     WHERE product_id = ? AND verification_status = 'REJECTED'
  `, [userId, productId]);
};

const updateCompleteness = async (executor, productId, completeness, userId) => {
  await executor.query(
    "UPDATE paddle_specs SET data_completeness = ?, updated_by_user_id = ? WHERE product_id = ?",
    [completeness, userId, productId],
  );
};

const createSource = async (executor, specId, data, fingerprint, userId) => {
  const [result] = await executor.query(`
    INSERT INTO paddle_spec_sources
      (paddle_spec_id, source_type, source_title, source_locator, source_fingerprint,
       publisher, published_at, accessed_at, supported_fields, evidence_note, is_primary, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    specId, data.source_type, data.source_title, data.source_locator, fingerprint,
    data.publisher ?? null, data.published_at ?? null, data.accessed_at,
    JSON.stringify(data.supported_fields), data.evidence_note ?? null, data.is_primary ?? 0, userId,
  ]);
  return result.insertId;
};

const updateSource = async (executor, specId, sourceId, fields, fingerprint) => {
  const entries = Object.entries(fields);
  if (fingerprint) entries.push(["source_fingerprint", fingerprint]);
  if (!entries.length) return;
  const set = entries.map(([field]) => `${field} = ?`).join(", ");
  await executor.query(
    `UPDATE paddle_spec_sources SET ${set} WHERE paddle_spec_id = ? AND paddle_spec_source_id = ?`,
    [...entries.map(([field, value]) => field === "supported_fields" ? JSON.stringify(value) : value), specId, sourceId],
  );
};

const deleteSource = async (executor, specId, sourceId) => {
  const [result] = await executor.query(
    "DELETE FROM paddle_spec_sources WHERE paddle_spec_id = ? AND paddle_spec_source_id = ?",
    [specId, sourceId],
  );
  return result.affectedRows;
};

const reviewSource = async (executor, specId, sourceId, decision, userId, rejectionReason) => {
  await executor.query(`
    UPDATE paddle_spec_sources
       SET verification_status = ?, verified_by_user_id = ?, verified_at = NOW(), rejection_reason = ?
     WHERE paddle_spec_id = ? AND paddle_spec_source_id = ?
  `, [decision, userId, decision === "REJECTED" ? rejectionReason : null, specId, sourceId]);
};

const submitSpec = async (executor, productId, userId) => {
  await executor.query(`
    UPDATE paddle_specs
       SET verification_status = 'IN_REVIEW', submitted_at = NOW(),
           reviewed_by_user_id = NULL, reviewed_at = NULL, review_note = NULL,
           updated_by_user_id = ?
     WHERE product_id = ?
  `, [userId, productId]);
};

const setReviewMetadata = async (executor, productId, userId, reviewNote) => {
  await executor.query(`
    UPDATE paddle_specs SET reviewed_by_user_id = ?, reviewed_at = NOW(), review_note = ?, updated_by_user_id = ?
     WHERE product_id = ?
  `, [userId, reviewNote, userId, productId]);
};

const finalizeReview = async (executor, productId, decision, userId, reviewNote, completeness) => {
  await executor.query(`
    UPDATE paddle_specs
       SET verification_status = ?, reviewed_by_user_id = ?, reviewed_at = NOW(),
           review_note = ?, data_completeness = ?, updated_by_user_id = ?
     WHERE product_id = ?
  `, [decision, userId, reviewNote, completeness, userId, productId]);
};

const confirmTechnical = async (executor, productId, userId, reviewNote, completeness) => {
  await executor.query(`
    UPDATE paddle_specs
       SET verification_status = 'VERIFIED', submitted_at = COALESCE(submitted_at, NOW()),
           reviewed_by_user_id = ?, reviewed_at = NOW(), review_note = ?,
           data_completeness = ?, updated_by_user_id = ?
     WHERE product_id = ?
  `, [userId, reviewNote, completeness, userId, productId]);
};

const populatedGovernedFields = (spec) => [...TECHNICAL_FIELDS, ...SCORE_FIELDS].filter((field) => spec[field] !== null && spec[field] !== undefined);

module.exports = {
  listPaddles,
  getPaddleProduct,
  getSpecByProductId,
  getSpecById,
  listSources,
  getSource,
  createSpec,
  updateFields,
  resetRejectedForEditing,
  updateCompleteness,
  createSource,
  updateSource,
  deleteSource,
  reviewSource,
  submitSpec,
  setReviewMetadata,
  finalizeReview,
  confirmTechnical,
  populatedGovernedFields,
};

