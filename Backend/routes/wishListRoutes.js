const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Lấy danh sách yêu thích theo user
router.get("/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT
      w.wishlist_id,
      w.user_id,
      w.product_id,

      p.product_name,
      p.slug,
      p.price,
      p.old_price,
      p.status,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      b.brand_name,
      b.slug AS brand_slug,
      c.category_name

    FROM wishlists w
    JOIN products p ON w.product_id = p.product_id
    LEFT JOIN brands b ON p.brand_id = b.brand_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE w.user_id = ?
      AND p.status = 1
    ORDER BY w.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy danh sách yêu thích",
        error: err,
      });
    }

    res.json(results);
  });
});

// Thêm sản phẩm vào yêu thích
router.post("/", (req, res) => {
  const { user_id, product_id } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({
      message: "Thiếu user_id hoặc product_id",
    });
  }

  const sql = `
    INSERT IGNORE INTO wishlists (user_id, product_id)
    VALUES (?, ?)
  `;

  db.query(sql, [user_id, product_id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi thêm yêu thích",
        error: err,
      });
    }

    res.json({
      message: "Đã thêm vào danh sách yêu thích",
    });
  });
});

// Xóa sản phẩm khỏi yêu thích
router.delete("/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params;

  const sql = `
    DELETE FROM wishlists
    WHERE user_id = ?
      AND product_id = ?
  `;

  db.query(sql, [userId, productId], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi xóa yêu thích",
        error: err,
      });
    }

    res.json({
      message: "Đã xóa khỏi danh sách yêu thích",
    });
  });
});

// Kiểm tra sản phẩm đã yêu thích chưa
router.get("/check/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params;

  const sql = `
    SELECT * FROM wishlists
    WHERE user_id = ?
      AND product_id = ?
    LIMIT 1
  `;

  db.query(sql, [userId, productId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi kiểm tra yêu thích",
        error: err,
      });
    }

    res.json({
      liked: results.length > 0,
    });
  });
});

module.exports = router;