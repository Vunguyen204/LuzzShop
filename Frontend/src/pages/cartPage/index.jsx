import { useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import "./style.scss";

function CartPage() {
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  });

  const updateQuantity = (productId, quantity) => {
    const item = cartItems.find((item) => item.product_id === productId);

    if (!item) return;

    const newQuantity = Number(quantity);
    const stock = Number(item.stock || 0);

    if (!stock) {
      alert("Sản phẩm chưa có thông tin tồn kho");
      return;
    }

    if (!newQuantity || newQuantity < 1) {
      return;
    }

    if (newQuantity > stock) {
      alert(`Chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }

    const newCart = cartItems.map((item) =>
      item.product_id === productId ? { ...item, quantity: newQuantity } : item,
    );

    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeItem = (productId) => {
    const newCart = cartItems.filter((item) => item.product_id !== productId);

    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  return (
    <div className="cart-page">
      <Breadcrumb />

      <div className="cart-container">
        <h2>Giỏ hàng của bạn</h2>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Giỏ hàng đang trống.</p>
            <button className="continue-btn">
              <Link to="/products">Tiếp tục mua hàng</Link>
            </button>
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
                {cartItems.map((item) => (
                  <tr key={item.product_id}>
                    <td className="product-info">
                      <img src={`http://localhost:5000${item  .image_url}`} alt={item.product_name} />
                      <span>
                        <Link to={`/products/${item.product_id}`}>
                          {item.product_name}
                        </Link>
                      </span>
                    </td>

                    <td>{Number(item.price).toLocaleString()}đ</td>

                    <td>
                      <div className="quantity-box">
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity - 1)
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
                            updateQuantity(
                              item.product_id,
                              Number(e.target.value),
                            )
                          }
                        />

                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="total-price">
                      {(Number(item.price) * item.quantity).toLocaleString()}đ
                    </td>

                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.product_id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
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
