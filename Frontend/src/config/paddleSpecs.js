export const EMPTY_VALUE_LABEL = "Chưa có dữ liệu";

export const TECHNICAL_GROUPS = [
  {
    key: "basic",
    title: "Thông số cơ bản",
    description: "Kích thước và khối lượng được nhà sản xuất hoặc tài liệu kiểm chứng công bố.",
    fields: [
      { key: "static_weight_min_g", label: "Trọng lượng tối thiểu", unit: "g", type: "number", tooltip: "Khối lượng tĩnh nhỏ nhất được công bố cho vợt." },
      { key: "static_weight_max_g", label: "Trọng lượng tối đa", unit: "g", type: "number", tooltip: "Khối lượng tĩnh lớn nhất được công bố cho vợt." },
      { key: "core_thickness_mm", label: "Độ dày lõi", unit: "mm", type: "number", tooltip: "Độ dày phần lõi vợt, tính bằng milimét." },
      { key: "paddle_length_mm", label: "Chiều dài vợt", unit: "mm", type: "number" },
      { key: "paddle_width_mm", label: "Chiều rộng vợt", unit: "mm", type: "number" },
      { key: "handle_length_mm", label: "Chiều dài cán", unit: "mm", type: "number" },
      { key: "grip_circumference_mm", label: "Chu vi cán", unit: "mm", type: "number" },
      { key: "paddle_shape", label: "Hình dáng vợt", type: "shape", tooltip: "Phân loại hình học tổng thể của mặt vợt." },
    ],
  },
  {
    key: "materials",
    title: "Cấu tạo và vật liệu",
    description: "Chỉ ghi đúng tên vật liệu hoặc kết cấu xuất hiện trong nguồn.",
    fields: [
      { key: "face_material", label: "Chất liệu mặt vợt", type: "text" },
      { key: "core_material", label: "Chất liệu lõi", type: "text" },
      { key: "construction", label: "Kết cấu chế tạo", type: "text" },
    ],
  },
  {
    key: "advanced",
    title: "Thông số nâng cao (tùy chọn)",
    description: "Được phép để trống khi không có phép đo hoặc tài liệu đáng tin cậy.",
    fields: [
      { key: "balance_point_mm", label: "Điểm cân bằng", unit: "mm", type: "number", tooltip: "Khoảng cách từ đáy cán đến điểm vợt cân bằng. Không suy đoán từ cảm giác cầm." },
      { key: "swing_weight", label: "Quán tính vung vợt", type: "number", tooltip: "Mức quán tính khi vung. Đây không phải trọng lượng tĩnh và chỉ nhập khi nguồn nêu phép đo rõ ràng." },
      { key: "twist_weight", label: "Độ ổn định chống xoắn", type: "number", tooltip: "Khả năng chống xoay quanh trục dọc khi bóng chạm lệch tâm; chỉ nhập kết quả có phương pháp đo." },
    ],
  },
];

export const TECHNICAL_FIELDS = TECHNICAL_GROUPS.flatMap((group) => group.fields);
export const TECHNICAL_FIELD_KEYS = TECHNICAL_FIELDS.map((field) => field.key);

export const RADAR_AXES = [
  { key: "power", label: "Sức mạnh", tooltip: "Khả năng hỗ trợ tạo tốc độ và độ sâu của bóng; không phải thông số đo trực tiếp." },
  { key: "control", label: "Kiểm soát", tooltip: "Khả năng điều tiết hướng, độ sâu và nhịp bóng dựa trên bằng chứng." },
  { key: "spin", label: "Tạo xoáy", tooltip: "Mức hỗ trợ tạo xoáy từ bề mặt và kết cấu đã được kiểm chứng." },
  { key: "forgiveness", label: "Dễ đánh", tooltip: "Mức ổn định và duy trì hiệu quả khi điểm tiếp xúc lệch tâm. Không phải cam kết phòng tránh chấn thương." },
  { key: "maneuverability", label: "Linh hoạt", tooltip: "Mức dễ xoay trở và thay đổi hướng vợt; có thể liên quan đến khối lượng và quán tính vung." },
  { key: "comfort", label: "Thoải mái", tooltip: "Đánh giá editorial về cảm giác tác động/rung từ bằng chứng; không phải tư vấn sức khỏe." },
];

export const RADAR_SCORE_OPTIONS = [
  { score: 10, band: "VERY_LOW", label: "10 — Rất thấp" },
  { score: 30, band: "LOW", label: "30 — Thấp" },
  { score: 50, band: "BALANCED", label: "50 — Cân bằng" },
  { score: 70, band: "HIGH", label: "70 — Cao" },
  { score: 90, band: "VERY_HIGH", label: "90 — Rất cao" },
];

export const SCORE_TO_BAND = Object.fromEntries(RADAR_SCORE_OPTIONS.map(({ score, band }) => [score, band]));
export const BAND_LABELS = {
  VERY_LOW: "Rất thấp",
  LOW: "Thấp",
  BALANCED: "Cân bằng",
  HIGH: "Cao",
  VERY_HIGH: "Rất cao",
};
export const CONFIDENCE_LABELS = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", UNSCORABLE: "Chưa đủ bằng chứng" };
export const METHOD_LABELS = {
  EVIDENCE_BASED_ESTIMATE: "Ước tính dựa trên bằng chứng",
  COMPARABLE_BENCHMARK: "Đối chiếu mẫu so sánh",
};

export const VERIFICATION_STATUS_LABELS = {
  NONE: "Chưa nhập",
  DRAFT: "Bản nháp",
  IN_REVIEW: "Chờ xác minh",
  VERIFIED: "Đã xác minh kỹ thuật",
  REJECTED: "Cần chỉnh sửa",
};
export const SOURCE_STATUS_LABELS = { PENDING: "Chờ xác minh", VERIFIED: "Đã xác minh", REJECTED: "Đã từ chối" };
export const RADAR_STATUS_LABELS = {
  UNSCORED: "Chưa đánh giá Radar",
  PARTIAL: "Radar chưa đầy đủ",
  READY: "Radar sẵn sàng",
  BLOCKED: "Radar đang bị chặn",
  LEGACY_REVIEW_REQUIRED: "Cần chuyển đổi từ rubric v1.0",
};
export const SOURCE_TYPE_LABELS = {
  MANUFACTURER: "Nhà sản xuất",
  AUTHORIZED_DISTRIBUTOR: "Nhà phân phối ủy quyền",
  CERTIFIED_DOCUMENT: "Tài liệu chứng nhận",
  INTERNAL_REVIEW: "Đánh giá nội bộ có bằng chứng",
  OTHER: "Nguồn khác",
};
export const SHAPE_LABELS = {
  STANDARD: "Tiêu chuẩn",
  ELONGATED: "Dáng dài",
  WIDEBODY: "Mặt rộng",
  HYBRID: "Lai",
  OTHER: "Khác",
};
export const BREAKDOWN_LABELS = {
  identity: "Nhận diện sản phẩm",
  weight: "Trọng lượng",
  core: "Lõi vợt",
  face_construction: "Mặt và kết cấu",
  dimensions_shape: "Kích thước và hình dáng",
  advanced_metrics: "Thông số nâng cao",
  review_metadata: "Thông tin xác nhận",
};

const FIELD_LABELS = Object.fromEntries([
  ...TECHNICAL_FIELDS.map(({ key, label, unit }) => [key, unit ? `${label} (${unit})` : label]),
  ...RADAR_AXES.map(({ key, label }) => [`${key}_score`, `Điểm ${label}`]),
]);

export const fieldLabel = (key) => FIELD_LABELS[key] || "Trường dữ liệu chưa xác định";
export const statusLabel = (status) => VERIFICATION_STATUS_LABELS[status] || "Trạng thái chưa xác định";
export const sourceStatusLabel = (status) => SOURCE_STATUS_LABELS[status] || "Trạng thái nguồn chưa xác định";
export const radarStatusLabel = (status) => RADAR_STATUS_LABELS[status] || "Trạng thái Radar chưa xác định";

export const localizeApiMessage = (message = "") => {
  let localized = message;
  for (const [key, label] of Object.entries(FIELD_LABELS)) localized = localized.replaceAll(key, label);
  return localized
    .replaceAll("rubric_version", "phiên bản rubric")
    .replaceAll("score_rationale", "giải thích điểm Radar")
    .replaceAll("sourceIds", "danh sách nguồn")
    .replaceAll("supported_fields", "các trường được nguồn hỗ trợ")
    .replaceAll("review_note", "ghi chú xác minh");
};

export const missingLabel = (code) => {
  const uncovered = code?.match(/^uncovered_technical_field\.(.+)$/);
  if (uncovered) return `Thiếu nguồn đã xác minh cho ${fieldLabel(uncovered[1])}`;
  const labels = {
    paddle_specs: "Chưa tạo hồ sơ thông số",
    technical_fact_required: "Cần nhập ít nhất một thông số kỹ thuật",
    verified_technical_source_required: "Cần ít nhất một nguồn kỹ thuật đã xác minh",
    pending_technical_evidence: "Còn nguồn kỹ thuật đang chờ xác minh",
    technical_verified: "Thông số kỹ thuật chưa được xác nhận",
    "recommendation.weight_range": "Thiếu khoảng trọng lượng",
    "recommendation.core_thickness_mm": "Thiếu độ dày lõi",
    "recommendation.dimensions_shape>=2": "Cần ít nhất hai thông tin kích thước hoặc hình dáng",
    "recommendation.material_or_construction": "Thiếu vật liệu hoặc kết cấu",
    active_product: "Sản phẩm chưa hoạt động",
    valid_price: "Sản phẩm chưa có giá hợp lệ",
    available_stock: "Sản phẩm đang hết hàng",
  };
  return labels[code] || "Có điều kiện dữ liệu chưa được đáp ứng";
};

export const createEmptyTechnical = () => Object.fromEntries(TECHNICAL_FIELD_KEYS.map((key) => [key, ""]));
export const createEmptyScores = () => Object.fromEntries(RADAR_AXES.map(({ key }) => [key, {
  score: "", reason: "", sourceIds: [], method: "", confidence: "", limitations: "",
}]));

export const buildRadarPayload = (scores) => {
  const payload = { rubric_version: "v1.1", score_rationale: {} };
  for (const { key } of RADAR_AXES) {
    const entry = scores[key] || {};
    const hasScore = entry.score !== "" && entry.score !== null && entry.score !== undefined;
    payload[`${key}_score`] = hasScore ? Number(entry.score) : null;
    if (hasScore) {
      payload.score_rationale[key] = {
        band: SCORE_TO_BAND[Number(entry.score)],
        reason: entry.reason.trim(),
        sourceIds: entry.sourceIds.map(Number),
        method: entry.method,
        confidence: entry.confidence,
        limitations: entry.limitations.trim() || null,
      };
    }
  }
  return payload;
};

export const validateRadarScores = (scores) => {
  const errors = [];
  for (const { key, label } of RADAR_AXES) {
    const entry = scores[key] || {};
    const hasScore = entry.score !== "" && entry.score !== null && entry.score !== undefined;
    const hasOtherData = Boolean(entry.reason?.trim() || entry.sourceIds?.length || entry.method || entry.confidence || entry.limitations?.trim());
    if (!hasScore && hasOtherData) errors.push(`${label}: hãy chọn điểm hoặc xóa phần giải thích.`);
    if (!hasScore) continue;
    if (!SCORE_TO_BAND[Number(entry.score)]) errors.push(`${label}: điểm phải là 10, 30, 50, 70 hoặc 90.`);
    if (!entry.reason?.trim()) errors.push(`${label}: cần nhập lý do đánh giá.`);
    if (!entry.sourceIds?.length) errors.push(`${label}: cần chọn ít nhất một nguồn hỗ trợ đúng trục.`);
    if (!entry.method) errors.push(`${label}: cần chọn phương pháp đánh giá.`);
    if (!entry.confidence) errors.push(`${label}: cần chọn độ tin cậy.`);
    if (["LOW", "MEDIUM"].includes(entry.confidence) && !entry.limitations?.trim()) {
      errors.push(`${label}: độ tin cậy ${CONFIDENCE_LABELS[entry.confidence]?.toLowerCase()} cần nêu giới hạn bằng chứng.`);
    }
  }
  return errors;
};

export const isTechnicalSource = (source) => source.supported_fields?.some((field) => TECHNICAL_FIELD_KEYS.includes(field));
