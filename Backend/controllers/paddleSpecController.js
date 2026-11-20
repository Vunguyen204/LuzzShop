const service = require("../services/paddleSpecService");
const {
  parsePositiveId,
  validateReview,
  validateConfirmation,
  ValidationError,
} = require("../validators/paddleSpecValidator");

const sendError = (res, error) => {
  if (error instanceof ValidationError || error instanceof service.ServiceError) {
    const body = { message: error.message };
    if (error.details?.length) body.details = error.details;
    return res.status(error.status || 400).json(body);
  }
  if (error?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Dữ liệu đã tồn tại" });
  if (error?.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ message: "Dữ liệu tham chiếu không hợp lệ" });
  if (error?.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ message: "Dữ liệu đang được tham chiếu và không thể xóa" });
  if (error?.code?.startsWith("ER_")) return res.status(400).json({ message: "Dữ liệu không thỏa mãn ràng buộc" });
  console.error("Paddle Specs API error:", error);
  return res.status(500).json({ message: "Lỗi máy chủ khi xử lý Paddle Specs" });
};

const handler = (action) => async (req, res) => {
  try { await action(req, res); } catch (error) { sendError(res, error); }
};

exports.list = handler(async (_req, res) => res.json(await service.list()));

exports.detail = handler(async (req, res) => {
  res.json(await service.getDetail(parsePositiveId(req.params.productId, "product_id")));
});

exports.create = handler(async (req, res) => {
  const result = await service.create(
    parsePositiveId(req.params.productId, "product_id"),
    req.user.user_id,
  );
  res.status(201).json({ message: "Tạo Paddle Specs thành công", ...result });
});

exports.updateTechnical = handler(async (req, res) => {
  const result = await service.updateTechnical(
    parsePositiveId(req.params.productId, "product_id"), req.body, req.user.user_id,
  );
  res.json({ message: "Cập nhật thông số kỹ thuật thành công", ...result });
});

exports.updateScores = handler(async (req, res) => {
  const result = await service.updateScores(
    parsePositiveId(req.params.productId, "product_id"), req.body, req.user.user_id,
  );
  res.json({ message: "Cập nhật điểm rubric thành công", ...result });
});

exports.addSource = handler(async (req, res) => {
  const result = await service.addSource(
    parsePositiveId(req.params.productId, "product_id"), req.body, req.user.user_id,
  );
  res.status(201).json({ message: "Thêm nguồn thành công", ...result });
});

exports.sourceDetail = handler(async (req, res) => {
  res.json(await service.getSourceDetail(
    parsePositiveId(req.params.productId, "product_id"),
    parsePositiveId(req.params.sourceId, "source_id"),
  ));
});

exports.updateSource = handler(async (req, res) => {
  const result = await service.updateSource(
    parsePositiveId(req.params.productId, "product_id"),
    parsePositiveId(req.params.sourceId, "source_id"),
    req.body,
    req.user.user_id,
  );
  res.json({ message: "Cập nhật nguồn thành công", ...result });
});

exports.deleteSource = handler(async (req, res) => {
  const result = await service.removeSource(
    parsePositiveId(req.params.productId, "product_id"),
    parsePositiveId(req.params.sourceId, "source_id"),
    req.user.user_id,
  );
  res.json({ message: "Xóa nguồn thành công", ...result });
});

exports.reviewSource = handler(async (req, res) => {
  const { decision, review_note } = validateReview(req.body, ["VERIFIED", "REJECTED"]);
  const result = await service.reviewSource(
    parsePositiveId(req.params.productId, "product_id"),
    parsePositiveId(req.params.sourceId, "source_id"),
    decision,
    review_note,
    req.user.user_id,
  );
  res.json({ message: decision === "VERIFIED" ? "Xác minh nguồn thành công" : "Từ chối nguồn thành công", ...result });
});

exports.submit = handler(async (req, res) => {
  const result = await service.submit(
    parsePositiveId(req.params.productId, "product_id"), req.user.user_id,
  );
  res.json({ message: "Đã gửi Paddle Specs sang trạng thái IN_REVIEW", ...result });
});

exports.confirm = handler(async (req, res) => {
  const { review_note } = validateConfirmation(req.body || {});
  const result = await service.confirm(
    parsePositiveId(req.params.productId, "product_id"), review_note, req.user.user_id,
  );
  res.json({ message: "Xác nhận thông số kỹ thuật thành công", ...result });
});

exports.review = handler(async (req, res) => {
  const { decision, review_note } = validateReview(req.body, ["VERIFIED", "REJECTED"]);
  const result = await service.review(
    parsePositiveId(req.params.productId, "product_id"), decision, review_note, req.user.user_id,
  );
  res.json({ message: decision === "VERIFIED" ? "Duyệt Paddle Specs thành công" : "Từ chối Paddle Specs thành công", ...result });
});

