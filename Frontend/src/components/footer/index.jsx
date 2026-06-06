import "./style.scss";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__column">
          <h3>LuzzerShop</h3>
          <p>
            Cửa hàng thể thao chuyên cung cấp vợt Pickleball, giày, quần áo
            và phụ kiện chính hãng.
          </p>
        </div>

        <div className="footer__column">
          <h4>Sản phẩm</h4>
          <Link to="/category/1">Vợt Pickleball</Link>
          <Link to="/category/2">Bóng Pickleball</Link>
          <Link to="/category/3">Giày thể thao</Link>
          <Link to="/category/4">Phụ kiện</Link>
        </div>

        <div className="footer__column">
          <h4>Hỗ trợ</h4>
          <Link to="#">Trợ giúp</Link>
          <Link to="#">Theo dõi đơn hàng</Link>
          <Link to="#">Chính sách đổi trả</Link>
          <Link to="#">Chính sách bảo hành</Link>
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