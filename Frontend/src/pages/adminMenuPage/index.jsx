import { memo, useEffect, useState } from "react";
import axios from "axios";
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          <button
            className="admin-menu-page__btn-add"
            onClick={handleShowAddForm}
          >
            Thêm menu
          </button>
        )}
      </div>

      {isShowForm && (
        <div className="admin-menu-modal">
          <div className="admin-menu-modal__content">
            <div className="admin-menu-modal__header">
              <h3>{editingId ? "Cập nhật Menu" : "Thêm Menu"}</h3>

              <button
                className="admin-menu-modal__close"
                onClick={resetForm}
                type="button"
              >
                ×
              </button>
            </div>

            <form className="admin-menu-form" onSubmit={handleSubmit}>
              <div className="admin-menu-form__row">
                <label>Tên menu</label>
                <input
                  type="text"
                  name="menu_name"
                  value={formData.menu_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-menu-form__row">
                <label>Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-menu-form__row">
                <label>Thứ tự</label>
                <input
                  type="number"
                  name="ordering"
                  value={formData.ordering}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-menu-form__row">
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

              <div className="admin-menu-form__actions">
                <button className="admin-menu-page__btn-add" type="submit">
                  {editingId ? "Cập nhật" : "Lưu menu"}
                </button>

                <button
                  type="button"
                  className="admin-menu-page__btn-cancel"
                  onClick={resetForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="admin-menu-table">
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
                  className={`admin-menu-status ${
                    Number(menu.status) === 1
                      ? "admin-menu-status--active"
                      : "admin-menu-status--inactive"
                  }`}
                >
                  {Number(menu.status) === 1 ? "Hiển thị" : "Ẩn"}
                </span>
              </td>

              <td>
                <div className="admin-menu-actions">
                  <button
                    className="admin-menu-actions__edit"
                    onClick={() => handleEdit(menu)}
                  >
                    Sửa
                  </button>

                  <button
                    className="admin-menu-actions__delete"
                    onClick={() => handleDelete(menu.menu_id)}
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(AdminMenuPage);
