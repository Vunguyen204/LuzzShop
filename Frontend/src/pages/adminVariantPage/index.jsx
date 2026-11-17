import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCallback } from "react";
import axios from "axios";
import AdminButton from "../../components/adminButton";
import "./style.scss";

function AdminVariantPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isShowForm, setIsShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
    try {
      const res = await axios.get(
        `http://localhost:5000/api/products/${productId}`,
      );
      setProduct(res.data);
    } catch (error) {
      console.error("Không thể tải thông tin sản phẩm:", error);
      setLoadError("Không thể tải thông tin biến thể. Vui lòng thử lại.");
    }
  }, [productId]);

  const fetchVariants = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const res = await axios.get(
        `http://localhost:5000/api/product-variants/${productId}`,
      );
      setVariants(res.data);
    } catch (error) {
      console.error("Không thể tải danh sách biến thể:", error);
      setLoadError("Không thể tải thông tin biến thể. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProduct();
      fetchVariants();
    }, 0);

    return () => clearTimeout(timer);
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
    setIsSaving(true);

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
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa biến thể này không?")) return;
    setDeletingId(id);

    try {
      await axios.delete(`http://localhost:5000/api/product-variants/${id}`);
      alert("Xóa biến thể thành công");
      fetchVariants();
    } catch (error) {
      console.log("Lỗi xóa biến thể:", error);
      alert("Xóa biến thể thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const totalStock = variants.reduce(
    (total, variant) => total + Number(variant.stock || 0),
    0,
  );
  const outOfStockCount = variants.filter(
    (variant) => Number(variant.stock) <= 0,
  ).length;

  return (
    <div className="admin-variant-page">
      <div className="admin-variant-page__header">
        <div>
          <h2>Quản lý biến thể</h2>
          <p>Thiết lập màu sắc, kích thước, hình ảnh và tồn kho.</p>
        </div>

        <div className="admin-variant-page__header-actions">
          <AdminButton variant="secondary" icon="fa-arrow-left" onClick={() => navigate("/admin/products")}>
            Quay lại
          </AdminButton>
          <AdminButton variant="primary" icon="fa-plus" onClick={() => setIsShowForm(true)}>
            Thêm biến thể
          </AdminButton>
        </div>
      </div>

      <section className="admin-variant-product" aria-label="Sản phẩm đang quản lý">
        <div className="admin-variant-product__image">
          {product?.image_url ? (
            <img src={getImageUrl(product.image_url)} alt={product.product_name} />
          ) : (
            <i className="fa-regular fa-image" aria-hidden="true" />
          )}
        </div>
        <div className="admin-variant-product__info">
          <span>Sản phẩm đang quản lý</span>
          <h3>{product?.product_name || "Đang tải thông tin sản phẩm..."}</h3>
          <p>{product?.sku ? `SKU: ${product.sku}` : "Chưa có mã SKU"}</p>
        </div>
        <dl className="admin-variant-product__stats">
          <div>
            <dt>Biến thể</dt>
            <dd>{variants.length}</dd>
          </div>
          <div>
            <dt>Tổng tồn kho</dt>
            <dd>{totalStock}</dd>
          </div>
          <div>
            <dt>Hết hàng</dt>
            <dd>{outOfStockCount}</dd>
          </div>
        </dl>
      </section>

      <div className="admin-variant-page__section-heading">
        <div>
          <h3>Danh sách biến thể</h3>
          <p>{variants.length} biến thể của sản phẩm</p>
        </div>
      </div>

      {isShowForm && (
        <div className="admin-modal" role="presentation">
          <div className="admin-modal__content admin-variant-modal" role="dialog" aria-modal="true" aria-labelledby="variant-form-title">
            <div className="admin-modal__header">
              <div>
                <h3 id="variant-form-title">{editingId ? "Cập nhật biến thể" : "Thêm biến thể"}</h3>
                <p>Nhập thông tin phân loại và số lượng tồn kho.</p>
              </div>
              <AdminButton icon="fa-xmark" iconOnly variant="ghost" onClick={resetForm} aria-label="Đóng biểu mẫu" title="Đóng" />
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form__row">
                <label htmlFor="variant-color">Màu sắc</label>
                <input
                  id="variant-color"
                  type="text"
                  placeholder="Ví dụ: Xanh lá"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="variant-size">Kích thước</label>
                <input
                  id="variant-size"
                  type="text"
                  placeholder="Ví dụ: M, L hoặc 40"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="variant-stock">Số lượng tồn kho</label>
                <input
                  id="variant-stock"
                  type="number"
                  min="0"
                  placeholder="Nhập số lượng"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="variant-image">Ảnh biến thể</label>
                <div className="variant-upload">
                  <label className="variant-upload__picker" htmlFor="variant-image">
                    <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                    <span>Chọn ảnh từ máy</span>
                    <small>PNG, JPG hoặc WEBP</small>
                  </label>
                  <input
                    id="variant-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />

                  {(selectedFile || formData.image_url) && (
                    <div className="variant-upload__preview">
                      <img
                        src={selectedFile ? URL.createObjectURL(selectedFile) : getImageUrl(formData.image_url)}
                        alt="Xem trước ảnh biến thể"
                        className="variant-preview"
                      />
                      <span>{selectedFile?.name || "Ảnh hiện tại"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-form__actions">
                <AdminButton variant="primary" icon="fa-floppy-disk" type="submit" loading={isSaving}>
                  {editingId ? "Cập nhật" : "Lưu biến thể"}
                </AdminButton>

                <AdminButton variant="secondary" icon="fa-xmark" onClick={resetForm}>
                  Hủy
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
      {isLoading ? (
        <div className="admin-loading-state" role="status">Đang tải danh sách biến thể...</div>
      ) : loadError ? (
        <div className="admin-error-state" role="alert">
          <p>{loadError}</p>
          <AdminButton variant="secondary" icon="fa-rotate-right" onClick={() => { fetchProduct(); fetchVariants(); }}>Thử lại</AdminButton>
        </div>
      ) : variants.length === 0 ? (
        <div className="admin-empty-state">
          <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
          <h3>Chưa có biến thể</h3>
          <p>Thêm biến thể đầu tiên để quản lý màu sắc, kích thước và tồn kho.</p>
          <AdminButton variant="primary" icon="fa-plus" onClick={() => setIsShowForm(true)}>Thêm biến thể</AdminButton>
        </div>
      ) : (
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
                    loading="lazy"
                  />
                )}
              </td>
              <td><strong>{variant.color}</strong></td>
              <td><span className="variant-size-badge">{variant.size || "Không có"}</span></td>
              <td>
                <span className={`variant-stock ${Number(variant.stock) <= 0 ? "variant-stock--empty" : ""}`}>
                  {variant.stock}
                </span>
              </td>
              <td>
                <div className="admin-actions">
                <AdminButton variant="secondary" size="sm" icon="fa-pen" onClick={() => handleEdit(variant)} aria-label={`Sửa biến thể ${variant.color}`}>
                  Sửa
                </AdminButton>
                <AdminButton variant="danger" size="sm" icon="fa-trash-can" loading={deletingId === variant.variant_id} onClick={() => handleDelete(variant.variant_id)} aria-label={`Xóa biến thể ${variant.color}`}>
                  Xóa
                </AdminButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      </div>
    </div>
  );
}

export default AdminVariantPage;
