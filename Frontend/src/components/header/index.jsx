import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Header = () => {
  const [user, setUser] = useState(null);
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        setMenus(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      setTimeout(() => {
        setUser(parsedUser);
      }, 0);
    } catch {
      localStorage.removeItem("user");
      setTimeout(() => {
        setUser(null);
      }, 0);
    }
  }, []);

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-top__links">
          <Link to="#">Trợ giúp</Link>
          <Link to="#">Danh sách sản phẩm yêu thích</Link>
          <Link to="#">Trình theo dõi đơn hàng</Link>
        <img src="/img/vn.png" alt="VN" className="flag" />
        </div>
      </div>

      <div className="header-main">
        <div className="header-main__logo">
          <Link to="/">LuzzerShop</Link>
        </div>

        <nav className="header-main__menu">
          <ul>
            {menus.length > 0 ? (
              menus.map((menu) => (
                <li key={menu.category_id}>
                  <Link to={menu.slug}>{menu.category_name}</Link>
                </li>
              ))
            ) : (
              <li>
                <span>Chưa có danh mục</span>
              </li>
            )}
          </ul>
        </nav>

        <div className="header-main__actions">
          <div className="search-box">
            <input type="text" placeholder="Tìm kiếm" />
            <button>
              <i className="fa fa-search"></i>
            </button>
          </div>

          {user ? (
            <>
              <Link to="/profile" className="icon-btn">
                <i className="fa fa-user"></i>
              </Link>

              <Link to="/wishlist" className="icon-btn">
                <i className="fa fa-heart"></i>
              </Link>

              <Link to="/cart" className="icon-btn">
                <i className="fa fa-shopping-cart"></i>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Đăng nhập
              </Link>

              <Link to="/register" className="register-btn">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default memo(Header);
