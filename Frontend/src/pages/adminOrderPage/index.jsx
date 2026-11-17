import { memo, useEffect, useState } from "react";
import axios from "axios";
import AdminButton from "../../components/adminButton";
import "./style.scss";

const AdminOrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      setOrders(res.data);
    } catch (error) {
      console.log("Lỗi lấy đơn hàng:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleViewOrder = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${id}`);
      setSelectedOrder(res.data.order);
      setOrderItems(res.data.items);
    } catch (error) {
      console.log("Lỗi lấy chi tiết đơn hàng:", error);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/status`, {
        status,
      });

      fetchOrders();
      handleViewOrder(id);
      alert("Cập nhật trạng thái thành công");
    } catch (error) {
      console.log("Lỗi cập nhật trạng thái:", error);
      alert("Cập nhật trạng thái thất bại");
    }
  };

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

  const filteredOrders = orders.filter((order) => {
    const keyword = searchTerm.toLowerCase();

    const matchSearch =
      order.full_name?.toLowerCase().includes(keyword) ||
      order.phone?.includes(searchTerm) ||
      String(order.order_id).includes(searchTerm);

    const matchStatus = statusFilter ? order.status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-order-page">
      <div className="admin-order-page__header">
        <h2>Quản lý đơn hàng</h2>
      </div>

      <div className="admin-stats">
        <div className="admin-stats__card">
          <h4>Tổng đơn hàng</h4>
          <p>{orders.length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Chờ xử lý</h4>
          <p>{orders.filter((o) => o.status === "Pending").length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Hoàn thành</h4>
          <p>{orders.filter((o) => o.status === "Completed").length}</p>
        </div>
      </div>

      <div className="admin-order-page__toolbar">
        <input
          type="text"
          placeholder="Tìm theo mã đơn, tên khách hàng, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Sắp xếp</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="Confirmed">Đã xác nhận</option>
          <option value="Shipping">Đang giao</option>
          <option value="Completed">Hoàn thành</option>
          <option value="Cancelled">Đã hủy</option>
        </select>

        <AdminButton
          variant="ghost"
          icon="fa-rotate-left"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
          }}
        >
          Xóa bộ lọc
        </AdminButton>
      </div>

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Tổng tiền</th>
            <th>Thanh toán</th>
            <th>Ngày đặt</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.order_id}>
              <td>#DH{order.order_id}</td>
              <td>{order.full_name}</td>
              <td>{order.phone}</td>
              <td>{Number(order.total_amount).toLocaleString()}đ</td>
              <td>{order.payment_method}</td>
              <td>{new Date(order.order_date).toLocaleDateString("vi-VN")}</td>
              <td>
                <span
                  className={`admin-status admin-status--${order.status.toLowerCase()}`}
                >
                  {getStatusText(order.status)}
                </span>
              </td>
              <td>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  icon="fa-eye"
                  onClick={() => handleViewOrder(order.order_id)}
                  aria-label={`Xem chi tiết đơn hàng ${order.order_id}`}
                >
                  Chi tiết
                </AdminButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {selectedOrder && (
        <div className="admin-modal" role="presentation">
          <div className="admin-modal__content" role="dialog" aria-modal="true" aria-label="Chi tiết đơn hàng">
            <div className="admin-modal__header">
              <h3>Chi tiết đơn hàng #DH{selectedOrder.order_id}</h3>

              <AdminButton
                icon="fa-xmark"
                iconOnly
                variant="ghost"
                onClick={closeModal}
                aria-label="Đóng chi tiết đơn hàng"
                title="Đóng"
              >
              </AdminButton>
            </div>

            <div className="admin-order-detail">
              <div className="admin-order-detail__info">
                <p>
                  <strong>Khách hàng:</strong> {selectedOrder.full_name}
                </p>
                <p>
                  <strong>SĐT:</strong> {selectedOrder.phone}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {selectedOrder.shipping_address}
                </p>
                <p>
                  <strong>Ghi chú:</strong> {selectedOrder.note || "Không có"}
                </p>
                <p>
                  <strong>Thanh toán:</strong> {selectedOrder.payment_method}
                </p>
                <p>
                  <strong>Tổng tiền:</strong>{" "}
                  {Number(selectedOrder.total_amount).toLocaleString()}đ
                </p>
              </div>

              <div className="admin-order-detail__status">
                <label>Cập nhật trạng thái</label>

                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    updateStatus(selectedOrder.order_id, e.target.value)
                  }
                >
                  <option value="Pending">Chờ xử lý</option>
                  <option value="Confirmed">Đã xác nhận</option>
                  <option value="Shipping">Đang giao</option>
                  <option value="Completed">Hoàn thành</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>

              <h4>Sản phẩm trong đơn</h4>

              <table className="admin-items-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.order_detail_id}>
                      <td>
                        {item.image_url && (
                          <img
                            src={`http://localhost:5000${item.image_url}`}
                            alt={item.product_name}
                          />
                        )}
                      </td>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{Number(item.price).toLocaleString()}đ</td>
                      <td>{Number(item.subtotal).toLocaleString()}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AdminOrderPage);
