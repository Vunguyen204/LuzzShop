const {
  RUBRIC_VERSION,
  SUPPORTED_RUBRIC_VERSIONS,
  RADAR_SCORE_POINTS,
  RADAR_BANDS,
  RADAR_CONFIDENCE,
  RADAR_METHODS,
  SCORE_AXES,
  SCORE_FIELDS,
  TECHNICAL_FIELDS,
  SOURCE_SUPPORTED_FIELDS,
  PADDLE_SHAPES,
  SOURCE_TYPES,
} = require("../config/paddleRubric");

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
    this.details = details;
  }
}

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const rejectUnknown = (body, allowed) => {
  if (!isPlainObject(body)) throw new ValidationError("Dữ liệu gửi lên phải là một object JSON");
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new ValidationError("Có trường dữ liệu không được hỗ trợ", unknown);
};

const nullablePositiveNumber = (value, field) => {
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new ValidationError(`${field} phải là số lớn hơn 0`);
  return number;
};

const nullableNonNegativeNumber = (value, field) => {
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new ValidationError(`${field} phải là số không âm`);
  return number;
};

const nullableText = (value, field, maxLength) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new ValidationError(`${field} phải là chuỗi`);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new ValidationError(`${field} không được vượt quá ${maxLength} ký tự`);
  return normalized;
};

const parsePositiveId = (value, name = "id") => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError(`${name} không hợp lệ`);
  return id;
};

const validateTechnical = (body) => {
  rejectUnknown(body, TECHNICAL_FIELDS);
  if (!Object.keys(body).length) throw new ValidationError("Cần cung cấp ít nhất một thông số kỹ thuật");
  const result = {};
  const positive = new Set([
    "static_weight_min_g", "static_weight_max_g", "core_thickness_mm", "paddle_length_mm",
    "paddle_width_mm", "handle_length_mm", "grip_circumference_mm", "balance_point_mm",
  ]);
  const nonNegative = new Set(["swing_weight", "twist_weight"]);
  for (const field of TECHNICAL_FIELDS) {
    if (!hasOwn(body, field)) continue;
    if (positive.has(field)) result[field] = nullablePositiveNumber(body[field], field);
    else if (nonNegative.has(field)) result[field] = nullableNonNegativeNumber(body[field], field);
    else if (field === "paddle_shape") {
      const shape = nullableText(body[field], field, 30);
      if (shape !== null && !PADDLE_SHAPES.has(shape)) throw new ValidationError("paddle_shape không hợp lệ");
      result[field] = shape;
    } else result[field] = nullableText(body[field], field, 255);
  }
  const min = hasOwn(result, "static_weight_min_g") ? result.static_weight_min_g : undefined;
  const max = hasOwn(result, "static_weight_max_g") ? result.static_weight_max_g : undefined;
  if (min !== undefined && max !== undefined && min !== null && max !== null && min > max) {
    throw new ValidationError("static_weight_min_g không được lớn hơn static_weight_max_g");
  }
  const length = result.paddle_length_mm;
  const handle = result.handle_length_mm;
  if (length != null && handle != null && handle >= length) {
    throw new ValidationError("handle_length_mm phải nhỏ hơn paddle_length_mm");
  }
  return result;
};

const validateScores = (body) => {
  rejectUnknown(body, [...SCORE_FIELDS, "score_rationale", "rubric_version"]);
  if (!Object.keys(body).length) throw new ValidationError("Cần cung cấp điểm hoặc rationale");
  const result = {};
  for (const field of SCORE_FIELDS) {
    if (!hasOwn(body, field)) continue;
    if (body[field] === null || body[field] === "") result[field] = null;
    else {
      const score = Number(body[field]);
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        throw new ValidationError(`${field} phải là số nguyên từ 0 đến 100`);
      }
      result[field] = score;
    }
  }
  if (hasOwn(body, "rubric_version")) {
    const version = nullableText(body.rubric_version, "rubric_version", 30);
    if (version !== null && !SUPPORTED_RUBRIC_VERSIONS.has(version)) {
      throw new ValidationError(`Chỉ hỗ trợ rubric_version ${[...SUPPORTED_RUBRIC_VERSIONS].join(" hoặc ")}`);
    }
    result.rubric_version = version;
  }
  if (hasOwn(body, "score_rationale")) {
    if (body.score_rationale === null) result.score_rationale = null;
    else {
      if (!isPlainObject(body.score_rationale)) throw new ValidationError("score_rationale phải là object JSON");
      const unknownAxes = Object.keys(body.score_rationale).filter((axis) => !SCORE_AXES.includes(axis));
      if (unknownAxes.length) throw new ValidationError("score_rationale có trục không hợp lệ", unknownAxes);
      const rationale = {};
      for (const [axis, entry] of Object.entries(body.score_rationale)) {
        if (!isPlainObject(entry)) throw new ValidationError(`Rationale ${axis} phải là object`);
        rejectUnknown(entry, ["band", "reason", "sourceIds", "method", "confidence", "limitations"]);
        const reason = nullableText(entry.reason, `${axis}.reason`, 1000);
        if (!reason) throw new ValidationError(`${axis}.reason là bắt buộc`);
        if (!Array.isArray(entry.sourceIds)) throw new ValidationError(`${axis}.sourceIds phải là mảng`);
        const sourceIds = [...new Set(entry.sourceIds.map((id) => parsePositiveId(id, `${axis}.sourceIds`)))];
        rationale[axis] = {
          band: nullableText(entry.band, `${axis}.band`, 30),
          reason,
          sourceIds,
          ...(hasOwn(entry, "method") ? { method: nullableText(entry.method, `${axis}.method`, 50) } : {}),
          ...(hasOwn(entry, "confidence") ? { confidence: nullableText(entry.confidence, `${axis}.confidence`, 20) } : {}),
          ...(hasOwn(entry, "limitations") ? { limitations: nullableText(entry.limitations, `${axis}.limitations`, 1000) } : {}),
        };
      }
      result.score_rationale = rationale;
    }
  }
  return result;
};

const validateV11RubricSet = (spec) => {
  if (spec.rubric_version !== RUBRIC_VERSION) return;
  const rationale = spec.score_rationale || {};
  for (const axis of SCORE_AXES) {
    const score = spec[`${axis}_score`];
    const entry = rationale[axis];
    if (score === null || score === undefined || score === "") {
      if (entry) throw new ValidationError(`Không được có giải thích ${axis} khi chưa có điểm`);
      continue;
    }
    if (!RADAR_SCORE_POINTS.has(Number(score))) {
      throw new ValidationError(`${axis}_score theo rubric v1.1 phải là một trong các mốc 10, 30, 50, 70, 90`);
    }
    if (!entry || typeof entry !== "object") throw new ValidationError(`Thiếu giải thích cho ${axis}_score`);
    if (entry.band !== RADAR_BANDS.get(Number(score))) throw new ValidationError(`Band của ${axis}_score không khớp mốc điểm`);
    if (!RADAR_CONFIDENCE.has(entry.confidence)) throw new ValidationError(`Confidence của ${axis}_score không hợp lệ`);
    if (!RADAR_METHODS.has(entry.method)) throw new ValidationError(`Phương pháp của ${axis}_score không hợp lệ`);
    if (!entry.reason?.trim() || !Array.isArray(entry.sourceIds) || !entry.sourceIds.length) {
      throw new ValidationError(`${axis}_score cần lý do và ít nhất một nguồn`);
    }
    if (["LOW", "MEDIUM"].includes(entry.confidence) && !entry.limitations?.trim()) {
      throw new ValidationError(`${axis}_score confidence ${entry.confidence} cần nêu giới hạn bằng chứng`);
    }
  }
};

const validateSource = (body, partial = false) => {
  const fields = ["source_type", "source_title", "source_locator", "publisher", "published_at", "accessed_at", "supported_fields", "evidence_note", "is_primary"];
  rejectUnknown(body, fields);
  if (!Object.keys(body).length) throw new ValidationError("Cần cung cấp dữ liệu nguồn");
  const result = {};
  const required = ["source_type", "source_title", "source_locator", "accessed_at", "supported_fields"];
  if (!partial) {
    const missing = required.filter((field) => !hasOwn(body, field));
    if (missing.length) throw new ValidationError("Thiếu trường nguồn bắt buộc", missing);
  }
  if (hasOwn(body, "source_type")) {
    const type = nullableText(body.source_type, "source_type", 30);
    if (!SOURCE_TYPES.has(type)) throw new ValidationError("source_type không hợp lệ");
    result.source_type = type;
  }
  if (hasOwn(body, "source_title")) {
    const title = nullableText(body.source_title, "source_title", 255);
    if (!title) throw new ValidationError("source_title là bắt buộc");
    result.source_title = title;
  }
  if (hasOwn(body, "source_locator")) {
    const locator = nullableText(body.source_locator, "source_locator", 1000);
    if (!locator) throw new ValidationError("source_locator là bắt buộc");
    result.source_locator = locator;
  }
  if (hasOwn(body, "publisher")) result.publisher = nullableText(body.publisher, "publisher", 255);
  for (const field of ["published_at", "accessed_at"]) {
    if (!hasOwn(body, field)) continue;
    if (body[field] === null || body[field] === "") result[field] = null;
    else {
      const date = new Date(body[field]);
      if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} không phải ngày hợp lệ`);
      result[field] = field === "published_at" ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 19).replace("T", " ");
    }
  }
  if (!partial && result.accessed_at == null) throw new ValidationError("accessed_at là bắt buộc");
  if (hasOwn(body, "supported_fields")) {
    if (!Array.isArray(body.supported_fields)) throw new ValidationError("supported_fields phải là mảng");
    const normalized = [...new Set(body.supported_fields)];
    const invalid = normalized.filter((field) => typeof field !== "string" || !SOURCE_SUPPORTED_FIELDS.has(field));
    if (invalid.length) throw new ValidationError("supported_fields có trường không hợp lệ", invalid);
    result.supported_fields = normalized;
  }
  if (hasOwn(body, "evidence_note")) result.evidence_note = nullableText(body.evidence_note, "evidence_note", 10000);
  if (hasOwn(body, "is_primary")) {
    if (![true, false, 0, 1].includes(body.is_primary)) throw new ValidationError("is_primary phải là boolean");
    result.is_primary = body.is_primary ? 1 : 0;
  }
  if (result.source_type === "INTERNAL_REVIEW" && !result.evidence_note && !partial) {
    throw new ValidationError("INTERNAL_REVIEW cần evidence_note mô tả bằng chứng và phương pháp");
  }
  return result;
};

const validateReview = (body, allowed) => {
  rejectUnknown(body, ["decision", "review_note"]);
  const decision = nullableText(body.decision, "decision", 20);
  if (!allowed.includes(decision)) throw new ValidationError(`decision phải là ${allowed.join(" hoặc ")}`);
  const reviewNote = nullableText(body.review_note, "review_note", 10000);
  if (decision === "REJECTED" && !reviewNote) throw new ValidationError("review_note là bắt buộc khi từ chối");
  return { decision, review_note: reviewNote };
};

const validateConfirmation = (body) => {
  rejectUnknown(body, ["review_note"]);
  return { review_note: nullableText(body.review_note, "review_note", 10000) };
};

module.exports = {
  ValidationError,
  parsePositiveId,
  validateTechnical,
  validateScores,
  validateV11RubricSet,
  validateSource,
  validateReview,
  validateConfirmation,
};

