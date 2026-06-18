import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";

const AdminCategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [isShowForm, setIsShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    slug: "",
    parent_id: "",
    ordering: "",
    status: 1,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.log("Lỗi lấy danh mục:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setFormData({
      category_name: "",
      description: "",
      slug: "",
      parent_id: "",
      ordering: "",
      status: 1,
    });
    setEditingId(null);
    setIsShowForm(false);
  };

  const handleShowAddForm = () => {
    resetForm();
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
          `http://localhost:5000/api/categories/${editingId}`,
          formData,
        );
        alert("Cập nhật danh mục thành công");
      } else {
        await axios.post("http://localhost:5000/api/categories", formData);
        alert("Thêm danh mục thành công");
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      console.log("Lỗi lưu danh mục:", error);
      alert("Lưu danh mục thất bại");
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.category_id);
    setIsShowForm(true);

    setFormData({
      category_name: category.category_name,
      description: category.description || "",
      slug: category.slug,
      parent_id: category.parent_id || "",
      ordering: category.ordering,
      status: category.status,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này không?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/categories/${id}`);
      alert("Xóa danh mục thành công");
      fetchCategories();
    } catch (error) {
      console.log("Lỗi xóa danh mục:", error);
      alert("Xóa danh mục thất bại");
    }
  };

  return (
    <div className="admin-category-page">
      <div className="admin-category-page__header">
        <h2>Quản lý Danh mục</h2>

        {!isShowForm && (
          <button
            className="admin-category-page__btn-add"
            onClick={handleShowAddForm}
          >
            Thêm danh mục
          </button>
        )}
      </div>

      {isShowForm && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{editingId ? "Cập nhật Danh mục" : "Thêm Danh mục"}</h3>

              <button
                className="admin-modal__close"
                onClick={resetForm}
                type="button"
              >
                ×
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form__row">
                <label>Tên danh mục</label>
                <input
                  type="text"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
                <label>Danh mục cha</label>
                <select
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleChange}
                >
                  <option value="">Không có</option>

                  {categories
                    .filter((item) => item.category_id !== editingId)
                    .map((item) => (
                      <option key={item.category_id} value={item.category_id}>
                        {item.category_name}
                      </option>
                    ))}
                </select>
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
                <button className="admin-category-page__btn-add" type="submit">
                  {editingId ? "Cập nhật" : "Lưu danh mục"}
                </button>

                <button
                  type="button"
                  className="admin-category-page__btn-cancel"
                  onClick={resetForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-stats">
        <div className="admin-stats__card">
          <h4>Tổng danh mục</h4>
          <p>{categories.length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Danh mục đang hiển thị</h4>
          <p>{categories.filter((c) => Number(c.status) === 1).length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Danh mục đang ẩn</h4>
          <p>{categories.filter((c) => Number(c.status) === 0).length}</p>
        </div>

        {/* <div className="admin-stats__card">
          <h4>Danh mục có sản phẩm</h4>
          <p>{categories.filter((c) => Number(c.product_count) > 0).length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Danh mục trống</h4>
          <p>
            {categories.filter((c) => Number(c.product_count) === 0).length}
          </p>
        </div> */}
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên danh mục</th>
            <th>Danh mục cha</th>
            <th>Mô tả</th>
            <th>Slug</th>
            <th>Thứ tự</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((category) => (
            <tr key={category.category_id}>
              <td>{category.category_id}</td>
              <td>{category.category_name}</td>
              <td>{category.parent_name || "Không có"}</td>
              <td>{category.description}</td>
              <td>{category.slug}</td>
              <td>{category.ordering}</td>

              <td>
                <span
                  className={`admin-status ${
                    Number(category.status) === 1
                      ? "admin-status--active"
                      : "admin-status--inactive"
                  }`}
                >
                  {Number(category.status) === 1 ? "Hiển thị" : "Ẩn"}
                </span>
              </td>

              <td>
                <div className="admin-actions">
                  <button
                    className="admin-actions__edit"
                    onClick={() => handleEdit(category)}
                  >
                    Sửa
                  </button>

                  <button
                    className="admin-actions__delete"
                    onClick={() => handleDelete(category.category_id)}
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

export default memo(AdminCategoryPage);
