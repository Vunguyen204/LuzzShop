import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import AdminButton from "../../components/adminButton";
import "./style.scss";

const navigation = [
  { to: "/admin", label: "Tổng quan", icon: "fa-chart-line", end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: "fa-box-open" },
  { to: "/admin/paddle-specs", label: "Thông số vợt", icon: "fa-table-list" },
  { to: "/admin/categories", label: "Danh mục", icon: "fa-layer-group" },
  { to: "/admin/brands", label: "Thương hiệu", icon: "fa-certificate" },
  { to: "/admin/menus", label: "Menu", icon: "fa-bars-staggered" },
  { to: "/admin/orders", label: "Đơn hàng", icon: "fa-receipt" },
  { to: "/admin/users", label: "Người dùng", icon: "fa-users" },
];

const pageTitles = [
  { path: "/admin/paddle-specs/", title: "Chi tiết thông số vợt" },
  { path: "/admin/paddle-specs", title: "Quản lý thông số vợt" },
  { path: "/admin/products/", title: "Quản lý biến thể" },
  { path: "/admin/products", title: "Quản lý sản phẩm" },
  { path: "/admin/categories", title: "Quản lý danh mục" },
  { path: "/admin/brands", title: "Quản lý thương hiệu" },
  { path: "/admin/menus", title: "Quản lý menu" },
  { path: "/admin/orders", title: "Quản lý đơn hàng" },
  { path: "/admin/users", title: "Quản lý người dùng" },
  { path: "/admin", title: "Tổng quan" },
];

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || Number(user?.role_id) !== 1) {
    return <Navigate to="/login" replace />;
  }

  const currentTitle =
    pageTitles.find(({ path }) =>
      path === "/admin" ? location.pathname === path : location.pathname.startsWith(path),
    )?.title || "Quản trị LuzzShop";

  return (
    <div className={`admin-page${isCollapsed ? " admin-page--collapsed" : ""}`}>
      <aside
        className={`admin-sidebar${isMobileOpen ? " admin-sidebar--open" : ""}`}
        aria-label="Điều hướng quản trị"
      >
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__logo">
            <Link to="/" aria-label="Về trang chủ LuzzShop">
              <img src="/images/logo-white.svg" alt="LuzzShop" />
            </Link>
            <AdminButton
              icon="fa-xmark"
              iconOnly
              variant="ghost"
              className="admin-sidebar__mobile-close"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Đóng menu quản trị"
              title="Đóng menu"
            >
            </AdminButton>
          </div>

          <nav className="admin-sidebar__nav">
            <p className="admin-sidebar__label">Quản trị</p>
            <ul>
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="admin-sidebar__bottom">
          <Link to="/">
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            <span>Xem cửa hàng</span>
          </Link>
        </div>
      </aside>

      {isMobileOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Đóng menu quản trị"
        />
      )}

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <AdminButton
              icon="fa-bars"
              iconOnly
              variant="ghost"
              className="admin-topbar__menu"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Mở menu quản trị"
              aria-expanded={isMobileOpen}
              title="Mở menu"
            >
            </AdminButton>
            <AdminButton
              icon={isCollapsed ? "fa-angles-right" : "fa-angles-left"}
              iconOnly
              variant="ghost"
              className="admin-topbar__collapse"
              onClick={() => setIsCollapsed((value) => !value)}
              aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              aria-pressed={isCollapsed}
              title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
            </AdminButton>
            <div>
              <p>Trang quản trị</p>
              <h1>{currentTitle}</h1>
            </div>
          </div>

          <div className="admin-topbar__account">
            <span className="admin-topbar__avatar" aria-hidden="true">
              {(user?.full_name || user?.name || user?.email || "A").charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{user?.full_name || user?.name || "Quản trị viên"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
