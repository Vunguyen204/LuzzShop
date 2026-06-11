import { Link } from "react-router-dom";
import "./style.scss";

function ProductCard({ product, showToast }) {
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const stock = Number(product.stock);

    const existingItem = cart.find(
      (item) => item.product_id === product.product_id,
    );

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        showToast("Số lượng trong giỏ đã đạt tối đa tồn kho", "warning");
        return;
      }

      existingItem.quantity += 1;
    } else {
      if (stock <= 0) {
        showToast("Sản phẩm đã hết hàng", "error");
        return;
      }

      cart.push({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast("Đã thêm vào giỏ hàng", "success");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.product_id}`}>
        <div className="product-card__image">
          <img
            src={`http://localhost:5000${product.image_url}`}
            alt={product.product_name}
          />
        </div>

        <div className="product-card__content">
          <h3>{product.product_name}</h3>

          <div className="price-box">
            <span className="current-price">
              {Number(product.price).toLocaleString()}đ
            </span>

            {product.old_price && (
              <span className="old-price">
                {Number(product.old_price).toLocaleString()}đ
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        className="add-cart-btn"
        onClick={handleAddToCart}
        disabled={Number(product.stock) <= 0}
      >
        {Number(product.stock) <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
      </button>
    </div>
  );
}

export default ProductCard;