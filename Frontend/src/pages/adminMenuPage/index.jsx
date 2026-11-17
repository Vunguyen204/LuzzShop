import { memo, useEffect, useState } from "react";
import axios from "axios";
import AdminButton from "../../components/adminButton";
import "./style.scss";

const AdminMenuPage = () => {
  const [menus, setMenus] = useState([]);
  const [isShowForm, setIsShowForm] = useState(false);
  const [formData, setFormData] = useState({
    menu_name: "",
    slug: "",
    ordering: "",
    status: 1,
  });
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMenus = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/menus");
      setMenus(res.data);
    } catch (error) {
      console.log("Lỗi lấy menu:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMenus();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setFormData({
      menu_name: "",
      slug: "",
      ordering: "",
      status: 1,
    });
    setEditingId(null);
    setIsShowForm(false);
  };

  const handleShowAddForm = () => {
    setFormData({
      menu_name: "",
      slug: "",
      ordering: "",
      status: 1,
    });
    setEditingId(null);
    setIsShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "ordering" || name === "status" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/menus/${editingId}`,
          formData,
        );
        alert("Cập nhật menu thành công");
      } else {
        await axios.post("http://localhost:5000/api/menus", formData);
        alert("Thêm menu thành công");
      }

      resetForm();
      fetchMenus();
    } catch (error) {
      console.log("Lỗi lưu menu:", error);
      alert("Lưu menu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (menu) => {
    setEditingId(menu.menu_id);
    setIsShowForm(true);

    setFormData({
      menu_name: menu.menu_name,
      slug: menu.slug,
      ordering: menu.ordering,
      status: menu.status,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa menu này không?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/menus/${id}`);
      alert("Xóa menu thành công");
      fetchMenus();
    } catch (error) {
      console.log("Lỗi xóa menu:", error);
      alert("Xóa menu thất bại");
    }
  };

  return (
    <div className="admin-menu-page">
      <div className="admin-menu-page__header">
        <h2>Quản lý Menu</h2>

        {!isShowForm && (
          <AdminButton
            variant="primary"
            icon="fa-plus"
            onClick={handleShowAddForm}
          >
            Thêm menu
          </AdminButton>
        )}
      </div>

      {isShowForm && (
        <div className="admin-modal" role="presentation">
          <div className="admin-modal__content" role="dialog" aria-modal="true" aria-label="Biểu mẫu menu">
            <div className="admin-modal__header">
              <h3>{editingId ? "Cập nhật Menu" : "Thêm Menu"}</h3>

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
                <label>Tên menu</label>
                <input
                  type="text"
                  name="menu_name"
                  value={formData.menu_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Thứ tự</label>
                <input
                  type="number"
                  name="ordering"
                  value={formData.ordering}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value={1}>Hiển thị</option>
                  <option value={0}>Ẩn</option>
                </select>
              </div>

              <div className="admin-form__actions">
                <AdminButton variant="primary" icon="fa-floppy-disk" type="submit" loading={isSaving}>
                  {editingId ? "Cập nhật" : "Lưu menu"}
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

      <div className="admin-stats">
        <div className="admin-stats__card">
          <h4>Tổng menu</h4>
          <p>{menus.length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Đang hiển thị</h4>
          <p>{menus.filter((m) => Number(m.status) === 1).length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Đang ẩn</h4>
          <p>{menus.filter((m) => Number(m.status) === 0).length}</p>
        </div>
      </div>

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên menu</th>
            <th>Slug</th>
            <th>Thứ tự</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {menus.map((menu) => (
            <tr key={menu.menu_id}>
              <td>{menu.menu_id}</td>
              <td>{menu.menu_name}</td>
              <td>{menu.slug}</td>
              <td>{menu.ordering}</td>

              <td>
                <span
                  className={`admin-status ${
                    Number(menu.status) === 1
                      ? "admin-status--active"
                      : "admin-status--inactive"
                  }`}
                >
                  {Number(menu.status) === 1 ? "Hiển thị" : "Ẩn"}
                </span>
              </td>

              <td>
                <div className="admin-actions">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon="fa-pen"
                    onClick={() => handleEdit(menu)}
                    aria-label={`Sửa menu ${menu.menu_name}`}
                  >
                    Sửa
                  </AdminButton>

                  <AdminButton
                    variant="danger"
                    size="sm"
                    icon="fa-trash-can"
                    onClick={() => handleDelete(menu.menu_id)}
                    aria-label={`Xóa menu ${menu.menu_name}`}
                  >
                    Xóa
                  </AdminButton>
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

export default memo(AdminMenuPage);
