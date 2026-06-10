import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./style.scss";

function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__column">
          <h3>LuzzerShop</h3>
          <p>
            Cửa hàng thể thao chuyên cung cấp vợt Pickleball, giày,
            quần áo và phụ kiện chính hãng.
          </p>
        </div>

        <div className="footer__column">
          <h4>Sản phẩm</h4>

          {categories.map((category) => (
            <Link
              key={category.category_id}
              to={`/category/${category.slug}`}
            >
              {category.category_name}
            </Link>
          ))}
        </div>

        <div className="footer__column">
          <h4>Hỗ trợ</h4>
          <Link to="/help">Trợ giúp</Link>
          <Link to="/tracking">Theo dõi đơn hàng</Link>
          <Link to="/return-policy">Chính sách đổi trả</Link>
          <Link to="/warranty-policy">Chính sách bảo hành</Link>
        </div>

        <div className="footer__column">
          <h4>Liên hệ</h4>
          <p>Email: support@luzzershop.vn</p>
          <p>Hotline: 0123 456 789</p>
          <p>Địa chỉ: Việt Nam</p>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2026 LuzzerShop. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;