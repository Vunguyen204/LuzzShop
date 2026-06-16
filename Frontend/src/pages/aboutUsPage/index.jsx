import { memo } from "react";
import "./style.scss";
import Breadcrumb from "../../components/Breadcrumb";


const AboutPage = () => {
  return (
    <div className="about-page">
      <Breadcrumb />
      <div className="container">
        <div className="about-box">
          <h2>Giới thiệu</h2>

          <p>
            LuzzShop là website bán hàng chuyên cung cấp các sản phẩm Pickleball
            như vợt, giày, quần áo và phụ kiện. Chúng tôi hướng đến việc mang
            lại cho khách hàng những sản phẩm chất lượng, mẫu mã đa dạng và giá
            cả phù hợp.
          </p>

          <p className="highlight">
            Tại LuzzShop, chúng tôi tin rằng Pickleball không chỉ là một môn thể
            thao, mà còn là phong cách sống năng động, hiện đại và lành mạnh.
          </p>

          <p>
            Với giao diện mua sắm hiện đại, dễ sử dụng, LuzzShop giúp khách hàng
            dễ dàng tìm kiếm sản phẩm, xem chi tiết, thêm vào giỏ hàng và đặt
            hàng trực tuyến nhanh chóng.
          </p>

          <p>
            Mục tiêu của LuzzShop là xây dựng một nền tảng thương mại điện tử
            thân thiện, hỗ trợ tốt cho người chơi Pickleball từ mới bắt đầu đến
            chuyên nghiệp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(AboutPage);
