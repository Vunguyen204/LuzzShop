import { memo } from "react";
import "./style.scss";
import Breadcrumb from "../../components/Breadcrumb";

const ContactUsPage = () => {
  return (
    <div className="contact-page">
      <Breadcrumb />
      <div className="contact-page__content">
        <div className="contact-page__form">
          <h2>Liên hệ với chúng tôi</h2>

          <p>
            Nếu bạn cần hỗ trợ về sản phẩm, đơn hàng hoặc dịch vụ của LuzzShop,
            vui lòng để lại thông tin bên dưới.
          </p>

          <div className="contact-page__row">
            <input type="text" placeholder="Họ và tên" />

            <input type="email" placeholder="Email*" />
          </div>

          <input type="text" placeholder="Số điện thoại" />

          <textarea placeholder="Nội dung liên hệ"></textarea>

          <button type="button">Gửi liên hệ</button>
        </div>

        <div className="contact-page__info">
          <div className="contact-page__item">
            <h4>Địa chỉ</h4>

            <p>
              2 Lý Thường Kiệt, Quận Hải Châu,
              <br />
              Thành phố Đà Nẵng
            </p>
          </div>

          <div className="contact-page__item">
            <h4>Email</h4>

            <p>support@luzzshop.com</p>
          </div>

          <div className="contact-page__item">
            <h4>Giờ làm việc</h4>

            <p>
              Thứ 2 - Chủ nhật
              <br />
              08:00 - 22:00
            </p>
          </div>

          <div className="contact-page__item">
            <h4>Hotline</h4>

            <p>0901 234 567</p>
          </div>

          <div className="contact-page__description">
            <p>
              Đội ngũ LuzzShop luôn sẵn sàng hỗ trợ mọi thắc mắc liên quan đến
              sản phẩm Pickleball, đơn hàng và dịch vụ khách hàng.
            </p>
          </div>

          <div className="contact-page__social">
            <a href="/">Facebook</a>
            <a href="/">Instagram</a>
            <a href="/">TikTok</a>
            <a href="/">YouTube</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ContactUsPage);
