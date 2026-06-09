import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../ProductCard";
import { Link } from "react-router-dom";
import "./style.scss";

function ProductSection() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => {
        setProducts(res.data.slice(0, 8));
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <section className="product-section">
      <div className="container">
        <div className="section-title">
          <h2>Sản phẩm nổi bật</h2>
          <Link to="/products"><span>Xem tất cả</span></Link>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductSection;