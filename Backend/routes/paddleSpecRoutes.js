const express = require("express");
const controller = require("../controllers/paddleSpecController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get("/", controller.list);
router.get("/:productId", controller.detail);
router.post("/:productId", controller.create);
router.put("/:productId/technical", controller.updateTechnical);
router.put("/:productId/scores", controller.updateScores);
router.post("/:productId/submit", controller.submit);
router.post("/:productId/confirm", controller.confirm);
router.post("/:productId/review", controller.review);

router.post("/:productId/sources", controller.addSource);
router.get("/:productId/sources/:sourceId", controller.sourceDetail);
router.put("/:productId/sources/:sourceId", controller.updateSource);
router.delete("/:productId/sources/:sourceId", controller.deleteSource);
router.post("/:productId/sources/:sourceId/review", controller.reviewSource);

module.exports = router;

