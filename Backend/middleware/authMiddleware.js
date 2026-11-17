const jwt = require("jsonwebtoken");
const db = require("../config/db");

const readBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
};

const loadUser = (req, res, next, required) => {
  const token = readBearerToken(req);
  if (!token) {
    if (!required) return next();
    return res.status(401).json({ message: "Bạn cần đăng nhập" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Máy chủ chưa cấu hình JWT_SECRET" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
  }

  db.query(
    "SELECT user_id, email, role_id FROM users WHERE user_id = ? LIMIT 1",
    [payload.id],
    (error, rows) => {
      if (error) return res.status(500).json({ message: "Lỗi xác thực người dùng" });
      if (!rows.length) return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
      req.user = rows[0];
      next();
    },
  );
};

const authenticate = (req, res, next) => loadUser(req, res, next, true);
const optionalAuthenticate = (req, res, next) => loadUser(req, res, next, false);

const requireAdmin = (req, res, next) => {
  if (Number(req.user?.role_id) !== 1) {
    return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
  }
  next();
};

const requireSelfOrAdmin = (paramName = "id") => (req, res, next) => {
  if (
    Number(req.user?.role_id) !== 1 &&
    Number(req.user?.user_id) !== Number(req.params[paramName])
  ) {
    return res.status(403).json({ message: "Bạn chỉ được truy cập dữ liệu của chính mình" });
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate, requireAdmin, requireSelfOrAdmin };
