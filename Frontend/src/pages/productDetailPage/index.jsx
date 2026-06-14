import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../../components/Breadcrumb";
import Toast from "../../components/Toast";
import "./style.scss";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      showToast("Sản phẩm đã hết hàng", "error");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = cart.find(
      (item) => item.product_id === product.product_id,
    );

    if (existingItem) {
      const totalQuantity = existingItem.quantity + quantity;

      if (totalQuantity > Number(product.stock)) {
        showToast(`Chỉ còn ${product.stock} sản phẩm trong kho`, "error");
        return;
      }

      existingItem.quantity = totalQuantity;
    } else {
      cart.push({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
        quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast("Đã thêm vào giỏ hàng", "success");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleQuantityChange = (value) => {
    const newQuantity = Number(value);

    if (!newQuantity || newQuantity < 1) {
      setQuantity(1);
      return;
    }

    if (newQuantity > product.stock) {
      showToast(`Chỉ còn ${product.stock} sản phẩm trong kho`, "error");
      setQuantity(product.stock);
      return;
    }

    setQuantity(newQuantity);
  };

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.log("Lỗi lấy chi tiết:", err));
  }, [id]);

  if (!product) return <p>Đang tải sản phẩm...</p>;

  return (
    <div className="product-detail-page">
      <Breadcrumb productName={product.product_name} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="product-detail-container">
        <div className="product-images">
          <div className="main-image">
            <img
              src={`http://localhost:5000${product.image_url}`}
              alt={product.product_name}
            />
          </div>

          <div className="thumb-list">
            <img
              src={`http://localhost:5000${product.image_url}`}
              alt={product.product_name}
            />
          </div>
        </div>

        <div className="product-info">
          <h1>{product.product_name}</h1>

          <div className="product-meta">
            <span>
              Mã: <b>{product.sku || `SP${product.product_id}`}</b>
            </span>
            <span>|</span>
            <span>
              Thương hiệu: <b>{product.brand_name}</b>
            </span>
            <span>|</span>
            <span>
              Tình trạng:{" "}
              <b className="stock">
                {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
              </b>
            </span>
          </div>

          <div className="price-box">
            <span className="current-price">
              {Number(product.price).toLocaleString()} đ
            </span>

            {product.old_price && (
              <span className="old-price">
                Giá niêm yết: {Number(product.old_price).toLocaleString()} đ
              </span>
            )}
          </div>

          <div className="option-box">
            <h3>Chọn phiên bản:</h3>

            <div className="option-grid">
              <button className="active">Tiêu chuẩn</button>
              <button>Cao cấp</button>
              <button>Giới hạn</button>
              <button>Premium</button>
            </div>
          </div>

          <div className="quantity-row">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              -
            </button>

            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />

            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= Number(product.stock)}
            >
              +
            </button>
          </div>

          <p className="stock-note">Còn lại: {product.stock} sản phẩm</p>

          <div className="action-buttons">
            <button className="buy-now">Mua ngay</button>
            <button className="add-cart" onClick={handleAddToCart}>
              Thêm vào giỏ hàng
            </button>
          </div>

          <div className="support-box">
            <h4>Yên tâm mua hàng</h4>
            <p>✔ Cam kết sản phẩm chính hãng</p>
            <p>✔ Đổi trả trong 7 ngày nếu lỗi sản phẩm</p>
            <p>✔ Giao hàng toàn quốc</p>
            <p>✔ Hỗ trợ tư vấn chọn sản phẩm</p>
          </div>
        </div>
      </div>

      <div className="product-tabs">
        <div className="tab-header">
          <span className="active">Mô tả sản phẩm</span>
          <span>Thông số kỹ thuật</span>
        </div>

        <div className="tab-content">
          <h2>1. Giới thiệu {product.product_name}</h2>
          <p>{product.description}</p>

          <p>
            Sản phẩm được thiết kế phù hợp cho người chơi Pickleball ở nhiều
            trình độ khác nhau, mang lại cảm giác kiểm soát tốt, độ bền cao và
            hiệu suất ổn định trong quá trình thi đấu.
          </p>

          <img
            src={`http://localhost:5000${product.image_url}`}
            alt={product.product_name}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
