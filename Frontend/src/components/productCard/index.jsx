import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.scss";

function ProductCard({ product, showToast }) {
  const navigate = useNavigate();
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (Number(product.total_variant) !== 1) {
        showToast("Vui lòng chọn phân loại sản phẩm", "warning");

        setTimeout(() => {
          navigate(`/products/${product.slug}`);
        }, 500);

        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/products/${product.product_id}`,
      );

      const variant = res.data.variants?.[0];

      if (!variant) {
        showToast("Sản phẩm chưa có tồn kho", "error");
        return;
      }

      const stock = Number(variant.stock);

      if (stock <= 0) {
        showToast("Sản phẩm đã hết hàng", "error");
        return;
      }

      const cart = JSON.parse(localStorage.getItem("cart")) || [];

      const existingItem = cart.find(
        (item) =>
          item.product_id === product.product_id &&
          item.variant_id === variant.variant_id,
      );

      if (existingItem) {
        if (Number(existingItem.quantity) >= stock) {
          showToast("Số lượng trong giỏ đã đạt tối đa tồn kho", "warning");
          return;
        }

        existingItem.quantity += 1;
      } else {
        cart.push({
          product_id: product.product_id,
          variant_id: variant.variant_id,

          product_name: product.product_name,
          sku: product.sku,

          color: variant.color || null,
          size: variant.size || null,

          price: product.price,
          old_price: product.old_price,

          image_url: variant.image_url || product.image_url,

          stock,
          quantity: 1,
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      showToast("Đã thêm vào giỏ hàng", "success");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.log("Lỗi thêm giỏ hàng:", error);
      showToast("Thêm vào giỏ hàng thất bại", "error");
    }
  };

  const isSale =
    product.old_price && Number(product.old_price) > Number(product.price);

  const [isLiked, setIsLiked] = useState(false);
  useEffect(() => {
    const checkWishlist = async () => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) return;

      const res = await axios.get(
        `http://localhost:5000/api/wishlist/check/${user.user_id}/${product.product_id}`,
      );

      setIsLiked(res.data.liked);
    };

    checkWishlist();
  }, [product.product_id]);
  const handleAddWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      showToast("Vui lòng đăng nhập để thêm yêu thích", "error");
      return;
    }

    try {
      if (isLiked) {
        await axios.delete(
          `http://localhost:5000/api/wishlist/${user.user_id}/${product.product_id}`,
        );

        setIsLiked(false);
        showToast("Đã xóa khỏi danh sách yêu thích", "success");
      } else {
        await axios.post("http://localhost:5000/api/wishlist", {
          user_id: user.user_id,
          product_id: product.product_id,
        });

        setIsLiked(true);
        showToast("Đã thêm vào danh sách yêu thích", "success");
      }
    } catch (error) {
      console.log("Lỗi wishlist:", error);
      showToast("Cập nhật yêu thích thất bại", "error");
    }
  };

  return (
    <div className="product-card">
      {/* <Link to={`/products/${product.product_id}`}> */}
      <Link to={`/products/${product.slug}`}>
        <div className="product-card__image">
          {isSale && (
            <div className="sale-badge">
              Giảm{" "}
              {Math.round(
                ((Number(product.old_price) - Number(product.price)) /
                  Number(product.old_price)) *
                  100,
              )}
              %
            </div>
          )}

          <img
            src={`http://localhost:5000${product.image_url}`}
            alt={product.product_name}
          />
        </div>

        <div className="product-card__content">
          <h3>{product.product_name}</h3>

          <div className="price-box">
            <span className={isSale ? "sale-price" : "current-price"}>
              {Number(product.price).toLocaleString()}đ
            </span>

            <span className={isSale ? "old-price" : "old-price hidden"}>
              {isSale ? `${Number(product.old_price).toLocaleString()}đ` : "0đ"}
            </span>
          </div>
        </div>
      </Link>

      <div className="product-card__actions">
        <button
          className="product-card__actions__add-cart-btn"
          onClick={handleAddToCart}
          disabled={Number(product.total_stock) <= 0}
        >
          {Number(product.total_stock) <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
        </button>

        <button
          className="product-card__actions__wishlist-btn"
          onClick={handleAddWishlist}
          title="Thêm vào yêu thích"
        >
          <i className={`fa-${isLiked ? "solid" : "regular"} fa-heart`}></i>
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
