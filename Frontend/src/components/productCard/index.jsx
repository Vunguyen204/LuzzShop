import { Link } from "react-router-dom";
import "./style.scss";

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <Link to={`/product/${product.product_id}`}>
        <div className="product-card__image">
          <img
            src={product.image_url}
            alt={product.product_name}
          />

          {/* <span className="sale-tag">
            NEW
          </span> */}
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

      <button className="add-cart-btn">
        Thêm vào giỏ hàng
      </button>
    </div>
  );
}

export default ProductCard;