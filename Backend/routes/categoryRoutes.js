const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT 
      c.*,
      p.category_name AS parent_name
    FROM categories c
    LEFT JOIN categories p 
      ON c.parent_id = p.category_id
    ORDER BY c.parent_id IS NOT NULL, c.ordering ASC
  `;

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

router.get("/parents", (req, res) => {
  const sql = `
    SELECT *
    FROM categories
    WHERE parent_id IS NULL
    ORDER BY ordering ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy danh mục cha",
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

router.post("/", (req, res) => {
  const { category_name, slug, ordering, status } = req.body;

  const sql = `
    INSERT INTO categories
    (
      category_name,
      slug,
      ordering,
      status
    )
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [category_name, slug, ordering, status], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Thêm danh mục thành công",
    });
  });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;

  const { category_name, slug, ordering, status } = req.body;

  const sql = `
    UPDATE categories
    SET
      category_name = ?,
      slug = ?,
      ordering = ?,
      status = ?
    WHERE category_id = ?
  `;

  db.query(sql, [category_name, slug, ordering, status, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Cập nhật thành công",
    });
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM categories WHERE category_id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Xóa thành công",
    });
  });
});

module.exports = router;
