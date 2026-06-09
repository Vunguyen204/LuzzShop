const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = "SELECT * FROM categories";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy danh mục",
        error: err,
      });
    }

    res.json(results);
  });
});

router.get("/:slug", (req, res) => {
  const { slug } = req.params;

  const sql = "SELECT * FROM categories WHERE slug = ?";

  db.query(sql, [slug], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy danh mục",
        error: err,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
      });
    }

    res.json(results[0]);
  });
});

module.exports = router;