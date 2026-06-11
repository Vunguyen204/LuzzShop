import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../ProductCard";
import { Link } from "react-router-dom";
import Toast from "../../components/Toast";
import "./style.scss";

function ProductSection() {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products/featured")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <section className="product-section">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="container">
        <div className="section-title">
          <h2>Sản phẩm nổi bật</h2>
          <Link to="/products">
            <span>Xem tất cả</span>
          </Link>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              showToast={showToast}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductSection;
