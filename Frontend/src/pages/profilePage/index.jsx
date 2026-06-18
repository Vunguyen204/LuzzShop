import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";

const ProfilePage = () => {
  const [user] = useState(() => {
    const currentUser = localStorage.getItem("user");
    return currentUser ? JSON.parse(currentUser) : null;
  });
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

            <button>SỬA THÔNG TIN</button>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-order">
                      Không có đơn hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProfilePage);
