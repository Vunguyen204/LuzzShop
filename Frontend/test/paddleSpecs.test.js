import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRadarPayload,
  createEmptyScores,
  fieldLabel,
  localizeApiMessage,
  missingLabel,
  validateRadarScores,
} from "../src/config/paddleSpecs.js";

test("rubric v1.1 payload preserves missing axes as null", () => {
  const scores = createEmptyScores();
  scores.power = {
    score: "70",
    reason: "Có bằng chứng trực tiếp",
    sourceIds: [12],
    method: "EVIDENCE_BASED_ESTIMATE",
    confidence: "MEDIUM",
    limitations: "Chưa có phép đo độc lập",
  };
  const payload = buildRadarPayload(scores);
  assert.equal(payload.rubric_version, "v1.1");
  assert.equal(payload.power_score, 70);
  assert.equal(payload.score_rationale.power.band, "HIGH");
  assert.equal(payload.control_score, null);
  assert.equal(Object.hasOwn(payload.score_rationale, "control"), false);
});

test("Radar validation rejects arbitrary score and missing evidence", () => {
  const scores = createEmptyScores();
  scores.control.score = "61";
  const errors = validateRadarScores(scores);
  assert.ok(errors.some((message) => message.includes("10, 30, 50, 70 hoặc 90")));
  assert.ok(errors.some((message) => message.includes("nguồn")));
});

test("Vietnamese labels hide internal field and missing codes", () => {
  assert.equal(fieldLabel("swing_weight"), "Quán tính vung vợt");
  assert.equal(missingLabel("uncovered_technical_field.swing_weight"), "Thiếu nguồn đã xác minh cho Quán tính vung vợt");
  assert.equal(localizeApiMessage("static_weight_min_g phải lớn hơn 0"), "Trọng lượng tối thiểu (g) phải lớn hơn 0");
});
