import { Link, Outlet } from "react-router-dom";
import "./style.scss";

const AdminLayout = () => {
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__logo">
            <Link to="/">
              <img src="/images/logo-white.svg" alt="Logo" />
            </Link>
          </div>

          <ul>
            <li>
              <Link to="/admin">Tổng quan</Link>
            </li>

            <li>
              <Link to="/admin/menus">Quản lý menu</Link>
            </li>

            <li>
              <Link to="/admin/categories">Quản lý danh mục</Link>
            </li>

            <li>
              <Link to="/admin/brands">Quản lý thương hiệu</Link>
            </li>

            <li>
              <Link to="/admin/products">Quản lý sản phẩm</Link>
            </li>

            <li>
              <Link to="/admin/orders">Quản lý đơn hàng</Link>
            </li>

            <li>
              <Link to="/admin/users">Quản lý người dùng</Link>
            </li>

            <li>
              <Link to="/admin/roles">Phân quyền người dùng</Link>
            </li>
          </ul>
        </div>
        <div className="admin-sidebar__bottom">
          <Link to="/">
            🌐 Xem website
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
