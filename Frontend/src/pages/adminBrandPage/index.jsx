import { memo, useEffect, useState } from "react";
import axios from "axios";
import AdminButton from "../../components/adminButton";
import "./style.scss";

const AdminBrandPage = () => {
  const [brands, setBrands] = useState([]);
  const [isShowForm, setIsShowForm] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: "",
    slug: "",
    status: 1,
  });
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchbrands = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/brands");
      setBrands(res.data);
    } catch (error) {
      console.log("Lỗi lấy thương hiệu:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchbrands();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setFormData({
      brand_name: "",
      slug: "",
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
    setIsSaving(true);

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/brands/${editingId}`,
          formData,
        );
        alert("Cập nhật thương hiệu thành công");
      } else {
        await axios.post("http://localhost:5000/api/brands", formData);
        alert("Thêm thương hiệu thành công");
      }

      resetForm();
      fetchbrands();
    } catch (error) {
      console.log("Lỗi lưu thương hiệu:", error);
      alert("Lưu thương hiệu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingId(brand.brand_id);
    setIsShowForm(true);

    setFormData({
      brand_name: brand.brand_name,
      slug: brand.slug,
      status: brand.status,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa thương hiệu này không?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/brands/${id}`);
      alert("Xóa thương hiệu thành công");
      fetchbrands();
    } catch (error) {
      console.log("Lỗi xóa thương hiệu:", error);
      alert("Xóa thương hiệu thất bại");
    }
  };

  return (
    <div className="admin-brand-page">
      <div className="admin-brand-page__header">
        <h2>Quản lý thương hiệu</h2>

        {!isShowForm && (
          <AdminButton
            variant="primary"
            icon="fa-plus"
            onClick={handleShowAddForm}
          >
            Thêm thương hiệu
          </AdminButton>
        )}
      </div>

      {isShowForm && (
        <div className="admin-modal" role="presentation">
          <div className="admin-modal__content" role="dialog" aria-modal="true" aria-label="Biểu mẫu thương hiệu">
            <div className="admin-modal__header">
              <h3>{editingId ? "Cập nhật thương hiệu" : "Thêm thương hiệu"}</h3>

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
                <label>Tên thương hiệu</label>
                <input
                  type="text"
                  name="brand_name"
                  value={formData.brand_name}
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
                  {editingId ? "Cập nhật" : "Lưu thương hiệu"}
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
          <h4>Tổng thương hiệu</h4>
          <p>{brands.length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Thương hiệu đang hiển thị</h4>
          <p>{brands.filter((b) => Number(b.status) === 1).length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Thương hiệu đang ẩn</h4>
          <p>{brands.filter((b) => Number(b.status) === 0).length}</p>
        </div>

        {/* <div className="admin-stats__card">
          <h4>Có sản phẩm</h4>
          <p>{brands.filter((b) => Number(b.product_count) > 0).length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Chưa sử dụng</h4>
          <p>{brands.filter((b) => Number(b.product_count) === 0).length}</p>
        </div> */}
      </div>

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên thương hiệu</th>
            <th>Slug</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {brands.map((brand) => (
            <tr key={brand.brand_id}>
              <td>{brand.brand_id}</td>
              <td>{brand.brand_name}</td>
              <td>{brand.slug}</td>

              <td>
                <span
                  className={`admin-status ${
                    Number(brand.status) === 1
                      ? "admin-status--active"
                      : "admin-status--inactive"
                  }`}
                >
                  {Number(brand.status) === 1 ? "Hiển thị" : "Ẩn"}
                </span>
              </td>

              <td>
                <div className="admin-actions">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon="fa-pen"
                    onClick={() => handleEdit(brand)}
                    aria-label={`Sửa thương hiệu ${brand.brand_name}`}
                  >
                    Sửa
                  </AdminButton>

                  <AdminButton
                    variant="danger"
                    size="sm"
                    icon="fa-trash-can"
                    onClick={() => handleDelete(brand.brand_id)}
                    aria-label={`Xóa thương hiệu ${brand.brand_name}`}
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

export default memo(AdminBrandPage);
