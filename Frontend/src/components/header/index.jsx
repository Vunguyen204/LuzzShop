import { memo, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.scss";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ROUTERS } from "../../routes";

const getCartCount = () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  return cart.reduce((sum, item) => sum + Number(item.quantity), 0);
};
const Header = () => {
  const [user, setUser] = useState(null);
  const [menus, setMenus] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const [cartCount, setCartCount] = useState(getCartCount);

  const updateCartCount = useCallback(() => {
    setCartCount(getCartCount());
  }, []);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/menus/active");
        setMenus(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy menu:", error);
      }
    };
    fetchMenus();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        setCategories(res.data);
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

  useEffect(() => {
    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, [updateCartCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    if (!keyword.trim()) return;

    navigate(`/products?search=${encodeURIComponent(keyword)}`);
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-top__links">
          <Link to="#">Trợ giúp</Link>
          <Link to="#">Danh sách sản phẩm yêu thích</Link>
          <Link to="#">Trình theo dõi đơn hàng</Link>
          <img src="/images/vn.png" alt="VN" className="flag" />
        </div>
      </div>

      <div className="header-main">
        <div className="header-main__logo">
          {/* <Link to="/">LuzzShop</Link> */}
          <Link to="/">
            <img src="/images/logo.svg" alt="Logo" />
          </Link>
        </div>

        <nav className="header-main__menu">
          <ul>
            {menus.length > 0 ? (
              menus.map((menu) => (
                <li
                  key={menu.menu_id}
                  className={
                    menu.menu_name === "Sản phẩm" ? "has-dropdown" : ""
                  }
                >
                  <Link to={menu.slug}>{menu.menu_name}</Link>

                  {menu.menu_name === "Sản phẩm" && (
                    <div className="product-dropdown">
                      {categories.map((category) => (
                        <Link
                          key={category.category_id}
                          to={`/category/${category.slug}`}
                        >
                          {category.category_name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))
            ) : (
              <li>
                <span>Chưa có menu</span>
              </li>
            )}
          </ul>
        </nav>

        <div className="header-main__actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <button onClick={handleSearch}>
              <i className="fa fa-search"></i>
            </button>
          </div>

          {user ? (
            <>
              <div className="user-dropdown" ref={userMenuRef}>
                <button
                  className="icon-btn user-icon"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <i className="fa fa-user"></i>
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown__menu">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Trang cá nhân
                    </Link>

                    {user?.role_id === 1 && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Trang quản trị
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        window.location.href = "/";
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>

              <Link to="/wishlist" className="icon-btn">
                <i className="fa fa-heart"></i>
              </Link>

              <Link to="/cart" className="icon-btn cart-icon">
                <i className="fa fa-shopping-cart"></i>

                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to={ROUTERS.USER.LOGIN} className="login-btn">
                Đăng nhập
              </Link>

              <Link to={ROUTERS.USER.REGISTER} className="register-btn">
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
