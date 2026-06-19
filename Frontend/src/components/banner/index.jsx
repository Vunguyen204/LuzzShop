import { Link } from "react-router-dom";
import "./style.scss";

function Banner() {
  return (
    <section className="hero-banner">
      <div className="hero-banner__content">
        <span className="tag">NEW COLLECTION 2026</span>

        <h1>
          DỤNG CỤ PICKLEBALL
          <br />
          CHÍNH HÃNG
        </h1>

        <p>
          Khám phá các mẫu vợt, giày, trang phục và phụ kiện Pickleball mới nhất
          dành cho người mới bắt đầu và vận động viên chuyên nghiệp.
        </p>

        <Link to="/products" className="buttonBuyNow">Mua ngay</Link>
      </div>

      <div className="hero-banner__image">
        <img
          src="/images/banner1.jpg"
          alt="Banner"
        />
      </div>
    </section>
  );
}

export default Banner;