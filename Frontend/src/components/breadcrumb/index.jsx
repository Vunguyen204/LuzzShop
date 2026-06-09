import { Link, useLocation } from "react-router-dom";
import "./style.scss";

const breadcrumbMap = {
  products: "Sản phẩm",
  category: "Danh mục",

  "vot-pickleball": "Vợt Pickleball",
  "giay-pickleball": "Giày Pickleball",
  "quan-ao-pickleball": "Quần áo Pickleball",
  "phu-kien": "Phụ kiện",

  cart: "Giỏ hàng",
  checkout: "Thanh toán",
  profile: "Tài khoản",
  login: "Đăng nhập",
  register: "Đăng ký",
};

function Breadcrumb() {
  const location = useLocation();

  const pathnames = location.pathname
    .split("/")
    .filter((item) => item);

  return (
    <div className="breadcrumb">
      <div className="breadcrumb__container">
        <Link to="/">Trang chủ</Link>

        {pathnames.map((value, index) => {
          const to =
            "/" +
            pathnames
              .slice(0, index + 1)
              .join("/");

          return (
            <span key={to}>
              <i className="fa fa-angle-right"></i>

              <Link to={to}>
                {breadcrumbMap[value] || value}
              </Link>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default Breadcrumb;