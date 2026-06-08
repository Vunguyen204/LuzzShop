const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const menuRoutes = require("./routes/menuRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("Backend LuzzerShop đang chạy");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});