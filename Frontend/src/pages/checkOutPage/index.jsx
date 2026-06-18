import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import Toast from "../../components/Toast";
import "./style.scss";

function CheckoutPage() {
  const navigate = useNavigate();
  const [useDefaultInfo, setUseDefaultInfo] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const [cartItems] = useState(() => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  });

  const [formData, setFormData] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    return {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      note: "",
    };
  });

  const getCartKey = (item) =>
    `${item.product_id}-${item.variant_id || "no-variant"}`;

  const totalAmount = cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      showToast("Giỏ hàng đang trống", "error");
      return;
    }

    if (!formData.full_name || !formData.phone || !formData.address) {
      showToast("Vui lòng nhập đầy đủ thông tin giao hàng", "error");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const res = await axios.post("http://localhost:5000/api/orders", {
        user_id: user?.user_id || null,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        note: formData.note,
        total_amount: totalAmount,
        items: cartItems,
      });

      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));

      showToast(res.data.message, "success");

      setTimeout(() => {
        navigate("/products");
      }, 1200);
    } catch (error) {
      showToast(error.response?.data?.message || "Đặt hàng thất bại", "error");
    }
  };

  return (
    <div className="checkout-page">
      <Breadcrumb />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handleOrder}>
          <h2>Thông tin giao hàng</h2>

          <div className="shipping-option">
            <label>
              <input
                type="radio"
                name="shippingInfo"
                checked={useDefaultInfo}
                onChange={() => {
                  const user = JSON.parse(localStorage.getItem("user"));

                  setUseDefaultInfo(true);

                  setFormData((prev) => ({
                    ...prev,
                    full_name: user?.full_name || "",
                    phone: user?.phone || "",
                    address: user?.address || "",
                  }));
                }}
              />
              <span>Dùng thông tin mặc định</span>
            </label>

            <label>
              <input
                type="radio"
                name="shippingInfo"
                checked={!useDefaultInfo}
                onChange={() => {
                  setUseDefaultInfo(false);

                  setFormData((prev) => ({
                    ...prev,
                    full_name: "",
                    phone: "",
                    address: "",
                  }));
                }}
              />
              <span>Nhập thông tin giao hàng khác</span>
            </label>
          </div>

          <input
            type="text"
            name="full_name"
            placeholder="Họ và tên"
            value={formData.full_name}
            onChange={handleChange}
            readOnly={useDefaultInfo}
          />

          <input
            type="text"
            name="phone"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={handleChange}
            readOnly={useDefaultInfo}
          />

          <textarea
            name="address"
            placeholder="Địa chỉ giao hàng"
            value={formData.address}
            onChange={handleChange}
            readOnly={useDefaultInfo}
          />

          <textarea
            name="note"
            placeholder="Ghi chú đơn hàng"
            value={formData.note}
            onChange={handleChange}
          />

          <h3>Phương thức thanh toán</h3>

          <div className="payment-method">
            <label>
              <input type="radio" name="payment" defaultChecked />
              <span>Thanh toán khi nhận hàng - COD</span>
            </label>
          </div>

          <button type="submit">Đặt hàng</button>
        </form>

        <div className="order-summary">
          <h2>Đơn hàng của bạn</h2>

          {cartItems.map((item) => (
            <div className="order-item" key={getCartKey(item)}>
              <img
                src={`http://localhost:5000${item.image_url}`}
                alt={item.product_name}
              />

              <div>
                <h4>{item.product_name}</h4>

                {item.sku && <p>Mã: {item.sku}</p>}

                {(item.color || item.size) && (
                  <p>
                    Phân loại: {item.color || ""}
                    {item.size ? ` / ${item.size}` : ""}
                  </p>
                )}

                <p>Số lượng: {item.quantity}</p>

                <span>
                  {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                  đ
                </span>
              </div>
            </div>
          ))}

          <div className="summary-total">
            <span>Tổng tiền:</span>
            <strong>{totalAmount.toLocaleString()}đ</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;