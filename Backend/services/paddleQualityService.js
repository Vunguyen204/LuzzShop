const {
  SCORE_AXES,
  TECHNICAL_FIELDS,
  AUTHORITATIVE_SOURCE_TYPES,
  LEGACY_RUBRIC_VERSION,
  RUBRIC_VERSION,
  RADAR_BANDS,
  RECOMMENDATION_POLICY,
} = require("../config/paddleRubric");

const isPresent = (value) => value !== null && value !== undefined && value !== "";

const FIELD_WEIGHTS = Object.freeze({
  static_weight_min_g: 7.5, static_weight_max_g: 7.5,
  core_thickness_mm: 7.5, core_material: 7.5,
  face_material: 7.5, construction: 7.5,
  paddle_length_mm: 7, paddle_width_mm: 7, handle_length_mm: 7,
  grip_circumference_mm: 7, paddle_shape: 7,
  balance_point_mm: 10 / 3, swing_weight: 10 / 3, twist_weight: 10 / 3,
});

const populatedTechnicalFields = (spec) => TECHNICAL_FIELDS.filter((field) => isPresent(spec?.[field]));
const sourceSupportsAny = (source, fields) => (source.supported_fields || []).some((field) => fields.has(field));

const calculateTechnicalCompleteness = (product, spec) => {
  if (!spec) return { value: 0, breakdown: {} };
  const breakdown = {
    identity: product?.category_slug === "vot-pickleball" ? 5 : 0,
    weight: (isPresent(spec.static_weight_min_g) ? 7.5 : 0) + (isPresent(spec.static_weight_max_g) ? 7.5 : 0),
    core: (isPresent(spec.core_thickness_mm) ? 7.5 : 0) + (isPresent(spec.core_material) ? 7.5 : 0),
    face_construction: (isPresent(spec.face_material) ? 7.5 : 0) + (isPresent(spec.construction) ? 7.5 : 0),
    dimensions_shape: ["paddle_length_mm", "paddle_width_mm", "handle_length_mm", "grip_circumference_mm", "paddle_shape"]
      .reduce((sum, field) => sum + (isPresent(spec[field]) ? 7 : 0), 0),
    advanced_metrics: Number(["balance_point_mm", "swing_weight", "twist_weight"]
      .reduce((sum, field) => sum + (isPresent(spec[field]) ? 10 / 3 : 0), 0).toFixed(2)),
    review_metadata: spec.verification_status === "VERIFIED" && spec.reviewed_by_user_id && spec.reviewed_at ? 5 : 0,
  };
  return {
    value: Number(Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)).toFixed(2)),
    breakdown,
  };
};

const evaluateTechnicalEvidence = (spec, sources) => {
  const populated = populatedTechnicalFields(spec);
  const populatedSet = new Set(populated);
  const verifiedSources = sources.filter((source) => source.verification_status === "VERIFIED");
  const verifiedCoverage = new Set(verifiedSources.flatMap((source) => source.supported_fields || []));
  const uncoveredFields = populated.filter((field) => !verifiedCoverage.has(field));
  const pendingRelevantSources = sources.filter((source) =>
    source.verification_status === "PENDING" && sourceSupportsAny(source, populatedSet));
  const denominator = populated.reduce((sum, field) => sum + (FIELD_WEIGHTS[field] || 0), 0);
  const coveredWeight = populated.reduce((sum, field) => sum + (verifiedCoverage.has(field) ? FIELD_WEIGHTS[field] || 0 : 0), 0);
  const coverage = denominator ? Number((coveredWeight * 100 / denominator).toFixed(2)) : 0;
  const verifiedTechnicalSources = verifiedSources.filter((source) => sourceSupportsAny(source, populatedSet));
  const blockers = [];
  if (!populated.length) blockers.push("technical_fact_required");
  if (!verifiedTechnicalSources.length) blockers.push("verified_technical_source_required");
  blockers.push(...uncoveredFields.map((field) => `uncovered_technical_field.${field}`));
  if (pendingRelevantSources.length) blockers.push("pending_technical_evidence");
  return {
    coverage,
    populated_fields: populated,
    covered_fields: populated.filter((field) => verifiedCoverage.has(field)),
    uncovered_fields: uncoveredFields,
    pending_source_ids: pendingRelevantSources.map((source) => Number(source.paddle_spec_source_id)),
    verified_source_ids: verifiedTechnicalSources.map((source) => Number(source.paddle_spec_source_id)),
    blockers,
    can_confirm: blockers.length === 0,
  };
};

const rationaleEntryValid = (spec, sources, axis) => {
  const score = spec?.[`${axis}_score`];
  const entry = spec?.score_rationale?.[axis];
  if (!isPresent(score) || !entry || typeof entry.reason !== "string" || !entry.reason.trim()) return false;
  if (!Array.isArray(entry.sourceIds) || !entry.sourceIds.length) return false;
  const scoreField = `${axis}_score`;
  const validSourceIds = new Set(sources
    .filter((source) => source.verification_status === "VERIFIED" && (source.supported_fields || []).includes(scoreField))
    .map((source) => Number(source.paddle_spec_source_id)));
  if (!entry.sourceIds.some((id) => validSourceIds.has(Number(id)))) return false;
  if (spec.rubric_version === RUBRIC_VERSION) {
    if (entry.band !== RADAR_BANDS.get(Number(score))) return false;
    if (!["LOW", "MEDIUM", "HIGH"].includes(entry.confidence)) return false;
    if (!["EVIDENCE_BASED_ESTIMATE", "COMPARABLE_BENCHMARK"].includes(entry.method)) return false;
    if (["LOW", "MEDIUM"].includes(entry.confidence) && !entry.limitations?.trim()) return false;
  }
  return true;
};

const evaluateRadar = (spec, sources) => {
  if (!spec) return { status: "UNSCORED", ready: false, coverage: 0, confidence: "UNSCORABLE", valid_axes: [], missing_axes: [...SCORE_AXES], legacy: false };
  const scoredAxes = SCORE_AXES.filter((axis) => isPresent(spec[`${axis}_score`]));
  const validAxes = SCORE_AXES.filter((axis) => rationaleEntryValid(spec, sources, axis));
  const missingAxes = SCORE_AXES.filter((axis) => !validAxes.includes(axis));
  const legacy = spec.rubric_version === LEGACY_RUBRIC_VERSION;
  const confidences = validAxes.map((axis) => spec.score_rationale?.[axis]?.confidence).filter(Boolean);
  let confidence = "UNSCORABLE";
  if (!legacy && confidences.length) {
    if (confidences.includes("LOW")) confidence = "LOW";
    else if (confidences.includes("MEDIUM")) confidence = "MEDIUM";
    else if (confidences.every((value) => value === "HIGH")) confidence = "HIGH";
  }
  const ready = !legacy && validAxes.length === SCORE_AXES.length && ["MEDIUM", "HIGH"].includes(confidence);
  let status = "PARTIAL";
  if (!scoredAxes.length) status = "UNSCORED";
  else if (legacy) status = "LEGACY_REVIEW_REQUIRED";
  else if (ready) status = "READY";
  return {
    status,
    ready,
    coverage: Number((validAxes.length * 100 / SCORE_AXES.length).toFixed(2)),
    confidence,
    valid_axes: validAxes,
    missing_axes: missingAxes,
    legacy,
  };
};

const evaluateRecommendation = (product, spec, technicalEvidence) => {
  const technicalVerified = spec?.verification_status === "VERIFIED"
    && technicalEvidence.can_confirm
    && technicalEvidence.coverage === 100;
  const dimensions = ["paddle_length_mm", "paddle_width_mm", "handle_length_mm", "grip_circumference_mm", "paddle_shape"]
    .filter((field) => isPresent(spec?.[field]));
  const missing = [];
  if (!technicalVerified) missing.push("technical_verified");
  if (!isPresent(spec?.static_weight_min_g) || !isPresent(spec?.static_weight_max_g)) missing.push("recommendation.weight_range");
  if (!isPresent(spec?.core_thickness_mm)) missing.push("recommendation.core_thickness_mm");
  if (dimensions.length < 2) missing.push("recommendation.dimensions_shape>=2");
  if (!["face_material", "core_material", "construction"].some((field) => isPresent(spec?.[field]))) {
    missing.push("recommendation.material_or_construction");
  }
  const eligible = missing.length === 0;
  const finderMissing = [...missing];
  if (Number(product?.product_status) !== 1) finderMissing.push("active_product");
  if (!(Number(product?.price) > 0)) finderMissing.push("valid_price");
  if (Number(product?.total_stock) <= 0) finderMissing.push("available_stock");
  return {
    technical_verified: technicalVerified,
    recommendation_eligible: eligible,
    finder_ready: eligible && Number(product?.product_status) === 1 && Number(product?.price) > 0 && Number(product?.total_stock) > 0,
    recommendation_missing: missing,
    finder_missing: finderMissing,
    policy: RECOMMENDATION_POLICY,
  };
};

const calculateQuality = (product, spec, sources = []) => {
  if (!spec) {
    return {
      completeness: 0, finder_ready: false, missing: ["paddle_specs"], breakdown: {},
      technical_verified: false, recommendation_eligible: false, radar_ready: false,
      technical_completeness: 0, technical_evidence_coverage: 0,
      radar_coverage: 0, radar_confidence: "UNSCORABLE", radar_status: "UNSCORED",
      technical_evidence: { coverage: 0, populated_fields: [], covered_fields: [], uncovered_fields: [], pending_source_ids: [], verified_source_ids: [], blockers: ["paddle_specs"], can_confirm: false },
      recommendation_policy: RECOMMENDATION_POLICY,
    };
  }
  const completeness = calculateTechnicalCompleteness(product, spec);
  const evidence = evaluateTechnicalEvidence(spec, sources);
  const radar = evaluateRadar(spec, sources);
  const recommendation = evaluateRecommendation(product, spec, evidence);
  const missing = [...new Set([
    ...recommendation.finder_missing,
    ...evidence.blockers,
  ])];
  return {
    // Backward-compatible fields.
    completeness: completeness.value,
    finder_ready: recommendation.finder_ready,
    missing,
    breakdown: completeness.breakdown,
    // v1.1 fields.
    technical_verified: recommendation.technical_verified,
    recommendation_eligible: recommendation.recommendation_eligible,
    radar_ready: radar.ready,
    technical_completeness: completeness.value,
    technical_evidence_coverage: evidence.coverage,
    radar_coverage: radar.coverage,
    radar_confidence: radar.confidence,
    radar_status: radar.status,
    technical_evidence: evidence,
    radar,
    recommendation_missing: recommendation.recommendation_missing,
    finder_missing: recommendation.finder_missing,
    recommendation_policy: recommendation.policy,
    authoritative_verified_source_count: sources.filter((source) =>
      source.verification_status === "VERIFIED" && AUTHORITATIVE_SOURCE_TYPES.has(source.source_type)).length,
  };
};

module.exports = {
  calculateQuality,
  calculateTechnicalCompleteness,
  evaluateTechnicalEvidence,
  evaluateRadar,
  evaluateRecommendation,
  populatedTechnicalFields,
};
