import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
    const res = await axios.get("http://localhost:5000/api/products");
    setProducts(res.data);
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
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      alert("Xóa sản phẩm thành công");
      fetchProducts();
    } catch (error) {
      console.log("Lỗi xóa sản phẩm:", error);
      alert("Xóa sản phẩm thất bại");
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
        <h2>Quản lý sản phẩm</h2>

        {!isShowForm && (
          <button
            className="admin-product-page__btn-add"
            onClick={handleShowAddForm}
          >
            Thêm sản phẩm
          </button>
        )}
      </div>

      <div className="admin-stats">
        <div className="admin-stats__card">
          <h4>Tổng sản phẩm</h4>
          <p>{products.length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Hết hàng</h4>
          <p>{products.filter((p) => Number(p.total_stock) <= 0).length}</p>
        </div>

        <div className="admin-stats__card">
          <h4>Đang giảm giá</h4>
          <p>
            {
              products.filter((p) => Number(p.old_price) > Number(p.price))
                .length
            }
          </p>
        </div>
      </div>

      <div className="admin-product-page__toolbar">
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
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

        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="">Sắp xếp</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="stock_desc">Tồn kho nhiều nhất</option>
          <option value="stock_asc">Tồn kho ít nhất</option>
        </select>

        <button
          className="admin-product-page__toolbar__reset"
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedBrand("");
            setSortType("");
          }}
        >
          Xóa bộ lọc
        </button>
      </div>

      {isShowForm && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h3>

              <button
                type="button"
                className="admin-modal__close"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form__row">
                <label>Tên sản phẩm</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
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
                />
              </div>

              <div className="admin-form__row">
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label>Danh mục</label>
                <select
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
                <label>Thương hiệu</label>
                <select
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
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label>Giá bán</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form__row">
                <label>Giá cũ</label>
                <input
                  type="number"
                  name="old_price"
                  value={formData.old_price}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form__row">
                <label>Ảnh sản phẩm</label>

                <div>
                  <input
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
                <button className="admin-product-page__btn-add" type="submit">
                  {editingId ? "Cập nhật" : "Lưu sản phẩm"}
                </button>

                <button
                  type="button"
                  className="admin-product-page__btn-cancel"
                  onClick={resetForm}
                >
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
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Thương hiệu</th>
            <th>Giá</th>
            <th>Giá cũ</th>
            <th>Tồn kho</th>
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
                <div className="admin-actions">
                  <button
                    className="admin-actions__edit"
                    onClick={() => handleEdit(product)}
                  >
                    Sửa
                  </button>

                  <button
                    className="admin-actions__variant"
                    onClick={() =>
                      navigate(`/admin/products/${product.product_id}/variants`)
                    }
                  >
                    Biến thể
                  </button>

                  <button
                    className="admin-actions__delete"
                    onClick={() => handleDelete(product.product_id)}
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

export default memo(AdminProductPage);