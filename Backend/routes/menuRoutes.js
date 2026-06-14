const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM menus
    ORDER BY ordering
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy menu",
        error: err,
      });
    }

    res.json(results);
  });
});

router.get("/active", (req, res) => {
  const sql = `
    SELECT *
    FROM menus
    WHERE status = 1
    ORDER BY ordering
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

router.post("/", (req, res) => {
  const { menu_name, slug, ordering, status } = req.body;

  const sql = `
    INSERT INTO menus (menu_name, slug, ordering, status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [menu_name, slug, ordering, status], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi thêm menu",
        error: err,
      });
    }

    res.json({
      message: "Thêm menu thành công",
    });
  });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { menu_name, slug, ordering, status } = req.body;

  const sql = `
    UPDATE menus
    SET menu_name = ?, slug = ?, ordering = ?, status = ?
    WHERE menu_id = ?
  `;

  db.query(sql, [menu_name, slug, ordering, status, id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi cập nhật menu",
        error: err,
      });
    }

    res.json({
      message: "Cập nhật menu thành công",
    });
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM menus
    WHERE menu_id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi xóa menu",
        error: err,
      });
    }

    res.json({
      message: "Xóa menu thành công",
    });
  });
});

module.exports = router;
