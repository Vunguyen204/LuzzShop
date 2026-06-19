import { memo, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/toast";
import "./style.scss";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const fetchWishlist = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/wishlist/${user.user_id}`,
      );

      setWishlist(res.data);
    } catch (error) {
      console.log("Lỗi lấy wishlist:", error);
    }
  }, [user?.user_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWishlist();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchWishlist]);

  const handleRemoveWishlist = async (productId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/wishlist/${user.user_id}/${productId}`,
      );

      setWishlist((prev) =>
        prev.filter((item) => item.product_id !== productId),
      );

      showToast("Đã xóa khỏi danh sách yêu thích", "success");
    } catch (error) {
      console.log("Lỗi xóa wishlist:", error);
      showToast("Xóa sản phẩm yêu thích thất bại", "error");
    }
  };

  const handleAddToCart = async (product) => {
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

  //   const handleAddToCart = (product) => {
  //     const cart = JSON.parse(localStorage.getItem("cart")) || [];

  //     const existingItem = cart.find(
  //       (item) => item.product_id === product.product_id,
  //     );

  //     if (existingItem) {
  //       existingItem.quantity += 1;
  //     } else {
  //       cart.push({
  //         ...product,
  //         quantity: 1,
  //       });
  //     }

  //     localStorage.setItem("cart", JSON.stringify(cart));
  //     window.dispatchEvent(new Event("cartUpdated"));

  //     showToast("Đã thêm vào giỏ hàng", "success");
  //   };

  if (!user) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="wishlist-empty">
            <h2>DANH SÁCH YÊU THÍCH</h2>
            <p>Bạn cần đăng nhập để xem danh sách yêu thích.</p>
            <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container">
        <h2>DANH SÁCH YÊU THÍCH</h2>

        {wishlist.length > 0 ? (
          <div className="wishlist-list">
            {wishlist.map((item) => (
              <div className="wishlist-item" key={item.wishlist_id}>
                <Link
                  to={`/products/${item.slug}`}
                  className="wishlist-item__image"
                >
                  <img
                    src={`http://localhost:5000${item.image_url}`}
                    alt={item.product_name}
                  />
                </Link>

                <div className="wishlist-item__info">
                  <Link to={`/products/${item.slug}`}>
                    <h3>{item.product_name}</h3>
                  </Link>

                  <p>{item.brand_name}</p>

                  <div className="wishlist-item__price">
                    <span>{Number(item.price).toLocaleString()}đ</span>

                    {item.old_price && (
                      <del>{Number(item.old_price).toLocaleString()}đ</del>
                    )}
                  </div>
                </div>

                <div className="wishlist-item__actions">
                  <button onClick={() => handleAddToCart(item)}>
                    Thêm vào giỏ hàng
                  </button>

                  <button
                    className="remove"
                    onClick={() => handleRemoveWishlist(item.product_id)}
                  >
                    Xóa yêu thích
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wishlist-empty">
            <p>Bạn chưa có sản phẩm yêu thích nào.</p>
            <Link to="/products">Tiếp tục mua sắm</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(WishlistPage);
