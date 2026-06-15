// Backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM products) AS totalProducts,
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT IFNULL(SUM(total_amount), 0) FROM orders) AS totalRevenue
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy dữ liệu dashboard",
        error: err,
      });
    }

    res.json(results[0]);
  });
});

router.get("/recent-orders", (req, res) => {
  const sql = `
    SELECT 
      order_id,
      full_name,
      order_date,
      total_amount,
      status
    FROM orders
    ORDER BY order_date DESC
    LIMIT 5
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy đơn hàng gần đây",
        error: err,
      });
    }

    res.json(results);
  });
});

router.get("/revenue-by-month", (req, res) => {
  const sql = `
    SELECT
      MONTH(order_date) AS month,
      YEAR(order_date) AS year,
      SUM(total_amount) AS revenue,
      COUNT(order_id) AS totalOrders
    FROM orders
    WHERE status = 'Completed'
    GROUP BY YEAR(order_date), MONTH(order_date)
    ORDER BY year, month
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy doanh thu theo tháng",
        error: err,
      });
    }

    res.json(results);
  });
});

module.exports = router;