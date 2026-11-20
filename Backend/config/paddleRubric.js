const RUBRIC_VERSION = "v1.1";
const SUPPORTED_RUBRIC_VERSIONS = new Set(["v1.0", "v1.1"]);
const LEGACY_RUBRIC_VERSION = "v1.0";
const RADAR_SCORE_POINTS = new Set([10, 30, 50, 70, 90]);
const RADAR_BANDS = new Map([
  [10, "VERY_LOW"], [30, "LOW"], [50, "BALANCED"], [70, "HIGH"], [90, "VERY_HIGH"],
]);
const RADAR_CONFIDENCE = new Set(["LOW", "MEDIUM", "HIGH"]);
const RADAR_METHODS = new Set(["EVIDENCE_BASED_ESTIMATE", "COMPARABLE_BENCHMARK"]);
const RECOMMENDATION_POLICY = Object.freeze({
  version: "spec-v1.1-provisional",
  status: "PROVISIONAL",
  description: "Bộ điều kiện ứng viên chờ dry-run đủ 17 sản phẩm",
});

const SCORE_AXES = [
  "power",
  "control",
  "spin",
  "forgiveness",
  "maneuverability",
  "comfort",
];

const SCORE_FIELDS = SCORE_AXES.map((axis) => `${axis}_score`);

const TECHNICAL_FIELDS = [
  "static_weight_min_g",
  "static_weight_max_g",
  "core_thickness_mm",
  "paddle_length_mm",
  "paddle_width_mm",
  "handle_length_mm",
  "grip_circumference_mm",
  "balance_point_mm",
  "swing_weight",
  "twist_weight",
  "face_material",
  "core_material",
  "construction",
  "paddle_shape",
];

const SOURCE_SUPPORTED_FIELDS = new Set([...TECHNICAL_FIELDS, ...SCORE_FIELDS]);
const PADDLE_SHAPES = new Set(["STANDARD", "ELONGATED", "WIDEBODY", "HYBRID", "OTHER"]);
const SOURCE_TYPES = new Set([
  "MANUFACTURER",
  "AUTHORIZED_DISTRIBUTOR",
  "CERTIFIED_DOCUMENT",
  "INTERNAL_REVIEW",
  "OTHER",
]);
const AUTHORITATIVE_SOURCE_TYPES = new Set([
  "MANUFACTURER",
  "AUTHORIZED_DISTRIBUTOR",
  "CERTIFIED_DOCUMENT",
]);

module.exports = {
  RUBRIC_VERSION,
  SUPPORTED_RUBRIC_VERSIONS,
  LEGACY_RUBRIC_VERSION,
  RADAR_SCORE_POINTS,
  RADAR_BANDS,
  RADAR_CONFIDENCE,
  RADAR_METHODS,
  RECOMMENDATION_POLICY,
  SCORE_AXES,
  SCORE_FIELDS,
  TECHNICAL_FIELDS,
  SOURCE_SUPPORTED_FIELDS,
  PADDLE_SHAPES,
  SOURCE_TYPES,
  AUTHORITATIVE_SOURCE_TYPES,
};

