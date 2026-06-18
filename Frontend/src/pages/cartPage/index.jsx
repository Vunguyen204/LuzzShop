import { useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import Toast from "../../components/Toast";
import "./style.scss";

function CartPage() {
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const getCartKey = (item) =>
    `${item.product_id}-${item.variant_id || "no-variant"}`;

  const updateQuantity = (cartKey, quantity) => {
    const item = cartItems.find((item) => getCartKey(item) === cartKey);
    if (!item) return;

    const newQuantity = Number(quantity);
    const stock = Number(item.stock || 0);

    if (!stock) {
      showToast("Sản phẩm chưa có thông tin tồn kho", "error");
      return;
    }

    if (!newQuantity || newQuantity < 1) return;

    if (newQuantity > stock) {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`, "warning");
      return;
    }

    const newCart = cartItems.map((item) =>
      getCartKey(item) === cartKey
        ? { ...item, quantity: newQuantity }
        : item
    );

    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (cartKey) => {
    const newCart = cartItems.filter((item) => getCartKey(item) !== cartKey);

    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    showToast("Đã xóa sản phẩm khỏi giỏ hàng", "success");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );

  return (
    <div className="cart-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Breadcrumb />

      <div className="cart-container">
        <h2>Giỏ hàng của bạn</h2>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Giỏ hàng đang trống.</p>
            <Link to="/products" className="continue-btn">
              Tiếp tục mua hàng
            </Link>
          </div>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {cartItems.map((item) => {
                  const cartKey = getCartKey(item);

                  return (
                    <tr key={cartKey}>
                      <td className="product-info">
                        <img
                          src={`http://localhost:5000${item.image_url}`}
                          alt={item.product_name}
                        />

                        <span>
                          <Link to={`/products/${item.product_id}`}>
                            {item.product_name}
                          </Link>

                          {(item.color || item.size) && (
                            <p className="variant-info">
                              Phân loại: {item.color || "Không có màu"}
                              {item.size ? ` / ${item.size}` : ""}
                            </p>
                          )}
                        </span>
                      </td>

                      <td>{Number(item.price).toLocaleString()}đ</td>

                      <td>
                        <div className="quantity-box">
                          <button
                            onClick={() =>
                              updateQuantity(cartKey, item.quantity - 1)
                            }
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(cartKey, Number(e.target.value))
                            }
                          />

                          <button
                            onClick={() =>
                              updateQuantity(cartKey, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="total-price">
                        {(
                          Number(item.price) * Number(item.quantity)
                        ).toLocaleString()}
                        đ
                      </td>

                      <td>
                        <button
                          className="remove-btn"
                          onClick={() => removeItem(cartKey)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="cart-summary">
              <h3>Tổng tiền: {totalAmount.toLocaleString()}đ</h3>

              <Link to="/checkout" className="checkout-btn">
                Thanh toán
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;