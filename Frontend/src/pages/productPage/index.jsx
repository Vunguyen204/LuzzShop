import { useEffect, useState } from "react";
import { getProducts } from "../../api/productApi";
import ProductCard from "../../components/productCard";


function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(data))
      .catch((err) => console.log("Lỗi lấy sản phẩm:", err));
  }, []);

  return (
    <div className="product-page">
      <h2>Danh sách sản phẩm</h2>

      <div className="product-grid">
        {products.map((item) => (
          <ProductCard key={item.product_id} product={item} />
        ))}
      </div>
    </div>
  );
}

export default ProductList;