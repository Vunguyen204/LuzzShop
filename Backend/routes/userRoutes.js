const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.address,
      u.created_at,
      u.role_id,
      r.role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    ORDER BY u.user_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);

    res.json(results);
  });
});

router.get("/roles", (req, res) => {
  const sql = `
    SELECT *
    FROM roles
    ORDER BY role_id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);

    res.json(results);
  });
});

router.put("/:id/role", (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;

  const sql = `
    UPDATE users
    SET role_id = ?
    WHERE user_id = ?
  `;

  db.query(sql, [role_id, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Cập nhật quyền thành công",
    });
  });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, address, role_id } = req.body;

  const sql = `
    UPDATE users
    SET full_name = ?, email = ?, phone = ?, address = ?, role_id = ?
    WHERE user_id = ?
  `;

  db.query(sql, [full_name, email, phone, address, role_id, id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi cập nhật người dùng",
        error: err,
      });
    }

    res.json({
      message: "Cập nhật người dùng thành công",
    });
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM users
    WHERE user_id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi xóa người dùng",
        error: err,
      });
    }

    res.json({
      message: "Xóa người dùng thành công",
    });
  });
});

module.exports = router;