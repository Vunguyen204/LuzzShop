const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Lấy tất cả sản phẩm
router.get("/", (req, res) => {
    const sql = "SELECT * FROM products";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Lỗi lấy danh sách sản phẩm",
                error: err
            });
        }

        res.json(results);
    });
});

// Lấy chi tiết sản phẩm theo id
router.get("/:id", (req, res) => {
    const productId = req.params.id;

    const sql = "SELECT * FROM products WHERE product_id = ?";

    db.query(sql, [productId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Lỗi lấy chi tiết sản phẩm",
                error: err
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }

        res.json(results[0]);
    });
});

module.exports = router;