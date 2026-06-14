import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../../components/ProductCard";
import Breadcrumb from "../../components/Breadcrumb";
import Toast from "../../components/toast";
import ProductFilter from "../../components/productFilter";
import "../productPage/style.scss";

function SaleOffPage() {
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [sortType, setSortType] = useState("default");

  const discountRanges = [
    { value: "under20", min: 0, max: 20 },
    { value: "20to40", min: 20, max: 40 },
    { value: "40to60", min: 40, max: 60 },
    { value: "above60", min: 60, max: Infinity },
  ];

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const getDiscountPercent = (product) => {
    const price = Number(product.price);
    const oldPrice = Number(product.old_price);

    if (!oldPrice || oldPrice <= price) return 0;

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

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
    axios
      .get("http://localhost:5000/api/brands")
      .then((res) => setBrands(res.data))
      .catch((err) => console.log("Lỗi lấy thương hiệu:", err));
  }, []);

  let filteredProducts = [...products];

  filteredProducts = filteredProducts.filter((item) => {
    const price = Number(item.price);
    const oldPrice = Number(item.old_price);

    return oldPrice > 0 && oldPrice > price;
  });

  if (selectedDiscounts.length > 0) {
    filteredProducts = filteredProducts.filter((item) => {
      const discountPercent = getDiscountPercent(item);

      return selectedDiscounts.some((discountValue) => {
        const range = discountRanges.find(
          (discount) => discount.value === discountValue,
        );

        if (!range) return false;

        return discountPercent >= range.min && discountPercent < range.max;
      });
    });
  }

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
          selectedDiscounts={selectedDiscounts}
          setSelectedDiscounts={setSelectedDiscounts}
          setSortType={setSortType}
          showDiscountFilter={true}
        />

        <main className="product-content">
          <div className="product-content__top">
            <h2>SẢN PHẨM KHUYẾN MÃI ({filteredProducts.length})</h2>

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

export default SaleOffPage;
