const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const testDatabase = `luzzshop_it_${process.pid}_${Date.now()}`;
if (!/^luzzshop_it_\d+_\d+$/.test(testDatabase)) throw new Error("Unsafe test database name");

let adminConnection;
let db;
let server;
let baseUrl;
let userToken;
let otherUserToken;
let adminToken;

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const orderBody = (productId, variantId, quantity, overrides = {}) => ({
  full_name: "Integration Test",
  phone: "0900000000",
  address: "Test address",
  payment_method: "CARD",
  total_amount: 1,
  items: [{
    product_id: productId,
    variant_id: variantId,
    quantity,
    price: 1,
    product_name: "Tampered client name",
  }],
  ...overrides,
});

const request = async (url, options = {}) => {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
};

const stockOf = async (variantId) => {
  const [rows] = await db.query("SELECT stock FROM product_variants WHERE variant_id = ?", [variantId]);
  return Number(rows[0].stock);
};

before(async () => {
  adminConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await adminConnection.query(`CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  process.env.DB_NAME = testDatabase;
  process.env.JWT_SECRET = "integration-test-secret-not-for-production";

  db = require("../config/db").promise();
  const schema = [
    `CREATE TABLE roles (
      role_id INT PRIMARY KEY,
      role_name VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB`,
    `CREATE TABLE users (
      user_id INT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(30),
      address VARCHAR(255),
      role_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,
    `CREATE TABLE brands (
      brand_id INT PRIMARY KEY,
      brand_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      logo_url VARCHAR(255),
      status TINYINT DEFAULT 1
    ) ENGINE=InnoDB`,
    `CREATE TABLE products (
      product_id INT PRIMARY KEY,
      brand_id INT,
      product_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      price DECIMAL(15,2) NOT NULL,
      image_url VARCHAR(255),
      status TINYINT NOT NULL DEFAULT 1
    ) ENGINE=InnoDB`,
    `CREATE TABLE product_variants (
      variant_id INT PRIMARY KEY,
      product_id INT NOT NULL,
      color VARCHAR(100),
      size VARCHAR(100),
      stock INT NOT NULL,
      image_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,
    `CREATE TABLE orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      shipping_address VARCHAR(255) NOT NULL,
      note TEXT,
      payment_method VARCHAR(30) NOT NULL,
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,
    `CREATE TABLE order_details (
      order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      variant_id INT NULL,
      product_name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      image_url VARCHAR(500),
      color VARCHAR(100),
      size VARCHAR(100),
      quantity INT NOT NULL,
      price DECIMAL(15,2) NOT NULL,
      subtotal DECIMAL(15,2) NOT NULL
    ) ENGINE=InnoDB`,
  ];
  for (const statement of schema) await db.query(statement);

  await db.query("INSERT INTO roles VALUES (1, 'Admin'), (2, 'User')");
  await db.query(
    `INSERT INTO users (user_id, full_name, email, password, role_id) VALUES
     (1, 'Admin', 'admin@test.local', 'unused', 1),
     (2, 'User', 'user@test.local', 'unused', 2),
     (3, 'Other User', 'other@test.local', 'unused', 2)`,
  );
  await db.query("INSERT INTO brands (brand_id, brand_name, slug) VALUES (1, 'Test Brand', 'test-brand')");
  await db.query(
    `INSERT INTO products (product_id, brand_id, product_name, slug, sku, price, image_url, status) VALUES
     (101, 1, 'Guest Product', 'guest-product', 'GUEST-1', 125000.55, 'guest.jpg', 1),
     (102, 1, 'User Product', 'user-product', 'USER-1', 200000.00, 'user.jpg', 1),
     (103, 1, 'Race Product', 'race-product', 'RACE-1', 300000.00, 'race.jpg', 1),
     (104, 1, 'Cancel Product', 'cancel-product', 'CANCEL-1', 400000.00, 'cancel.jpg', 1),
     (105, 1, 'Admin Product', 'admin-product', 'ADMIN-1', 500000.00, 'admin.jpg', 1),
     (106, 1, 'Disabled Product', 'disabled-product', 'OFF-1', 600000.00, 'off.jpg', 0)`,
  );
  await db.query(
    `INSERT INTO product_variants (variant_id, product_id, color, size, stock, image_url) VALUES
     (201, 101, 'Black', 'M', 5, 'guest-v.jpg'),
     (202, 102, 'Blue', 'L', 3, 'user-v.jpg'),
     (203, 103, 'Red', 'S', 1, 'race-v.jpg'),
     (204, 104, 'White', 'M', 5, 'cancel-v.jpg'),
     (205, 105, 'Green', 'L', 4, 'admin-v.jpg'),
     (206, 106, 'Gray', 'M', 2, 'off-v.jpg'),
     (207, 105, 'Yellow', 'XL', 2, 'terminal-v.jpg')`,
  );

  userToken = jwt.sign({ id: 2 }, process.env.JWT_SECRET, { expiresIn: "1h" });
  otherUserToken = jwt.sign({ id: 3 }, process.env.JWT_SECRET, { expiresIn: "1h" });
  adminToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1h" });

  const app = require("../server");
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.end();
  if (adminConnection) {
    await adminConnection.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``);
    await adminConnection.end();
  }
});

test("guest COD order uses database price and keeps user_id null", async () => {
  const result = await request("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderBody(101, 201, 2)),
  });
  assert.equal(result.status, 200);
  assert.equal(Number(result.body.total_amount), 250001.1);
  const [orders] = await db.query("SELECT user_id, total_amount, payment_method FROM orders WHERE order_id = ?", [result.body.order_id]);
  assert.equal(orders[0].user_id, null);
  assert.equal(Number(orders[0].total_amount), 250001.1);
  assert.equal(orders[0].payment_method, "COD");
  const [details] = await db.query("SELECT product_name, price, subtotal FROM order_details WHERE order_id = ?", [result.body.order_id]);
  assert.equal(details[0].product_name, "Guest Product");
  assert.equal(Number(details[0].price), 125000.55);
  assert.equal(Number(details[0].subtotal), 250001.1);
  assert.equal(await stockOf(201), 3);
});

test("authenticated order derives owner from JWT and validates variant, status, quantity and stock", async () => {
  const valid = await request("/api/orders", {
    method: "POST", headers: auth(userToken),
    body: JSON.stringify(orderBody(102, 202, 1, { user_id: 3 })),
  });
  assert.equal(valid.status, 200);
  const [orders] = await db.query("SELECT user_id FROM orders WHERE order_id = ?", [valid.body.order_id]);
  assert.equal(orders[0].user_id, 2);

  const wrongPair = await request("/api/orders", { method: "POST", body: JSON.stringify(orderBody(101, 202, 1)) });
  const excessive = await request("/api/orders", { method: "POST", body: JSON.stringify(orderBody(102, 202, 99)) });
  const invalidQuantity = await request("/api/orders", { method: "POST", body: JSON.stringify(orderBody(102, 202, 0)) });
  const disabled = await request("/api/orders", { method: "POST", body: JSON.stringify(orderBody(106, 206, 1)) });
  assert.equal(wrongPair.status, 400);
  assert.equal(excessive.status, 400);
  assert.equal(invalidQuantity.status, 400);
  assert.equal(disabled.status, 400);
  assert.equal(await stockOf(202), 2);
  assert.equal(await stockOf(206), 2);
});

test("two concurrent requests cannot oversell a one-unit variant", async () => {
  const payload = JSON.stringify(orderBody(103, 203, 1));
  const results = await Promise.all([
    request("/api/orders", { method: "POST", body: payload }),
    request("/api/orders", { method: "POST", body: payload }),
  ]);
  assert.deepEqual(results.map((item) => item.status).sort(), [200, 400]);
  assert.equal(await stockOf(203), 0);
  const [rows] = await db.query("SELECT COUNT(*) AS count FROM order_details WHERE variant_id = 203");
  assert.equal(Number(rows[0].count), 1);
});

test("owner can cancel once, stock is restored once, and another user is forbidden", async () => {
  const created = await request("/api/orders", {
    method: "POST", headers: auth(userToken), body: JSON.stringify(orderBody(104, 204, 2)),
  });
  assert.equal(created.status, 200);
  assert.equal(await stockOf(204), 3);

  const forbiddenView = await request(`/api/orders/${created.body.order_id}`, { headers: auth(otherUserToken) });
  const forbiddenCancel = await request(`/api/orders/${created.body.order_id}/cancel`, { method: "PATCH", headers: auth(otherUserToken), body: "{}" });
  assert.equal(forbiddenView.status, 403);
  assert.equal(forbiddenCancel.status, 403);
  assert.equal(await stockOf(204), 3);

  const cancellationResults = await Promise.all([
    request(`/api/orders/${created.body.order_id}/cancel`, { method: "PATCH", headers: auth(userToken), body: "{}" }),
    request(`/api/orders/${created.body.order_id}/cancel`, { method: "PATCH", headers: auth(userToken), body: "{}" }),
  ]);
  assert.deepEqual(cancellationResults.map((item) => item.status).sort(), [200, 400]);
  const repeated = await request(`/api/orders/${created.body.order_id}/cancel`, { method: "PATCH", headers: auth(userToken), body: "{}" });
  assert.equal(repeated.status, 400);
  assert.equal(await stockOf(204), 5);
  const [orders] = await db.query("SELECT status FROM orders WHERE order_id = ?", [created.body.order_id]);
  assert.equal(orders[0].status, "Cancelled");
});

test("admin can view and update orders; user cannot use admin endpoints", async () => {
  const created = await request("/api/orders", {
    method: "POST", headers: auth(userToken), body: JSON.stringify(orderBody(105, 205, 2)),
  });
  assert.equal(created.status, 200);
  assert.equal(await stockOf(205), 2);

  const userList = await request("/api/orders", { headers: auth(userToken) });
  const userUpdate = await request(`/api/orders/${created.body.order_id}/status`, {
    method: "PUT", headers: auth(userToken), body: JSON.stringify({ status: "Completed" }),
  });
  assert.equal(userList.status, 403);
  assert.equal(userUpdate.status, 403);

  const adminList = await request("/api/orders", { headers: auth(adminToken) });
  const adminView = await request(`/api/orders/${created.body.order_id}`, { headers: auth(adminToken) });
  const confirmed = await request(`/api/orders/${created.body.order_id}/status`, {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ status: "Confirmed" }),
  });
  const cancelled = await request(`/api/orders/${created.body.order_id}/status`, {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ status: "Cancelled" }),
  });
  const repeated = await request(`/api/orders/${created.body.order_id}/status`, {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ status: "Cancelled" }),
  });
  assert.equal(adminList.status, 200);
  assert.equal(adminView.status, 200);
  assert.equal(confirmed.status, 200);
  assert.equal(cancelled.status, 200);
  assert.equal(repeated.status, 400);
  assert.equal(await stockOf(205), 4);
});

test("completed and cancelled orders are terminal and cannot restore stock", async () => {
  const created = await request("/api/orders", {
    method: "POST", headers: auth(userToken), body: JSON.stringify(orderBody(105, 207, 1)),
  });
  assert.equal(created.status, 200);
  for (const status of ["Confirmed", "Shipping", "Completed"]) {
    const result = await request(`/api/orders/${created.body.order_id}/status`, {
      method: "PUT", headers: auth(adminToken), body: JSON.stringify({ status }),
    });
    assert.equal(result.status, 200);
  }
  const cancelCompleted = await request(`/api/orders/${created.body.order_id}/status`, {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ status: "Cancelled" }),
  });
  const reopenCompleted = await request(`/api/orders/${created.body.order_id}/status`, {
    method: "PUT", headers: auth(adminToken), body: JSON.stringify({ status: "Pending" }),
  });
  assert.equal(cancelCompleted.status, 400);
  assert.equal(reopenCompleted.status, 400);
  assert.equal(await stockOf(207), 1);
});
