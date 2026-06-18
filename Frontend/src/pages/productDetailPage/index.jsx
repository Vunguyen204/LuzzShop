import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../../components/Breadcrumb";
import Toast from "../../components/Toast";
import "./style.scss";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);

        if (res.data.variants?.length > 0) {
          const firstVariant = res.data.variants[0];
          setSelectedVariant(firstVariant);
          setSelectedColor(firstVariant.color || "");
          setSelectedSize(firstVariant.size || "");
        }
      })
      .catch((err) => console.log("Lỗi lấy chi tiết:", err));
  }, [id]);

  if (!product) return <p className="loading">Đang tải sản phẩm...</p>;

  const price = Number(product.price);
  const oldPrice = Number(product.old_price);
  const variants = product.variants || [];

  const colors = [
    ...new Set(variants.map((item) => item.color).filter(Boolean)),
  ];

  const sizes = [
    ...new Set(
      variants
        .filter((item) => !selectedColor || item.color === selectedColor)
        .map((item) => item.size)
        .filter(Boolean),
    ),
  ];

  const currentStock = Number(selectedVariant?.stock || 0);

  const currentImage = selectedVariant?.image_url || product.image_url;
  const currentSku = product.sku || `SP${product.product_id}`;
  const isSale = oldPrice > 0 && oldPrice > price;
  const discountPercent = isSale
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      showToast("Vui lòng chọn phân loại sản phẩm", "warning");
      return false;
    }

    if (currentStock <= 0) {
      showToast("Sản phẩm đã hết hàng", "error");
      return false;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = cart.find(
      (item) =>
        item.product_id === product.product_id &&
        item.variant_id === (selectedVariant?.variant_id || null),
    );

    if (existingItem) {
      const totalQuantity = Number(existingItem.quantity) + quantity;

      if (totalQuantity > currentStock) {
        showToast(`Chỉ còn ${currentStock} sản phẩm trong kho`, "error");
        return false;
      }

      existingItem.quantity = totalQuantity;
    } else {
      cart.push({
        product_id: product.product_id,
        variant_id: selectedVariant?.variant_id || null,

        product_name: product.product_name,
        sku: currentSku,

        color: selectedColor || null,
        size: selectedSize || null,

        price: product.price,
        old_price: product.old_price,

        image_url: currentImage,

        stock: currentStock,
        quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    showToast("Đã thêm vào giỏ hàng", "success");

    return true;
  };

  const handleBuyNow = () => {
    const added = handleAddToCart();

    if (added) {
      setTimeout(() => {
        navigate("/checkout");
      }, 500);
    }
  };

  const handleQuantityChange = (value) => {
    const newQuantity = Number(value);

    if (!newQuantity || newQuantity < 1) {
      setQuantity(1);
      return;
    }

    if (newQuantity > currentStock) {
      showToast(`Chỉ còn ${currentStock} sản phẩm trong kho`, "error");
      setQuantity(currentStock);
      return;
    }

    setQuantity(newQuantity);
  };

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
            {isSale && (
              <span className="sale-badge">Giảm {discountPercent}%</span>
            )}

            <img
              src={`http://localhost:5000${currentImage}`}
              alt={product.product_name}
            />
          </div>

          <div className="thumb-list">
            <img
              src={`http://localhost:5000${currentImage}`}
              alt={product.product_name}
            />
          </div>
        </div>

        <div className="product-info">
          <h1>{product.product_name}</h1>

          <div className="product-meta">
            <span>
              Mã: <b>{currentSku}</b>
            </span>

            <span>|</span>

            <span>
              Thương hiệu: <b>{product.brand_name || "Đang cập nhật"}</b>
            </span>

            <span>|</span>

            <span>
              Tình trạng:{" "}
              <b className={currentStock > 0 ? "stock" : "out-stock"}>
                {currentStock > 0 ? "Còn hàng" : "Hết hàng"}
              </b>
            </span>
          </div>

          <div className="price-box">
            <span className="current-price">{price.toLocaleString()}đ</span>

            {isSale && (
              <span className="old-price">{oldPrice.toLocaleString()}đ</span>
            )}
          </div>

          <div className="short-desc">
            {product.description ||
              "Sản phẩm Pickleball chính hãng, chất lượng cao, phù hợp cho nhiều trình độ người chơi."}
          </div>

          {colors.length > 0 && (
            <div className="option-box">
              <h3>Chọn màu:</h3>

              <div className="option-grid">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={selectedColor === color ? "active" : ""}
                    onClick={() => {
                      const availableVariants = variants.filter(
                        (item) => item.color === color,
                      );

                      const newVariant = availableVariants[0];

                      setSelectedColor(color);
                      setSelectedVariant(newVariant || null);
                      setSelectedSize(newVariant?.size || "");
                      setQuantity(1);
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="option-box">
              <h3>Chọn size:</h3>

              <div className="option-grid">
                {sizes.map((size) => {
                  const variant = variants.find(
                    (item) =>
                      item.color === selectedColor && item.size === size,
                  );

                  return (
                    <button
                      key={size}
                      className={selectedSize === size ? "active" : ""}
                      disabled={variant && Number(variant.stock) <= 0}
                      onClick={() => {
                        setSelectedSize(size);
                        setSelectedVariant(variant || null);
                        setQuantity(1);
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="quantity-row">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || currentStock <= 0}
            >
              -
            </button>

            <input
              type="number"
              min="1"
              max={currentStock}
              value={quantity}
              disabled={currentStock <= 0}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />

            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= currentStock || currentStock <= 0}
            >
              +
            </button>
          </div>

          <p className="stock-note">
            {currentStock > 0
              ? `Còn lại: ${currentStock} sản phẩm`
              : "Sản phẩm đã hết hàng"}
          </p>

          <div className="action-buttons">
            <button
              className="buy-now"
              onClick={handleBuyNow}
              disabled={currentStock <= 0}
            >
              Mua ngay
            </button>

            <button
              className="add-cart"
              onClick={handleAddToCart}
              disabled={currentStock <= 0}
            >
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
          <span
            className={activeTab === "description" ? "active" : ""}
            onClick={() => setActiveTab("description")}
          >
            Mô tả sản phẩm
          </span>

          <span
            className={activeTab === "specification" ? "active" : ""}
            onClick={() => setActiveTab("specification")}
          >
            Thông số kỹ thuật
          </span>
        </div>

        <div className="tab-content">
          {activeTab === "description" ? (
            <>
              <h2>1. Giới thiệu {product.product_name}</h2>

              <p>
                {product.description ||
                  "Sản phẩm được thiết kế phù hợp cho người chơi Pickleball ở nhiều trình độ khác nhau."}
              </p>

              <p>
                Sản phẩm mang lại cảm giác kiểm soát tốt, độ bền cao và hiệu
                suất ổn định trong quá trình tập luyện hoặc thi đấu.
              </p>

              <img
                src={`http://localhost:5000${currentImage}`}
                alt={product.product_name}
              />
            </>
          ) : (
            <table className="spec-table">
              <tbody>
                <tr>
                  <td>Tên sản phẩm</td>
                  <td>{product.product_name}</td>
                </tr>

                <tr>
                  <td>Mã sản phẩm</td>
                  <td>{currentSku}</td>
                </tr>

                <tr>
                  <td>Thương hiệu</td>
                  <td>{product.brand_name || "Đang cập nhật"}</td>
                </tr>

                <tr>
                  <td>Danh mục</td>
                  <td>{product.category_name || "Đang cập nhật"}</td>
                </tr>

                <tr>
                  <td>Màu sắc</td>
                  <td>{selectedColor || "Đang cập nhật"}</td>
                </tr>

                <tr>
                  <td>Size</td>
                  <td>{selectedSize || "Không có"}</td>
                </tr>

                <tr>
                  <td>Tình trạng</td>
                  <td>{currentStock > 0 ? "Còn hàng" : "Hết hàng"}</td>
                </tr>

                <tr>
                  <td>Giá bán</td>
                  <td>{price.toLocaleString()}đ</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
