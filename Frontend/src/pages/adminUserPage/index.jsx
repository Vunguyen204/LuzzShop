import { memo, useEffect, useState } from "react";
import axios from "axios";
import AdminButton from "../../components/adminButton";
import "./style.scss";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [isShowForm, setIsShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    role_id: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
    } catch (error) {
      console.log("Lỗi lấy người dùng:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/roles");
      setRoles(res.data);
    } catch (error) {
      console.log("Lỗi lấy quyền:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
      fetchRoles();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      role_id: "",
    });
    setEditingId(null);
    setIsShowForm(false);
  };

  const handleEdit = (user) => {
    setEditingId(user.user_id);
    setIsShowForm(true);

    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role_id: user.role_id || "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await axios.put(`http://localhost:5000/api/users/${editingId}`, formData);

      alert("Cập nhật người dùng thành công");
      resetForm();
      fetchUsers();
    } catch (error) {
      console.log("Lỗi cập nhật người dùng:", error);
      alert("Cập nhật người dùng thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này không?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);

      alert("Xóa người dùng thành công");
      fetchUsers();
    } catch (error) {
      console.log("Lỗi xóa người dùng:", error);
      alert("Xóa người dùng thất bại");
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const keyword = searchTerm.toLowerCase();

      return (
        user.full_name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.includes(searchTerm)
      );
    })
    .filter((user) =>
      roleFilter ? Number(user.role_id) === Number(roleFilter) : true,
    );

  return (
    <div className="admin-user-page">
      <div className="admin-user-page__header">
        <h2>Quản lý người dùng</h2>
      </div>

      <div className="admin-stats">
        <div className="admin-stats__card">
          <h4>Tổng người dùng</h4>
          <p>{users.length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Admin</h4>
          <p>{users.filter((u) => u.role_name === "Admin").length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>User</h4>
          <p>{users.filter((u) => u.role_name === "User").length}</p>
        </div>
      </div>

      <div className="admin-user-page__toolbar">
        <input
          type="text"
          placeholder="Tìm theo tên, email, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả quyền</option>

          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name}
            </option>
          ))}
        </select>

        <AdminButton
          variant="ghost"
          icon="fa-rotate-left"
          onClick={() => {
            setSearchTerm("");
            setRoleFilter("");
          }}
        >
          Xóa bộ lọc
        </AdminButton>
      </div>

      {isShowForm && (
        <div className="admin-modal" role="presentation">
          <div className="admin-modal__content" role="dialog" aria-modal="true" aria-label="Biểu mẫu người dùng">
            <div className="admin-modal__header">
              <h3>Cập nhật người dùng</h3>

              <AdminButton
                icon="fa-xmark"
                iconOnly
                variant="ghost"
                onClick={resetForm}
                aria-label="Đóng biểu mẫu"
                title="Đóng"
              >
              </AdminButton>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form__row">
                <label>Họ tên</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>SĐT</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label>Địa chỉ</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label>Quyền</label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn quyền --</option>

                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form__actions">
                <AdminButton variant="primary" icon="fa-floppy-disk" type="submit" loading={isSaving}>
                  Cập nhật
                </AdminButton>

                <AdminButton
                  variant="secondary"
                  icon="fa-xmark"
                  onClick={resetForm}
                >
                  Hủy
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Địa chỉ</th>
            <th>Ngày tạo</th>
            <th>Quyền</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.user_id}>
              <td>{user.user_id}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.phone || "-"}</td>
              <td>{user.address || "-"}</td>
              <td>{new Date(user.created_at).toLocaleDateString("vi-VN")}</td>
              <td>
                <span
                  className={`admin-role-badge ${
                    user.role_name === "Admin"
                      ? "admin-role-badge--admin"
                      : "admin-role-badge--user"
                  }`}
                >
                  {user.role_name}
                </span>
              </td>
              <td>
                <div className="admin-actions">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon="fa-pen"
                    onClick={() => handleEdit(user)}
                    aria-label={`Sửa người dùng ${user.full_name || user.email}`}
                  >
                    Sửa
                  </AdminButton>

                  {user.user_id !== currentUser?.user_id && (
                    <AdminButton
                      variant="danger"
                      size="sm"
                      icon="fa-trash-can"
                      onClick={() => handleDelete(user.user_id)}
                      aria-label={`Xóa người dùng ${user.full_name || user.email}`}
                    >
                      Xóa
                    </AdminButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default memo(AdminUserPage);
