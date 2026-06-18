const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/uploadProduct");

// Lấy variant theo product
router.get("/:productId", (req, res) => {
  const { productId } = req.params;

  const sql = `
    SELECT *
    FROM product_variants
    WHERE product_id = ?
    ORDER BY variant_id DESC
  `;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy biến thể sản phẩm",
        error: err,
      });
    }

    res.json(results);
  });
});

// Thêm variant
router.post("/", (req, res) => {
  const { product_id, color, size, stock, image_url } = req.body;

  const sql = `
    INSERT INTO product_variants
    (product_id, color, size, stock, image_url)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [product_id, color, size || null, stock, image_url],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi thêm biến thể",
          error: err,
        });
      }

      res.json({
        message: "Thêm biến thể thành công",
      });
    }
  );
});

// Sửa variant
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { color, size, stock, image_url } = req.body;

  const sql = `
    UPDATE product_variants
    SET color = ?, size = ?, stock = ?, image_url = ?
    WHERE variant_id = ?
  `;

  db.query(sql, [color, size || null, stock, image_url, id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi cập nhật biến thể",
        error: err,
      });
    }

    res.json({
      message: "Cập nhật biến thể thành công",
    });
  });
});

// Xóa variant
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM product_variants
    WHERE variant_id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi xóa biến thể",
        error: err,
      });
    }

    res.json({
      message: "Xóa biến thể thành công",
    });
  });
});

// Upload ảnh variant
router.post("/upload/image", upload.single("image"), (req, res) => {
  const brandSlug = req.body.brand_slug;

  if (!brandSlug) {
    return res.status(400).json({
      message: "Thiếu brand_slug",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Chưa chọn ảnh",
    });
  }

  res.json({
    image_url: `/uploads/products/${brandSlug}/${req.file.filename}`,
  });
});

module.exports = router;