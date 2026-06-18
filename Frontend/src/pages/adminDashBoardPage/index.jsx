import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";

const DashBoardPage = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [revenueByMonth, setRevenueByMonth] = useState([]);

  const [dashboard, setDashboard] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/dashboard/")
      .then((res) => {
        setDashboard(res.data);
      })
      .catch((err) => {
        console.log("Lỗi lấy dashboard:", err);
      });

    axios
      .get("http://localhost:5000/api/dashboard/recent-orders")
      .then((res) => {
        setRecentOrders(res.data);
      })
      .catch((err) => {
        console.log("Lỗi lấy đơn hàng:", err);
      });

    axios
      .get("http://localhost:5000/api/dashboard/revenue-by-month")
      .then((res) => {
        setRevenueByMonth(res.data);
      })
      .catch((err) => {
        console.log("Lỗi lấy doanh thu theo tháng:", err);
      });
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case "Pending":
        return "Chờ xử lý";
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
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>Trang quản trị</h1>
        <span>Xin chào, {user?.full_name || "Admin"}</span>
      </div>

      <div className="admin-dashboard__cards">
        <div className="admin-dashboard__card">
          <h3>Sản phẩm</h3>
          <p>{dashboard.totalProducts}</p>
        </div>

        <div className="admin-dashboard__card">
          <h3>Đơn hàng</h3>
          <p>{dashboard.totalOrders}</p>
        </div>

        <div className="admin-dashboard__card">
          <h3>Người dùng</h3>
          <p>{dashboard.totalUsers}</p>
        </div>

        <div className="admin-dashboard__card">
          <h3>Doanh thu</h3>
          <p>{Number(dashboard.totalRevenue).toLocaleString()}đ</p>
        </div>
      </div>

      <div className="admin-dashboard__table-box">
        <h2>Đơn hàng gần đây</h2>

        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.order_id}>
                <td>#DH{order.order_id}</td>
                <td>{order.full_name}</td>
                <td>
                  {new Date(order.order_date).toLocaleDateString("vi-VN")}
                </td>
                <td>{Number(order.total_amount).toLocaleString()}đ</td>
                <td>
                  <span
                    className={`admin-dashboard__status admin-dashboard__status--${order.status.toLowerCase()}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-dashboard__table-box">
        <h2>Doanh thu theo tháng</h2>

        <table>
          <thead>
            <tr>
              <th>Tháng</th>
              <th>Số đơn hoàn thành</th>
              <th>Doanh thu</th>
            </tr>
          </thead>

          <tbody>
            {revenueByMonth.map((item) => (
              <tr key={`${item.month}-${item.year}`}>
                <td>
                  Tháng {item.month}/{item.year}
                </td>
                <td>{item.totalOrders}</td>
                <td>{Number(item.revenue).toLocaleString()}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(DashBoardPage);
