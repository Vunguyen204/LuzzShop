import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminButton from "../../components/adminButton";
import "./style.scss";

const AdminProductPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortType, setSortType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const navigate = useNavigate();

  const [isShowForm, setIsShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    category_id: "",
    brand_id: "",
    product_name: "",
    slug: "",
    sku: "",
    description: "",
    price: "",
    old_price: "",
    image_url: "",
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const res = await axios.get("http://localhost:5000/api/products/admin");
      setProducts(res.data);
    } catch (error) {
      console.error("Không thể tải danh sách sản phẩm:", error);
      setLoadError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get("http://localhost:5000/api/categories");
    setCategories(res.data);
  };

  const fetchBrands = async () => {
    const res = await axios.get("http://localhost:5000/api/brands");
    setBrands(res.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
      fetchCategories();
      fetchBrands();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setFormData({
      category_id: "",
      brand_id: "",
      product_name: "",
      slug: "",
      sku: "",
      description: "",
      price: "",
      old_price: "",
      image_url: "",
    });

    setSelectedFile(null);
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

  const handleEdit = (product) => {
    setEditingId(product.product_id);
    setIsShowForm(true);
    setSelectedFile(null);

    setFormData({
      category_id: product.category_id,
      brand_id: product.brand_id,
      product_name: product.product_name,
      slug: product.slug,
      sku: product.sku || "",
      description: product.description || "",
      price: product.price,
      old_price: product.old_price || "",
      image_url: product.image_url?.split("/").pop() || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageName = formData.image_url;

      if (selectedFile) {
        const brand = brands.find(
          (b) => Number(b.brand_id) === Number(formData.brand_id),
        );

        if (!brand) {
          alert("Vui lòng chọn thương hiệu trước khi upload ảnh");
          return;
        }

        const uploadData = new FormData();
        uploadData.append("brand_slug", brand.slug);
        uploadData.append("image", selectedFile);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/products/upload",
          uploadData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        imageName = uploadRes.data.image_url;
      }

      const payload = {
        ...formData,
        image_url: imageName,
      };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/products/${editingId}`,
          payload,
        );
        alert("Cập nhật sản phẩm thành công");
      } else {
        await axios.post("http://localhost:5000/api/products", payload);
        alert("Thêm sản phẩm thành công");
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.log("Lỗi lưu sản phẩm:", error);
      alert("Lưu sản phẩm thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;

  //   try {
  //     await axios.delete(`http://localhost:5000/api/products/${id}`);
  //     alert("Xóa sản phẩm thành công");
  //     fetchProducts();
  //   } catch (error) {
  //     console.log("Lỗi xóa sản phẩm:", error);
  //     alert("Xóa sản phẩm thất bại");
  //   }
  // };

  const handleUpdateStatus = async (product) => {
    const newStatus = Number(product.status) === 1 ? 0 : 1;
    setUpdatingStatusId(product.product_id);

    try {
      await axios.patch(
        `http://localhost:5000/api/products/${product.product_id}/status`,
        { status: newStatus },
      );

      alert("Cập nhật trạng thái thành công");
      fetchProducts();
    } catch (error) {
      console.log("Lỗi cập nhật trạng thái:", error);
      alert("Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredProducts = [...products]
    .filter((product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((product) =>
      selectedCategory
        ? Number(product.category_id) === Number(selectedCategory)
        : true,
    )
    .filter((product) =>
      selectedBrand ? Number(product.brand_id) === Number(selectedBrand) : true,
    );

  switch (sortType) {
    case "price_asc":
      filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
      break;

    case "price_desc":
      filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
      break;

    case "stock_asc":
      filteredProducts.sort(
        (a, b) => Number(a.total_stock) - Number(b.total_stock),
      );
      break;

    case "stock_desc":
      filteredProducts.sort(
        (a, b) => Number(b.total_stock) - Number(a.total_stock),
      );
      break;

    default:
      break;
  }

  return (
    <div className="admin-product-page">
      <div className="admin-product-page__header">
        <div>
          <h2>Danh sách sản phẩm</h2>
          <p>Theo dõi thông tin, tồn kho và trạng thái kinh doanh.</p>
        </div>

        {!isShowForm && (
          <AdminButton
            variant="primary"
            icon="fa-plus"
            onClick={handleShowAddForm}
          >
            Thêm sản phẩm
          </AdminButton>
        )}
      </div>

      <div className="admin-stats">
        <div className="admin-stats__card">
          <span className="admin-stats__label">Tổng sản phẩm</span>
          <p>{products.length}</p>
        </div>

        <div className="admin-stats__card">
          <span className="admin-stats__label">Hết hàng</span>
          <p>{products.filter((p) => Number(p.total_stock) <= 0).length}</p>
        </div>

        <div className="admin-stats__card">
          <span className="admin-stats__label">Đang giảm giá</span>
          <p>
            {
              products.filter((p) => Number(p.old_price) > Number(p.price))
                .length
            }
          </p>
        </div>
      </div>

      <div className="admin-product-page__toolbar" aria-label="Bộ lọc sản phẩm">
        <label className="admin-product-page__search">
          <span className="admin-visually-hidden">Tìm sản phẩm</span>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>

        <select
          aria-label="Lọc theo danh mục"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>

          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc theo thương hiệu"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option value="">Tất cả thương hiệu</option>

          {brands.map((brand) => (
            <option key={brand.brand_id} value={brand.brand_id}>
              {brand.brand_name}
            </option>
          ))}
        </select>

        <select aria-label="Sắp xếp sản phẩm" value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="">Sắp xếp</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="stock_desc">Tồn kho nhiều nhất</option>
          <option value="stock_asc">Tồn kho ít nhất</option>
        </select>

        <AdminButton
          variant="ghost"
          icon="fa-rotate-left"
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedBrand("");
            setSortType("");
          }}
        >
          Xóa bộ lọc
        </AdminButton>
      </div>

      {isShowForm && (
        <div className="admin-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="admin-modal__content" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="admin-modal__header">
              <h3 id="product-form-title">{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h3>

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
                <label htmlFor="admin-product-name">Tên sản phẩm</label>
                <input
                  id="admin-product-name"
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-slug">Slug</label>
                <input
                  id="admin-product-slug"
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-sku">SKU</label>
                <input
                  id="admin-product-sku"
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-category">Danh mục</label>
                <select
                  id="admin-product-category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-brand">Thương hiệu</label>
                <select
                  id="admin-product-brand"
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-description">Mô tả</label>
                <textarea
                  id="admin-product-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-price">Giá bán</label>
                <input
                  id="admin-product-price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-old-price">Giá cũ</label>
                <input
                  id="admin-product-old-price"
                  type="number"
                  name="old_price"
                  value={formData.old_price}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label htmlFor="admin-product-image">Ảnh sản phẩm</label>

                <div>
                  <input
                    id="admin-product-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setSelectedFile(e.target.files[0]);
                    }}
                  />

                  {selectedFile && (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt=""
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "contain",
                        marginTop: "10px",
                        border: "1px solid #ddd",
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="admin-form__actions">
                <AdminButton
                  variant="primary"
                  icon="fa-floppy-disk"
                  type="submit"
                  loading={isSaving}
                >
                  {editingId ? "Cập nhật" : "Lưu sản phẩm"}
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

      <div className="admin-product-page__table-meta">
        <span>Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm</span>
      </div>

      <div className="admin-table-wrap">
      {isLoading ? (
        <div className="admin-loading-state" role="status">Đang tải danh sách sản phẩm...</div>
      ) : loadError ? (
        <div className="admin-error-state" role="alert">
          <p>{loadError}</p>
          <AdminButton variant="secondary" icon="fa-rotate-right" onClick={fetchProducts}>
            Thử lại
          </AdminButton>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="admin-empty-state">
          <i className="fa-regular fa-folder-open" aria-hidden="true" />
          <h3>Không tìm thấy sản phẩm</h3>
          <p>Hãy thay đổi bộ lọc hoặc thêm sản phẩm mới.</p>
        </div>
      ) : (
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Thương hiệu</th>
            <th>Giá</th>
            <th>Giá cũ</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.product_id}>
              <td>{product.product_id}</td>

              <td>
                {product.image_url && (
                  <img
                    className="admin-table__image"
                    src={`http://localhost:5000${product.image_url}`}
                    alt={product.product_name}
                    loading="lazy"
                  />
                )}
              </td>

              <td>{product.product_name}</td>
              <td>{product.category_name}</td>
              <td>{product.brand_name}</td>
              <td>{Number(product.price).toLocaleString()}đ</td>

              <td>
                {product.old_price
                  ? `${Number(product.old_price).toLocaleString()}đ`
                  : "-"}
              </td>

              <td>{product.total_stock}</td>
              <td>
                <span
                  className={`admin-status ${
                    Number(product.status) === 1
                      ? "admin-status--active"
                      : "admin-status--inactive"
                  }`}
                >
                  {Number(product.status) === 1 ? "Đang bán" : "Ngừng bán"}
                </span>
              </td>
              <td>
                <div className="admin-actions">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon="fa-pen"
                    onClick={() => handleEdit(product)}
                    aria-label={`Sửa ${product.product_name}`}
                  >
                    Sửa
                  </AdminButton>

                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon="fa-layer-group"
                    onClick={() =>
                      navigate(`/admin/products/${product.product_id}/variants`)
                    }
                    aria-label={`Quản lý biến thể của ${product.product_name}`}
                  >
                    Biến thể
                  </AdminButton>

                  <AdminButton
                    variant={Number(product.status) === 1 ? "danger" : "primary"}
                    size="sm"
                    icon={Number(product.status) === 1 ? "fa-ban" : "fa-rotate-left"}
                    onClick={() => handleUpdateStatus(product)}
                    loading={updatingStatusId === product.product_id}
                    aria-label={`${Number(product.status) === 1 ? "Ngừng bán" : "Bán lại"} ${product.product_name}`}
                  >
                    {Number(product.status) === 1 ? "Ngừng bán" : "Bán lại"}
                  </AdminButton>

                  {/* <button
                    className="admin-actions__delete"
                    onClick={() => handleDelete(product.product_id)}
                  >
                    Xóa
                  </button> */}
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
};

export default memo(AdminProductPage);
