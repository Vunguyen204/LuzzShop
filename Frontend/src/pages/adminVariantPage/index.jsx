import { useEffect, useState } from "react";
import { useNavigate, useParams, useCallback } from "react-router-dom";
import axios from "axios";
import "./style.scss";

function AdminVariantPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isShowForm, setIsShowForm] = useState(false);

  const [formData, setFormData] = useState({
    color: "",
    size: "",
    stock: "",
    image_url: "",
  });

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "";

    if (imageUrl.startsWith("/uploads")) {
      return `http://localhost:5000${imageUrl}`;
    }

    return `http://localhost:5000/uploads/products/${product?.brand_slug}/${imageUrl}`;
  };

  const fetchProduct = useCallback(async () => {
    const res = await axios.get(
      `http://localhost:5000/api/products/${productId}`,
    );
    setProduct(res.data);
  }, [productId]);

  const fetchVariants = useCallback(async () => {
    const res = await axios.get(
      `http://localhost:5000/api/product-variants/${productId}`,
    );
    setVariants(res.data);
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    fetchVariants();
  }, [fetchProduct, fetchVariants]);

  const resetForm = () => {
    setFormData({
      color: "",
      size: "",
      stock: "",
      image_url: "",
    });
    setSelectedFile(null);
    setEditingId(null);
    setIsShowForm(false);
  };

  const handleEdit = (variant) => {
    setEditingId(variant.variant_id);
    setIsShowForm(true);
    setSelectedFile(null);

    setFormData({
      color: variant.color || "",
      size: variant.size || "",
      stock: variant.stock || "",
      image_url: variant.image_url || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = formData.image_url;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("brand_slug", product.brand_slug);
        uploadData.append("image", selectedFile);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/product-variants/upload/image",
          uploadData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        imageUrl = uploadRes.data.image_url;
      }

      const payload = {
        product_id: productId,
        color: formData.color,
        size: formData.size,
        stock: formData.stock,
        image_url: imageUrl,
      };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/product-variants/${editingId}`,
          payload,
        );
        alert("Cập nhật biến thể thành công");
      } else {
        await axios.post("http://localhost:5000/api/product-variants", payload);
        alert("Thêm biến thể thành công");
      }

      resetForm();
      fetchVariants();
    } catch (error) {
      console.log("Lỗi lưu biến thể:", error);
      alert("Lưu biến thể thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa biến thể này không?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/product-variants/${id}`);
      alert("Xóa biến thể thành công");
      fetchVariants();
    } catch (error) {
      console.log("Lỗi xóa biến thể:", error);
      alert("Xóa biến thể thất bại");
    }
  };

  return (
    <div className="admin-variant-page">
      <div className="admin-variant-page__header">
        <div>
          <h2>Quản lý biến thể</h2>
          <p>{product?.product_name}</p>
        </div>

        <div>
          <button onClick={() => navigate("/admin/products")}>Quay lại</button>
          <button onClick={() => setIsShowForm(true)}>Thêm biến thể</button>
        </div>
      </div>

      {isShowForm && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{editingId ? "Cập nhật biến thể" : "Thêm biến thể"}</h3>
              <button type="button" onClick={resetForm}>
                ×
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form__row">
                <label>Màu</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Size</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
              </div>

              <div className="admin-form__row">
                <label>Tồn kho</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Ảnh biến thể</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />

                {selectedFile && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt=""
                    className="variant-preview"
                  />
                )}
              </div>

              <div className="admin-form__actions">
                <button type="submit">
                  {editingId ? "Cập nhật" : "Lưu biến thể"}
                </button>

                <button type="button" onClick={resetForm}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ảnh</th>
            <th>Màu</th>
            <th>Size</th>
            <th>Tồn kho</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {variants.map((variant) => (
            <tr key={variant.variant_id}>
              <td>{variant.variant_id}</td>
              <td>
                {variant.image_url && (
                  <img
                    className="admin-table__image"
                    src={getImageUrl(variant.image_url)}
                    alt={variant.color}
                  />
                )}
              </td>
              <td>{variant.color}</td>
              <td>{variant.size || "-"}</td>
              <td>{variant.stock}</td>
              <td>
                <button onClick={() => handleEdit(variant)}>Sửa</button>
                <button onClick={() => handleDelete(variant.variant_id)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminVariantPage;
