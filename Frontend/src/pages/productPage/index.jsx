import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "../../components/ProductCard";
import Breadcrumb from "../../components/Breadcrumb";
import Toast from "../../components/toast";
import ProductFilter from "../../components/productFilter";
import "./style.scss";

function ProductPage() {
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const { slug } = useParams();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [sortType, setSortType] = useState("default");

  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("search");

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const currentCategory =
    selectedCategories.length === 1
      ? categories.find(
          (c) => Number(c.category_id) === Number(selectedCategories[0]),
        )
      : null;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = keyword
          ? `http://localhost:5000/api/products/search/${encodeURIComponent(keyword)}`
          : "http://localhost:5000/api/products";

        const res = await axios.get(url);

        setProducts(res.data);
      } catch (error) {
        console.log("Lỗi lấy sản phẩm:", error);
      }
    };

    fetchProducts();
  }, [keyword]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log("Lỗi lấy danh mục:", err));
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    const timer = setTimeout(() => {
      if (slug) {
        const category = categories.find((item) => item.slug === slug);

        if (category) {
          setSelectedCategories([Number(category.category_id)]);
        } else {
          setSelectedCategories([]);
        }
      } else {
        setSelectedCategories([]);
      }
    }, 0);

    return () => clearTimeout(timer);
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
    <div className="product-page">
      <Breadcrumb />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="product-layout">
        <ProductFilter
          categories={categories}
          brands={brands}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          selectedPrices={selectedPrices}
          setSelectedPrices={setSelectedPrices}
          selectedDiscounts={[]}
          setSelectedDiscounts={() => {}}
          setSortType={setSortType}
          showDiscountFilter={false}
        />

        <main className="product-content">
          <div className="product-content__top">
            <h2>
              {keyword
                ? `KẾT QUẢ TÌM KIẾM: "${keyword}"`
                : currentCategory
                  ? currentCategory.category_name.toUpperCase()
                  : "TẤT CẢ SẢN PHẨM"}{" "}
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
                <ProductCard
                  key={product.product_id}
                  product={product}
                  showToast={showToast}
                />
              ))
            ) : (
              <p>Không có sản phẩm phù hợp.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProductPage;
