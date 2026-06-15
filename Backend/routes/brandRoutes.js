const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM brands
    ORDER BY brand_name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

router.post("/", (req, res) => {
  const { brand_name, slug, logo_url, status } = req.body;

  const sql = `
    INSERT INTO brands
    (
      brand_name,
      slug,
      logo_url,
      status
    )
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [brand_name, slug, logo_url, status], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Thêm thương hiệu thành công",
    });
  });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;

  const { brand_name, slug, logo_url, status } = req.body;

  const sql = `
    UPDATE brands
    SET
      brand_name = ?,
      slug = ?,
      logo_url = ?,
      status = ?
    WHERE brand_id = ?
  `;

  db.query(sql, [brand_name, slug, logo_url, status, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Cập nhật thành công",
    });
  });
});

router.delete("/:id", (req, res) => {
  db.query("DELETE FROM brands WHERE brand_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Xóa thành công",
    });
  });
});

module.exports = router;
