const crypto = require("node:crypto");
const db = require("../config/db");
const repository = require("../repositories/paddleSpecRepository");
const {
  RUBRIC_VERSION,
  TECHNICAL_FIELDS,
  SCORE_FIELDS,
} = require("../config/paddleRubric");
const {
  ValidationError,
  validateTechnical,
  validateScores,
  validateV11RubricSet,
  validateSource,
} = require("../validators/paddleSpecValidator");
const { calculateQuality } = require("./paddleQualityService");

class ServiceError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.details = details;
  }
}

const promiseDb = db.promise();
const technicalFieldSet = new Set(TECHNICAL_FIELDS);
const sourceSupportsTechnical = (source) => (source.supported_fields || []).some((field) => technicalFieldSet.has(field));

const transaction = async (work) => {
  const connection = await promiseDb.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const assertPaddle = (product) => {
  if (!product) throw new ServiceError(404, "Không tìm thấy sản phẩm");
  if (product.category_slug !== "vot-pickleball") {
    throw new ServiceError(400, "Chỉ có thể quản lý thông số cho sản phẩm thuộc danh mục vợt Pickleball");
  }
};

const assertSpec = (spec) => {
  if (!spec) throw new ServiceError(404, "Sản phẩm chưa có Paddle Specs");
};

const normalizedFingerprint = (type, locator) => crypto
  .createHash("sha256")
  .update(`${type}:${locator.trim().toLowerCase()}`, "utf8")
  .digest();

const refreshCompleteness = async (executor, product, spec, sources, userId) => {
  const quality = calculateQuality(product, spec, sources);
  await repository.updateCompleteness(executor, product.product_id, quality.completeness, userId);
  return quality;
};

const getDetailWithExecutor = async (executor, productId) => {
  const product = await repository.getPaddleProduct(executor, productId);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(executor, productId);
  const sources = spec ? await repository.listSources(executor, spec.paddle_spec_id) : [];
  return { product, spec, sources, quality: calculateQuality(product, spec, sources) };
};

const list = async () => {
  const rows = await repository.listPaddles(promiseDb);
  return Promise.all(rows.map(async (row) => {
    if (!row.paddle_spec_id) return { ...row, quality: calculateQuality(row, null, []) };
    const spec = await repository.getSpecById(promiseDb, row.paddle_spec_id);
    const sources = await repository.listSources(promiseDb, row.paddle_spec_id);
    return { ...row, quality: calculateQuality(row, spec, sources) };
  }));
};

const getDetail = (productId) => getDetailWithExecutor(promiseDb, productId);

const create = (productId, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const existing = await repository.getSpecByProductId(connection, productId, true);
  if (existing) throw new ServiceError(409, "Sản phẩm đã có Paddle Specs");
  await repository.createSpec(connection, productId, userId);
  return getDetailWithExecutor(connection, productId);
});

const updateTechnical = (productId, body, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  const requested = validateTechnical(body);
  const merged = Object.fromEntries(TECHNICAL_FIELDS.map((field) => [field, Object.prototype.hasOwnProperty.call(requested, field) ? requested[field] : spec[field]]));
  validateTechnical(merged);
  await repository.resetRejectedForEditing(connection, productId, userId);
  await repository.updateFields(connection, productId, requested, userId);
  const actual = await repository.getSpecByProductId(connection, productId, true);
  const sources = await repository.listSources(connection, actual.paddle_spec_id);
  await refreshCompleteness(connection, product, actual, sources, userId);
  return getDetailWithExecutor(connection, productId);
});

const updateScores = (productId, body, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  const fields = validateScores(body);
  const merged = {
    ...spec,
    ...Object.fromEntries(SCORE_FIELDS.map((field) => [field,
      Object.prototype.hasOwnProperty.call(fields, field) ? fields[field] : spec[field]])),
    rubric_version: Object.prototype.hasOwnProperty.call(fields, "rubric_version") ? fields.rubric_version : spec.rubric_version,
    score_rationale: Object.prototype.hasOwnProperty.call(fields, "score_rationale") ? fields.score_rationale : spec.score_rationale,
  };
  if (merged.rubric_version !== RUBRIC_VERSION) {
    throw new ServiceError(
      400,
      "Khi tạo hoặc chỉnh sửa điểm Radar, toàn bộ bộ điểm phải dùng rubric v1.1",
      ["radar.rubric_v1_1_required"],
    );
  }
  validateV11RubricSet(merged);
  await repository.updateFields(connection, productId, fields, userId);
  const actual = await repository.getSpecByProductId(connection, productId, true);
  const sources = await repository.listSources(connection, actual.paddle_spec_id);
  await refreshCompleteness(connection, product, actual, sources, userId);
  return getDetailWithExecutor(connection, productId);
});

const addSource = (productId, body, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  const data = validateSource(body);
  const fingerprint = normalizedFingerprint(data.source_type, data.source_locator);
  if (sourceSupportsTechnical(data)) await repository.resetRejectedForEditing(connection, productId, userId);
  const sourceId = await repository.createSource(connection, spec.paddle_spec_id, data, fingerprint, userId);
  const actual = await repository.getSpecByProductId(connection, productId, true);
  const sources = await repository.listSources(connection, actual.paddle_spec_id);
  await refreshCompleteness(connection, product, actual, sources, userId);
  return { source_id: sourceId, ...(await getDetailWithExecutor(connection, productId)) };
});

const updateSource = (productId, sourceId, body, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  const existing = await repository.getSource(connection, spec.paddle_spec_id, sourceId, true);
  if (!existing) throw new ServiceError(404, "Không tìm thấy nguồn dữ liệu");
  const partial = validateSource(body, true);
  const merged = validateSource({
    source_type: partial.source_type ?? existing.source_type,
    source_title: partial.source_title ?? existing.source_title,
    source_locator: partial.source_locator ?? existing.source_locator,
    publisher: Object.prototype.hasOwnProperty.call(partial, "publisher") ? partial.publisher : existing.publisher,
    published_at: Object.prototype.hasOwnProperty.call(partial, "published_at") ? partial.published_at : existing.published_at,
    accessed_at: partial.accessed_at ?? existing.accessed_at,
    supported_fields: partial.supported_fields ?? existing.supported_fields,
    evidence_note: Object.prototype.hasOwnProperty.call(partial, "evidence_note") ? partial.evidence_note : existing.evidence_note,
    is_primary: Object.prototype.hasOwnProperty.call(partial, "is_primary") ? partial.is_primary : Number(existing.is_primary),
  });
  const changedIdentity = merged.source_type !== existing.source_type || merged.source_locator !== existing.source_locator;
  if (sourceSupportsTechnical(existing) || sourceSupportsTechnical(merged)) {
    await repository.resetRejectedForEditing(connection, productId, userId);
  }
  await repository.updateSource(connection, spec.paddle_spec_id, sourceId, partial,
    changedIdentity ? normalizedFingerprint(merged.source_type, merged.source_locator) : null);
  const actual = await repository.getSpecByProductId(connection, productId, true);
  const sources = await repository.listSources(connection, actual.paddle_spec_id);
  await refreshCompleteness(connection, product, actual, sources, userId);
  return getDetailWithExecutor(connection, productId);
});

const removeSource = (productId, sourceId, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  const existing = await repository.getSource(connection, spec.paddle_spec_id, sourceId, true);
  if (!existing) throw new ServiceError(404, "Không tìm thấy nguồn dữ liệu");
  if (sourceSupportsTechnical(existing)) await repository.resetRejectedForEditing(connection, productId, userId);
  await repository.deleteSource(connection, spec.paddle_spec_id, sourceId);
  const actual = await repository.getSpecByProductId(connection, productId, true);
  const sources = await repository.listSources(connection, actual.paddle_spec_id);
  await refreshCompleteness(connection, product, actual, sources, userId);
  return getDetailWithExecutor(connection, productId);
});

const getSourceDetail = async (productId, sourceId) => {
  const detail = await getDetailWithExecutor(promiseDb, productId);
  assertSpec(detail.spec);
  const source = await repository.getSource(promiseDb, detail.spec.paddle_spec_id, sourceId);
  if (!source) throw new ServiceError(404, "Không tìm thấy nguồn dữ liệu");
  return source;
};

const reviewSource = (productId, sourceId, decision, reviewNote, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  const source = await repository.getSource(connection, spec.paddle_spec_id, sourceId, true);
  if (!source) throw new ServiceError(404, "Không tìm thấy nguồn dữ liệu");
  if (decision === "VERIFIED" && source.source_type === "INTERNAL_REVIEW" && !source.evidence_note) {
    throw new ServiceError(400, "INTERNAL_REVIEW cần evidence_note mô tả bằng chứng và phương pháp");
  }
  if (sourceSupportsTechnical(source)) await repository.resetRejectedForEditing(connection, productId, userId);
  await repository.reviewSource(connection, spec.paddle_spec_id, sourceId, decision, userId, reviewNote);
  const actual = await repository.getSpecByProductId(connection, productId, true);
  const sources = await repository.listSources(connection, actual.paddle_spec_id);
  await refreshCompleteness(connection, product, actual, sources, userId);
  return getDetailWithExecutor(connection, productId);
});

const submit = (productId, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  if (!["DRAFT", "REJECTED"].includes(spec.verification_status)) {
    throw new ServiceError(409, "Chỉ DRAFT hoặc REJECTED mới có thể gửi duyệt");
  }
  await repository.submitSpec(connection, productId, userId);
  return getDetailWithExecutor(connection, productId);
});

const confirmTechnicalWithConnection = async (connection, product, spec, reviewNote, userId) => {
  const sources = await repository.listSources(connection, spec.paddle_spec_id);
  const candidate = {
    ...spec,
    verification_status: "VERIFIED",
    reviewed_by_user_id: userId,
    reviewed_at: new Date(),
  };
  const quality = calculateQuality(product, candidate, sources);
  const blocking = quality.technical_evidence.blockers;
  if (blocking.length) {
    throw new ServiceError(400, "Chưa đủ điều kiện xác nhận thông số kỹ thuật", blocking);
  }
  await repository.confirmTechnical(connection, product.product_id, userId, reviewNote, quality.technical_completeness);
  return getDetailWithExecutor(connection, product.product_id);
};

const confirm = (productId, reviewNote, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  return confirmTechnicalWithConnection(connection, product, spec, reviewNote, userId);
});

const review = (productId, decision, reviewNote, userId) => transaction(async (connection) => {
  const product = await repository.getPaddleProduct(connection, productId, true);
  assertPaddle(product);
  const spec = await repository.getSpecByProductId(connection, productId, true);
  assertSpec(spec);
  if (spec.verification_status !== "IN_REVIEW") throw new ServiceError(409, "Chỉ thông số IN_REVIEW mới có thể duyệt");
  if (decision === "REJECTED") {
    const sources = await repository.listSources(connection, spec.paddle_spec_id);
    const quality = calculateQuality(product, { ...spec, reviewed_by_user_id: userId, reviewed_at: new Date() }, sources);
    await repository.finalizeReview(connection, productId, decision, userId, reviewNote, quality.completeness);
    return getDetailWithExecutor(connection, productId);
  }
  return confirmTechnicalWithConnection(connection, product, spec, reviewNote, userId);
});

module.exports = {
  ServiceError,
  ValidationError,
  calculateQuality,
  list,
  getDetail,
  create,
  updateTechnical,
  updateScores,
  addSource,
  updateSource,
  removeSource,
  getSourceDetail,
  reviewSource,
  submit,
  confirm,
  review,
};

