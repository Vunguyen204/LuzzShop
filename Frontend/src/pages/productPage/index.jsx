import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import Breadcrumb from "../../components/Breadcrumb";
import "./style.scss";

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { slug } = useParams();
  const [brands, setBrands] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [sortType, setSortType] = useState("default");
  const handleCheckboxChange = (value, selectedList, setSelectedList) => {
    if (selectedList.includes(value)) {
      setSelectedList(selectedList.filter((item) => item !== value));
    } else {
      setSelectedList([...selectedList, value]);
    }
  };
  const getPriceLabel = (price) => {
    switch (price) {
      case "under500":
        return "Giá dưới 500.000đ";

      case "500to1m":
        return "500.000đ - 1 triệu";

      case "1to2m":
        return "1 - 2 triệu";

      case "2to3m":
        return "2 - 3 triệu";

      case "above3m":
        return "Giá trên 3 triệu";

      default:
        return "";
    }
  };
  const currentCategory =
    selectedCategories.length === 1
      ? categories.find(
          (c) => Number(c.category_id) === Number(selectedCategories[0]),
        )
      : null;

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.log("Lỗi lấy sản phẩm:", err));
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log("Lỗi lấy danh mục:", err));
  }, []);

  useEffect(() => {
    if (slug && categories.length > 0) {
      const category = categories.find((item) => item.slug === slug);

      if (category) {
        setTimeout(() => {
          setSelectedCategories([Number(category.category_id)]);
        }, 0);
      }
    }
  }, [slug, categories]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/brands")
      .then((res) => setBrands(res.data))
      .catch((err) => console.log("Lỗi lấy thương hiệu:", err));
  }, []);

  let filteredProducts = [...products];

  if (selectedCategories.length > 0) {
    filteredProducts = filteredProducts.filter((item) =>
      selectedCategories.includes(Number(item.category_id)),
    );
  }

  if (selectedBrands.length > 0) {
    filteredProducts = filteredProducts.filter((item) =>
      selectedBrands.includes(Number(item.brand_id)),
    );
  }

  if (selectedPrices.length > 0) {
    filteredProducts = filteredProducts.filter((item) => {
      const price = Number(item.price);

      return selectedPrices.some((priceType) => {
        if (priceType === "under500") return price < 500000;
        if (priceType === "500to1m") return price >= 500000 && price <= 1000000;
        if (priceType === "1to2m") return price > 1000000 && price <= 2000000;
        if (priceType === "2to3m") return price > 2000000 && price <= 3000000;
        if (priceType === "above3m") return price > 3000000;
        return false;
      });
    });
  }

  if (sortType === "price-asc") {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sortType === "price-desc") {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (sortType === "newest") {
    filteredProducts.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }

  return (
    <>
      <Header />

      <div className="product-page">
        <Breadcrumb />

        <div className="product-layout">
          <aside className="filter-sidebar">
            <div className="filter-box">
              {(selectedPrices.length > 0 ||
                selectedBrands.length > 0 ||
                selectedCategories.length > 0) && (
                <div className="selected-filters">
                  <div className="selected-filters__header">
                    <h3>Bạn chọn</h3>

                    <button
                      className="reset-filter"
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedBrands([]);
                        setSelectedPrices([]);
                        setSortType("default");
                      }}
                    >
                      Xóa bộ lọc
                    </button>
                  </div>

                  <div className="selected-tags">
                    {selectedPrices.map((price) => (
                      <span
                        key={price}
                        className="filter-tag"
                        onClick={() =>
                          setSelectedPrices(
                            selectedPrices.filter((item) => item !== price),
                          )
                        }
                      >
                        × {getPriceLabel(price)}
                      </span>
                    ))}

                    {selectedBrands.map((brandId) => {
                      const brand = brands.find(
                        (b) => Number(b.brand_id) === Number(brandId),
                      );

                      return (
                        <span
                          key={brandId}
                          className="filter-tag"
                          onClick={() =>
                            setSelectedBrands(
                              selectedBrands.filter((id) => id !== brandId),
                            )
                          }
                        >
                          × {brand?.brand_name}
                        </span>
                      );
                    })}

                    {selectedCategories.map((categoryId) => {
                      const category = categories.find(
                        (c) => Number(c.category_id) === Number(categoryId),
                      );

                      return (
                        <span
                          key={categoryId}
                          className="filter-tag"
                          onClick={() => {
                            setSelectedCategories(
                              selectedCategories.filter(
                                (id) => id !== categoryId,
                              ),
                            );
                          }}
                        >
                          × {category?.category_name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <h3>DANH MỤC</h3>

              {categories.map((category) => (
                <label key={category.category_id}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(
                      Number(category.category_id),
                    )}
                    onChange={() =>
                      handleCheckboxChange(
                        Number(category.category_id),
                        selectedCategories,
                        setSelectedCategories,
                      )
                    }
                  />
                  {category.category_name}
                </label>
              ))}
            </div>

            <div className="filter-box">
              <h3>CHỌN MỨC GIÁ</h3>

              <label>
                <input
                  type="checkbox"
                  checked={selectedPrices.includes("under500")}
                  onChange={() =>
                    handleCheckboxChange(
                      "under500",
                      selectedPrices,
                      setSelectedPrices,
                    )
                  }
                />
                Giá dưới 500.000đ
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedPrices.includes("500to1m")}
                  onChange={() =>
                    handleCheckboxChange(
                      "500to1m",
                      selectedPrices,
                      setSelectedPrices,
                    )
                  }
                />
                500.000đ - 1 triệu
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedPrices.includes("1to2m")}
                  onChange={() =>
                    handleCheckboxChange(
                      "1to2m",
                      selectedPrices,
                      setSelectedPrices,
                    )
                  }
                />
                1 - 2 triệu
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedPrices.includes("2to3m")}
                  onChange={() =>
                    handleCheckboxChange(
                      "2to3m",
                      selectedPrices,
                      setSelectedPrices,
                    )
                  }
                />
                2 - 3 triệu
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedPrices.includes("above3m")}
                  onChange={() =>
                    handleCheckboxChange(
                      "above3m",
                      selectedPrices,
                      setSelectedPrices,
                    )
                  }
                />
                Giá trên 3 triệu
              </label>
            </div>

            <div className="filter-box">
              <h3>THƯƠNG HIỆU</h3>

              {brands.map((brand) => (
                <label key={brand.brand_id}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(Number(brand.brand_id))}
                    onChange={() =>
                      handleCheckboxChange(
                        Number(brand.brand_id),
                        selectedBrands,
                        setSelectedBrands,
                      )
                    }
                  />
                  {brand.brand_name}
                </label>
              ))}
            </div>
          </aside>

          <main className="product-content">
            <div className="product-content__top">
              <h2>
                {currentCategory
                  ? currentCategory.category_name.toUpperCase()
                  : "TẤT CẢ SẢN PHẨM"}
                ({filteredProducts.length})
              </h2>

              <div className="sort-box">
                <span>Sắp xếp:</span>

                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="newest">Mới nhất</option>
                </select>
              </div>
            </div>

            <div className="product-list">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))
              ) : (
                <p>Không có sản phẩm phù hợp.</p>
              )}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default ProductPage;
