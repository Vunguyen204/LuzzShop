const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((error, connection) => {
  if (error) {
    console.error("Kết nối MySQL thất bại:", error);
    return;
  }
  connection.release();
  console.log("Kết nối MySQL thành công");
});

module.exports = db;
