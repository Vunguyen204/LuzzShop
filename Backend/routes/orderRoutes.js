const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/", (req, res) => {
  const { user_id, full_name, phone, address, note, total_amount, items } =
    req.body;

  if (!full_name || !phone || !address || !items || items.length === 0) {
    return res.status(400).json({
      message: "Thiếu thông tin đặt hàng",
    });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json(err);

    const orderSql = `
      INSERT INTO orders
      (user_id, full_name, phone, total_amount, status, shipping_address, note, payment_method)
      VALUES (?, ?, ?, ?, 'Pending', ?, ?, 'COD')
    `;

    db.query(
      orderSql,
      [user_id || null, full_name, phone, total_amount, address, note || null],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({
              message: "Lỗi tạo đơn hàng",
              error: err,
            });
          });
        }

        const orderId = result.insertId;

        const orderItems = items.map((item) => [
          orderId,
          item.product_id,
          item.variant_id || null,
          item.product_name,
          item.sku || null,
          item.image_url,
          item.color || null,
          item.size || null,
          item.quantity,
          item.price,
          Number(item.price) * Number(item.quantity),
        ]);

        const itemSql = `
          INSERT INTO order_items
          (
            order_id,
            product_id,
            variant_id,
            product_name,
            sku,
            image_url,
            color,
            size,
            quantity,
            price,
            subtotal
          )
          VALUES ?
        `;

        db.query(itemSql, [orderItems], (err2) => {
          if (err2) {
            return db.rollback(() => {
              res.status(500).json({
                message: "Lỗi tạo chi tiết đơn hàng",
                error: err2,
              });
            });
          }

          const updateStockTasks = items.map((item) => {
            return new Promise((resolve, reject) => {
              const quantity = Number(item.quantity);

              if (!item.variant_id) {
                return reject(
                  new Error(
                    `${item.product_name} chưa có biến thể để trừ tồn kho`,
                  ),
                );
              }

              const updateVariantStockSql = `
      UPDATE product_variants
      SET stock = stock - ?
      WHERE variant_id = ? AND stock >= ?
    `;

              db.query(
                updateVariantStockSql,
                [quantity, item.variant_id, quantity],
                (err3, stockResult) => {
                  if (err3) return reject(err3);

                  if (stockResult.affectedRows === 0) {
                    return reject(
                      new Error(`${item.product_name} không đủ tồn kho`),
                    );
                  }

                  resolve();
                },
              );
            });
          });

          Promise.all(updateStockTasks)
            .then(() => {
              db.commit((err4) => {
                if (err4) {
                  return db.rollback(() => {
                    res.status(500).json({
                      message: "Lỗi xác nhận đơn hàng",
                      error: err4,
                    });
                  });
                }

                res.json({
                  message: "Đặt hàng thành công",
                  order_id: orderId,
                });
              });
            })
            .catch((error) => {
              db.rollback(() => {
                res.status(400).json({
                  message: error.message,
                });
              });
            });
        });
      },
    );
  });
});

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM orders
    ORDER BY order_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);

    res.json(results);
  });
});

router.get("/user/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT
      order_id,
      user_id,
      full_name,
      phone,
      total_amount,
      status,
      shipping_address,
      note,
      order_date,
      payment_method
    FROM orders
    WHERE user_id = ?
    ORDER BY order_date DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy đơn hàng",
        error: err,
      });
    }

    res.json(results);
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;

  const orderSql = `
    SELECT *
    FROM orders
    WHERE order_id = ?
  `;

  const itemSql = `
    SELECT *
    FROM order_items
    WHERE order_id = ?
  `;

  db.query(orderSql, [id], (err, orderResults) => {
    if (err) return res.status(500).json(err);

    if (orderResults.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
      });
    }

    db.query(itemSql, [id], (err, itemResults) => {
      if (err) return res.status(500).json(err);

      res.json({
        order: orderResults[0],
        items: itemResults,
      });
    });
  });
});

router.put("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE orders
    SET status = ?
    WHERE order_id = ?
  `;

  db.query(sql, [status, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Cập nhật trạng thái đơn hàng thành công",
    });
  });
});

module.exports = router;
