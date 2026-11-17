const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticate, optionalAuthenticate, requireAdmin, requireSelfOrAdmin } = require("../middleware/authMiddleware");
const promiseDb = db.promise();
const allowedStatuses = new Set(["Pending", "Confirmed", "Shipping", "Completed", "Cancelled"]);
const allowedTransitions = {
  Pending: new Set(["Confirmed", "Cancelled"]),
  Confirmed: new Set(["Shipping", "Cancelled"]),
  Shipping: new Set(["Completed", "Cancelled"]),
  Completed: new Set(),
  Cancelled: new Set(),
};

const priceToCents = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return null;
  const cents = Math.round(price * 100);
  return Number.isSafeInteger(cents) ? cents : null;
};

const centsToDecimal = (cents) => (cents / 100).toFixed(2);

router.post("/", optionalAuthenticate, async (req, res) => {
  const { full_name, phone, address, note, items } = req.body;
  if (!full_name || !phone || !address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: "Thiếu thông tin đặt hàng" });
  }
  const normalized = [];
  const seen = new Set();
  for (const item of items) {
    const variantId = Number(item.variant_id);
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Sản phẩm hoặc biến thể không hợp lệ" });
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Số lượng sản phẩm không hợp lệ" });
    }
    if (seen.has(variantId)) return res.status(400).json({ message: "Biến thể sản phẩm bị trùng trong đơn hàng" });
    seen.add(variantId);
    normalized.push({ variantId, productId, quantity });
  }

  let connection;
  try {
    connection = await promiseDb.getConnection();
    await connection.beginTransaction();
    const verified = [];
    for (const item of normalized) {
      const [rows] = await connection.query(
        `SELECT pv.variant_id, pv.product_id, pv.color, pv.size, pv.stock,
                pv.image_url AS variant_image, p.product_name, p.sku, p.price,
                p.image_url AS product_image, p.status, b.slug AS brand_slug
         FROM product_variants pv
         JOIN products p ON p.product_id = pv.product_id
         LEFT JOIN brands b ON b.brand_id = p.brand_id
         WHERE pv.variant_id = ? AND pv.product_id = ? FOR UPDATE`,
        [item.variantId, item.productId],
      );
      if (!rows.length || Number(rows[0].status) !== 1) {
        throw Object.assign(new Error("Sản phẩm hoặc biến thể không còn khả dụng"), { status: 400 });
      }
      const product = rows[0];
      if (Number(product.stock) < item.quantity) {
        throw Object.assign(new Error(`${product.product_name} không đủ tồn kho`), { status: 400 });
      }
      const priceCents = priceToCents(product.price);
      if (priceCents === null) throw new Error("Giá sản phẩm không hợp lệ");
      verified.push({ ...product, quantity: item.quantity, priceCents });
    }

    const totalCents = verified.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    if (!Number.isSafeInteger(totalCents)) throw new Error("Tổng tiền đơn hàng vượt giới hạn");
    const totalAmount = centsToDecimal(totalCents);
    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (user_id, full_name, phone, total_amount, status, shipping_address, note, payment_method)
       VALUES (?, ?, ?, ?, 'Pending', ?, ?, 'COD')`,
      [req.user?.user_id || null, full_name, phone, totalAmount, address, note || null],
    );
    const details = verified.map((item) => [
      orderResult.insertId, item.product_id, item.variant_id, item.product_name, item.sku,
      item.variant_image ? `/uploads/products/${item.brand_slug}/${item.variant_image}` : `/uploads/products/${item.brand_slug}/${item.product_image}`,
      item.color, item.size, item.quantity, centsToDecimal(item.priceCents),
      centsToDecimal(item.priceCents * item.quantity),
    ]);
    await connection.query(
      `INSERT INTO order_details
       (order_id, product_id, variant_id, product_name, sku, image_url, color, size, quantity, price, subtotal)
       VALUES ?`,
      [details],
    );
    for (const item of verified) {
      await connection.query("UPDATE product_variants SET stock = stock - ? WHERE variant_id = ?", [item.quantity, item.variant_id]);
    }
    await connection.commit();
    res.json({ message: "Đặt hàng thành công", order_id: orderResult.insertId, total_amount: totalAmount });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    res.status(error.status || 500).json({ message: error.status ? error.message : "Lỗi tạo đơn hàng" });
  } finally {
    connection?.release();
  }
});

router.get("/", authenticate, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await promiseDb.query("SELECT * FROM orders ORDER BY order_date DESC");
    res.json(rows);
  } catch (_error) { res.status(500).json({ message: "Lỗi lấy đơn hàng" }); }
});

router.get("/user/:userId", authenticate, requireSelfOrAdmin("userId"), async (req, res) => {
  try {
    const [rows] = await promiseDb.query(
      `SELECT order_id, user_id, full_name, phone, total_amount, status,
              shipping_address, note, order_date, payment_method
       FROM orders WHERE user_id = ? ORDER BY order_date DESC`, [req.params.userId]);
    res.json(rows);
  } catch (_error) { res.status(500).json({ message: "Lỗi lấy đơn hàng" }); }
});

const findOwnedOrder = async (req, res) => {
  const [orders] = await promiseDb.query("SELECT * FROM orders WHERE order_id = ?", [req.params.id]);
  if (!orders.length) { res.status(404).json({ message: "Không tìm thấy đơn hàng" }); return null; }
  const order = orders[0];
  if (Number(req.user.role_id) !== 1 && Number(order.user_id) !== Number(req.user.user_id)) {
    res.status(403).json({ message: "Bạn chỉ được truy cập đơn hàng của chính mình" }); return null;
  }
  return order;
};

router.get("/:id", authenticate, async (req, res) => {
  try {
    const order = await findOwnedOrder(req, res);
    if (!order) return;
    const [items] = await promiseDb.query("SELECT * FROM order_details WHERE order_id = ?", [req.params.id]);
    res.json({ order, items });
  } catch (_error) { res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng" }); }
});

router.get("/:id/detail", authenticate, async (req, res) => {
  try {
    if (!(await findOwnedOrder(req, res))) return;
    const [rows] = await promiseDb.query(
      `SELECT od.order_detail_id, od.order_id, od.product_id, od.variant_id,
              od.quantity, od.price, od.product_name, p.image_url,
              b.slug AS brand_slug
       FROM order_details od LEFT JOIN products p ON od.product_id = p.product_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id WHERE od.order_id = ?`, [req.params.id]);
    res.json(rows);
  } catch (_error) { res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng" }); }
});

const cancelAndRestore = async (orderId, userId, isAdmin) => {
  const connection = await promiseDb.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query("SELECT user_id, status FROM orders WHERE order_id = ? FOR UPDATE", [orderId]);
    if (!orders.length) throw Object.assign(new Error("Không tìm thấy đơn hàng"), { status: 404 });
    if (!isAdmin && Number(orders[0].user_id) !== Number(userId)) {
      throw Object.assign(new Error("Bạn chỉ được hủy đơn hàng của chính mình"), { status: 403 });
    }
    if (
      (!isAdmin && orders[0].status !== "Pending") ||
      orders[0].status === "Completed" ||
      orders[0].status === "Cancelled"
    ) {
      throw Object.assign(new Error("Đơn hàng không còn ở trạng thái có thể hủy"), { status: 400 });
    }
    const [details] = await connection.query("SELECT variant_id, quantity FROM order_details WHERE order_id = ?", [orderId]);
    for (const detail of details) {
      if (detail.variant_id) await connection.query("UPDATE product_variants SET stock = stock + ? WHERE variant_id = ?", [detail.quantity, detail.variant_id]);
    }
    await connection.query("UPDATE orders SET status = 'Cancelled' WHERE order_id = ?", [orderId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
};

router.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    await cancelAndRestore(req.params.id, req.user.user_id, Number(req.user.role_id) === 1);
    res.json({ message: "Hủy đơn hàng thành công" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : "Lỗi hủy đơn hàng" });
  }
});

router.put("/:id/status", authenticate, requireAdmin, async (req, res) => {
  if (!allowedStatuses.has(req.body.status)) return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
  try {
    const [orders] = await promiseDb.query("SELECT status FROM orders WHERE order_id = ?", [req.params.id]);
    if (!orders.length) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    const currentStatus = orders[0].status;
    if (!allowedTransitions[currentStatus]?.has(req.body.status)) {
      return res.status(400).json({ message: "Không thể chuyển sang trạng thái đơn hàng này" });
    }
    if (req.body.status === "Cancelled") {
      await cancelAndRestore(req.params.id, req.user.user_id, true);
    } else {
      const [result] = await promiseDb.query(
        "UPDATE orders SET status = ? WHERE order_id = ? AND status = ?",
        [req.body.status, req.params.id, currentStatus],
      );
      if (!result.affectedRows) return res.status(409).json({ message: "Trạng thái đơn hàng vừa được thay đổi, vui lòng thử lại" });
    }
    res.json({ message: "Cập nhật trạng thái đơn hàng thành công" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : "Lỗi cập nhật đơn hàng" });
  }
});

module.exports = router;
