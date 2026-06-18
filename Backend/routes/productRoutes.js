const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/uploadProduct");

// Lấy tất cả sản phẩm
router.get("/", (req, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.status,

      COUNT(pv.variant_id) AS total_variant,
      COALESCE(SUM(pv.stock), 0) AS total_stock,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      c.category_name,
      c.slug AS category_slug,

      b.brand_name,
      b.slug AS brand_slug

    FROM products p
    LEFT JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN brands b
      ON p.brand_id = b.brand_id
    LEFT JOIN product_variants pv
      ON p.product_id = pv.product_id

    WHERE p.status = 1

    GROUP BY
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.image_url,
      c.category_name,
      c.slug,
      b.brand_name,
      b.slug

    ORDER BY p.product_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy danh sách sản phẩm",
        error: err,
      });
    }

    res.json(results);
  });
});

router.get("/admin", (req, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.status,

      COUNT(pv.variant_id) AS total_variant,
      COALESCE(SUM(pv.stock), 0) AS total_stock,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      c.category_name,
      c.slug AS category_slug,

      b.brand_name,
      b.slug AS brand_slug

    FROM products p
    LEFT JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN brands b
      ON p.brand_id = b.brand_id
    LEFT JOIN product_variants pv
      ON p.product_id = pv.product_id

    WHERE p.status IN (0,1)

    GROUP BY
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.image_url,
      c.category_name,
      c.slug,
      b.brand_name,
      b.slug

    ORDER BY p.product_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy danh sách sản phẩm",
        error: err,
      });
    }

    res.json(results);
  });
});

// Lấy 8 sản phẩm nổi bật
router.get("/featured", (req, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.status,

      COUNT(pv.variant_id) AS total_variant,
      COALESCE(SUM(pv.stock), 0) AS total_stock,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      c.category_name,
      c.slug AS category_slug,

      b.brand_name,
      b.slug AS brand_slug

    FROM products p
    LEFT JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN brands b
      ON p.brand_id = b.brand_id
    LEFT JOIN product_variants pv
      ON p.product_id = pv.product_id

    WHERE p.status = 1

    GROUP BY
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.image_url,
      c.category_name,
      c.slug,
      b.brand_name,
      b.slug

    ORDER BY p.product_id DESC
    LIMIT 8
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy sản phẩm nổi bật",
        error: err,
      });
    }

    res.json(results);
  });
});

// Lấy sản phẩm theo danh mục
router.get("/category/:slug", (req, res) => {
  const { slug } = req.params;

  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,

      COALESCE(SUM(pv.stock), 0) AS total_stock,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      c.category_name,
      c.slug AS category_slug,

      b.brand_name,
      b.slug AS brand_slug

    FROM products p
    JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN brands b
      ON p.brand_id = b.brand_id
    LEFT JOIN product_variants pv
      ON p.product_id = pv.product_id

    WHERE c.slug = ? AND p.status = 1

    GROUP BY
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.image_url,
      c.category_name,
      c.slug,
      b.brand_name,
      b.slug

    ORDER BY p.product_id DESC
  `;

  db.query(sql, [slug], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy sản phẩm theo danh mục",
        error: err,
      });
    }

    res.json(results);
  });
});

// Thêm sản phẩm
router.post("/", (req, res) => {
  const {
    category_id,
    brand_id,
    product_name,
    slug,
    sku,
    description,
    price,
    old_price,
    image_url,
  } = req.body;

  const sql = `
    INSERT INTO products
    (
      category_id,
      brand_id,
      product_name,
      slug,
      sku,
      description,
      price,
      old_price,
      image_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      category_id,
      brand_id,
      product_name,
      slug,
      sku,
      description,
      price,
      old_price || null,
      image_url,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi thêm sản phẩm",
          error: err,
        });
      }

      res.json({
        message: "Thêm sản phẩm thành công",
      });
    },
  );
});

// Upload ảnh sản phẩm
router.post("/upload", upload.single("image"), (req, res) => {
  const brandSlug = req.body.brand_slug;

  if (!brandSlug) {
    return res.status(400).json({
      message: "Thiếu brand_slug",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Chưa chọn ảnh",
    });
  }

  res.json({
    image_url: req.file.filename,
    brand_slug: brandSlug,
  });
});

// Cập nhật sản phẩm
router.put("/:id", (req, res) => {
  const { id } = req.params;

  const {
    category_id,
    brand_id,
    product_name,
    slug,
    sku,
    description,
    price,
    old_price,
    image_url,
  } = req.body;

  const sql = `
    UPDATE products
    SET
      category_id = ?,
      brand_id = ?,
      product_name = ?,
      slug = ?,
      sku = ?,
      description = ?,
      price = ?,
      old_price = ?,
      image_url = ?
    WHERE product_id = ?
  `;

  db.query(
    sql,
    [
      category_id,
      brand_id,
      product_name,
      slug,
      sku,
      description,
      price,
      old_price || null,
      image_url,
      id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi cập nhật sản phẩm",
          error: err,
        });
      }

      res.json({
        message: "Cập nhật sản phẩm thành công",
      });
    },
  );
});

// Xóa sản phẩm
// router.delete("/:id", (req, res) => {
//   const { id } = req.params;

//   const deleteVariantSql = `
//     DELETE FROM product_variants
//     WHERE product_id = ?
//   `;

//   const deleteProductSql = `
//     DELETE FROM products
//     WHERE product_id = ?
//   `;

//   db.query(deleteVariantSql, [id], (err) => {
//     if (err) {
//       return res.status(500).json({
//         message: "Lỗi xóa biến thể sản phẩm",
//         error: err,
//       });
//     }

//     db.query(deleteProductSql, [id], (err2) => {
//       if (err2) {
//         return res.status(500).json({
//           message: "Lỗi xóa sản phẩm",
//           error: err2,
//         });
//       }

//       res.json({
//         message: "Xóa sản phẩm thành công",
//       });
//     });
//   });
// });

router.patch("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE products
    SET status = ?
    WHERE product_id = ?
  `;

  db.query(sql, [status, id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi cập nhật trạng thái sản phẩm",
        error: err,
      });
    }

    res.json({
      message: "Cập nhật trạng thái thành công",
    });
  });
});

// Tìm kiếm sản phẩm
router.get("/search/:keyword", (req, res) => {
  const keyword = `%${req.params.keyword}%`;

  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,

      COALESCE(SUM(pv.stock), 0) AS total_stock,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      c.category_name,
      c.slug AS category_slug,

      b.brand_name,
      b.slug AS brand_slug

    FROM products p
    LEFT JOIN brands b
      ON p.brand_id = b.brand_id
    LEFT JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN product_variants pv
      ON p.product_id = pv.product_id

    WHERE
      p.status = 1
      AND (
        p.product_name LIKE ?
        OR p.sku LIKE ?
        OR b.brand_name LIKE ?
        OR c.category_name LIKE ?
      )

    GROUP BY
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.image_url,
      c.category_name,
      c.slug,
      b.brand_name,
      b.slug

    ORDER BY p.product_name ASC
  `;

  db.query(sql, [keyword, keyword, keyword, keyword], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi tìm kiếm sản phẩm",
        error: err,
      });
    }

    res.json(results);
  });
});

// router.get("/slug/:slug", (req, res) => {
//   const { slug } = req.params;

//   const sql = `
//     SELECT p.*,
//            c.category_name,
//            b.brand_name
//     FROM products p
//     LEFT JOIN categories c ON p.category_id = c.category_id
//     LEFT JOIN brands b ON p.brand_id = b.brand_id
//     WHERE p.slug = ?
//   `;

//   db.query(sql, [slug], (err, results) => {
//     if (err) return res.status(500).json(err);

//     if (results.length === 0) {
//       return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
//     }

//     res.json(results[0]);
//   });
// });

// // Lấy chi tiết sản phẩm theo id
// router.get("/:id", (req, res) => {
//   const productId = req.params.id;

//   const sql = `
//     SELECT
//       p.product_id,
//       p.category_id,
//       p.brand_id,
//       p.product_name,
//       p.slug,
//       p.sku,
//       p.description,
//       p.price,
//       p.old_price,

//       COALESCE(SUM(pv.stock), 0) AS total_stock,

//       CONCAT(
//         '/uploads/products/',
//         b.slug,
//         '/',
//         p.image_url
//       ) AS image_url,

//       c.category_name,
//       c.slug AS category_slug,

//       b.brand_name,
//       b.slug AS brand_slug

//     FROM products p
//     LEFT JOIN categories c
//       ON p.category_id = c.category_id
//     LEFT JOIN brands b
//       ON p.brand_id = b.brand_id
//     LEFT JOIN product_variants pv
//       ON p.product_id = pv.product_id

//     WHERE p.product_id = ?

//     GROUP BY
//       p.product_id,
//       p.category_id,
//       p.brand_id,
//       p.product_name,
//       p.slug,
//       p.sku,
//       p.description,
//       p.price,
//       p.old_price,
//       p.image_url,
//       c.category_name,
//       c.slug,
//       b.brand_name,
//       b.slug
//   `;

//   db.query(sql, [productId], (err, results) => {
//     if (err) {
//       return res.status(500).json({
//         message: "Lỗi lấy chi tiết sản phẩm",
//         error: err,
//       });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy sản phẩm",
//       });
//     }

//     const product = results[0];

//     const variantSql = `
//       SELECT
//         pv.variant_id,
//         pv.product_id,
//         pv.color,
//         pv.size,
//         pv.stock,

//         CONCAT(
//           '/uploads/products/',
//           b.slug,
//           '/',
//           pv.image_url
//         ) AS image_url,

//         pv.created_at
//       FROM product_variants pv
//       JOIN products p
//         ON pv.product_id = p.product_id
//       LEFT JOIN brands b
//         ON p.brand_id = b.brand_id
//       WHERE pv.product_id = ?
//       ORDER BY pv.color ASC, pv.size ASC
//     `;

//     db.query(variantSql, [productId], (err2, variantResults) => {
//       if (err2) {
//         return res.status(500).json({
//           message: "Lỗi lấy biến thể sản phẩm",
//           error: err2,
//         });
//       }

//       res.json({
//         ...product,
//         variants: variantResults,
//       });
//     });
//   });
// });

const getProductDetail = (whereSql, value, res) => {
  const sql = `
    SELECT
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,

      COALESCE(SUM(pv.stock), 0) AS total_stock,

      CONCAT(
        '/uploads/products/',
        b.slug,
        '/',
        p.image_url
      ) AS image_url,

      c.category_name,
      c.slug AS category_slug,

      b.brand_name,
      b.slug AS brand_slug

    FROM products p
    LEFT JOIN categories c
      ON p.category_id = c.category_id
    LEFT JOIN brands b
      ON p.brand_id = b.brand_id
    LEFT JOIN product_variants pv
      ON p.product_id = pv.product_id

    WHERE ${whereSql}

    GROUP BY
      p.product_id,
      p.category_id,
      p.brand_id,
      p.product_name,
      p.slug,
      p.sku,
      p.description,
      p.price,
      p.old_price,
      p.image_url,
      c.category_name,
      c.slug,
      b.brand_name,
      b.slug
  `;

  db.query(sql, [value], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Lỗi lấy chi tiết sản phẩm",
        error: err,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm",
      });
    }

    const product = results[0];

    const variantSql = `
      SELECT
        pv.variant_id,
        pv.product_id,
        pv.color,
        pv.size,
        pv.stock,

        CONCAT(
          '/uploads/products/',
          b.slug,
          '/',
          pv.image_url
        ) AS image_url,

        pv.created_at
      FROM product_variants pv
      JOIN products p
        ON pv.product_id = p.product_id
      LEFT JOIN brands b
        ON p.brand_id = b.brand_id
      WHERE pv.product_id = ?
      ORDER BY pv.color ASC, pv.size ASC
    `;

    db.query(variantSql, [product.product_id], (err2, variantResults) => {
      if (err2) {
        return res.status(500).json({
          message: "Lỗi lấy biến thể sản phẩm",
          error: err2,
        });
      }

      res.json({
        ...product,
        variants: variantResults,
      });
    });
  });
};

// Lấy chi tiết sản phẩm theo slug
router.get("/slug/:slug", (req, res) => {
  getProductDetail("p.slug = ?", req.params.slug, res);
});

// Lấy chi tiết sản phẩm theo id
router.get("/:id", (req, res) => {
  getProductDetail("p.product_id = ?", req.params.id, res);
});

module.exports = router;
