import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";

const ProfilePage = () => {
  const [user] = useState(() => {
    const currentUser = localStorage.getItem("user");
    return currentUser ? JSON.parse(currentUser) : null;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${user.user_id}`,
        formData,
      );

      const newUser = {
        ...user,
        ...formData,
      };

      localStorage.setItem("user", JSON.stringify(newUser));
      alert("Cập nhật thông tin thành công");
      window.location.reload();
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
      alert(error.response?.data?.message || "Cập nhật thông tin thất bại");
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case "Pending":
        return "Chờ xác nhận";

      case "Confirmed":
        return "Đã xác nhận";

      case "Shipping":
        return "Đang giao";

      case "Completed":
        return "Hoàn thành";

      case "Cancelled":
        return "Đã hủy";

      default:
        return status;
    }
  };
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleViewOrder = async (order) => {
    try {
      setSelectedOrder(order);

      const res = await axios.get(
        `http://localhost:5000/api/orders/${order.order_id}/detail`,
      );

      setOrderDetails(res.data);
    } catch (error) {
      console.log("Lỗi lấy chi tiết đơn hàng:", error);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;

    try {
      await axios.patch(
        `http://localhost:5000/api/orders/${order.order_id}/cancel`,
        {
          user_id: user.user_id,
        },
      );

      alert("Hủy đơn hàng thành công");

      setOrders((prev) =>
        prev.map((item) =>
          item.order_id === order.order_id
            ? { ...item, status: "Cancelled" }
            : item,
        ),
      );
    } catch (error) {
      alert(error.response?.data?.message || "Hủy đơn hàng thất bại");
    }
  };

  useEffect(() => {
    if (!user?.user_id) return;

    axios
      .get(`http://localhost:5000/api/orders/user/${user.user_id}`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.log(err));
  }, [user]);

  return (
    <div className="profile-page">
      <div className="container">
        <h2>THÔNG TIN TÀI KHOẢN</h2>

        <p className="hello">
          Xin chào, <span>{user?.full_name || user?.name}</span>
        </p>

        <div className="profile-content">
          <div className="customer-info">
            <h3>THÔNG TIN KHÁCH HÀNG</h3>

            {isEditing ? (
              <>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Họ tên"
                />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại"
                />

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ"
                />

                <button onClick={handleUpdateProfile}>LƯU THÔNG TIN</button>
                <button onClick={() => setIsEditing(false)}>HỦY</button>
              </>
            ) : (
              <>
                <p>
                  <i className="fa-solid fa-user"></i>
                  <strong> Họ tên:</strong> {user?.full_name || user?.name}
                </p>

                <p>
                  <i className="fa-solid fa-phone"></i>
                  <strong> Số ĐT:</strong> {user?.phone}
                </p>

                <p>
                  <i className="fa-solid fa-location-dot"></i>
                  <strong> Địa chỉ:</strong> {user?.address || ""}
                </p>

                <button onClick={() => setIsEditing(true)}>
                  SỬA THÔNG TIN
                </button>
              </>
            )}
          </div>

          <div className="order-info">
            <h3>ĐƠN HÀNG CỦA BẠN</h3>

            <table>
              <thead>
                <tr>
                  <th>Đơn hàng</th>
                  <th>Ngày</th>
                  <th>Địa chỉ</th>
                  <th>Giá trị</th>
                  <th>Tình trạng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>{order.shipping_address}</td>
                      <td>{Number(order.total_amount).toLocaleString()}đ</td>
                      <td>
                        <span
                          className={`status ${order.status.toLowerCase()}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="order-actions">
                          <button
                            className="btn-view-order"
                            onClick={() => handleViewOrder(order)}
                          >
                            Xem
                          </button>

                          {order.status === "Pending" && (
                            <button
                              className="btn-cancel-order"
                              onClick={() => handleCancelOrder(order)}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-order">
                      Không có đơn hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {selectedOrder && (
              <div className="order-detail-modal">
                <div className="order-detail-modal__content">
                  <button
                    className="order-detail-modal__close"
                    onClick={() => {
                      setSelectedOrder(null);
                      setOrderDetails([]);
                    }}
                  >
                    ×
                  </button>

                  <h3>CHI TIẾT ĐƠN HÀNG #{selectedOrder.order_id}</h3>

                  <p>
                    <strong>Người đặt:</strong>{" "}
                    {user?.full_name || user?.name}{" "}
                  </p>
                  <p>
                    <strong>Số điện thoại:</strong> {user?.phone}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong> {selectedOrder.shipping_address}
                  </p>
                  <p>
                    <strong>Ngày đặt:</strong>{" "}
                    {new Date(selectedOrder.order_date).toLocaleDateString()}
                  </p>

                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    {getStatusText(selectedOrder.status)}
                  </p>

                  <table className="order-detail-table">
                    <thead>
                      <tr>
                        <th>Ảnh</th>
                        <th>Sản phẩm</th>
                        <th>SL</th>
                        <th>Giá</th>
                        <th>Tạm tính</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orderDetails.map((item) => (
                        <tr key={item.order_detail_id}>
                          <td>
                            <img
                              src={`http://localhost:5000/uploads/products/${item.brand_slug}/${item.image_url}`}
                              alt={item.product_name}
                            />
                          </td>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{Number(item.price).toLocaleString()}đ</td>
                          <td>
                            {(
                              Number(item.price) * Number(item.quantity)
                            ).toLocaleString()}
                            đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4>
                    Tổng tiền:{" "}
                    {Number(selectedOrder.total_amount).toLocaleString()}đ
                  </h4>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProfilePage);
