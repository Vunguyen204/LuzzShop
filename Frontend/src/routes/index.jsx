import HomePage from "../pages/homePage";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";
import ProductPage from "../pages/productPage";
import SaleOffPage from "../pages/saleOffPage";
import ProductDetailPage from "../pages/productDetailPage";
import CartPage from "../pages/cartPage";
import CheckOutPage from "../pages/checkOutPage";
import ProfilePage from "../pages/profilePage";

import DashBoardPage from "../pages/dashBoardPage";
import AdminMenuPage from "../pages/adminMenuPage";

export const ROUTERS = {
  USER: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    PRODUCT: "/products",
    SALEOFF: "/saleoff",
    PRODUCT_DETAIL: "/products/:id",
    CATEGORY: "/category/:slug",
    CART: "/cart",
    CHECKOUT: "/checkout",
    PROFILE: "/profile",
  },
  ADMIN: {
    DASHBOARD: "",
    MENU: "menus",
    CATEGORY: "categories",
    BRAND: "brands",
    PRODUCT: "products",
    ORDER: "orders",
    USER: "users",
    ROLE: "roles",
  },
};

export const userRoutes = [
  {
    path: ROUTERS.USER.HOME,
    component: HomePage,
  },
  {
    path: ROUTERS.USER.LOGIN,
    component: LoginPage,
  },
  {
    path: ROUTERS.USER.REGISTER,
    component: RegisterPage,
  },
  {
    path: ROUTERS.USER.PRODUCT,
    component: ProductPage,
  },
  {
    path: ROUTERS.USER.SALEOFF,
    component: SaleOffPage,
  },
  {
    path: ROUTERS.USER.CATEGORY,
    component: ProductPage,
  },
  {
    path: ROUTERS.USER.PRODUCT_DETAIL,
    component: ProductDetailPage,
  },
  {
    path: ROUTERS.USER.CART,
    component: CartPage,
  },
  {
    path: ROUTERS.USER.CHECKOUT,
    component: CheckOutPage,
  },
  {
    path: ROUTERS.USER.PROFILE,
    component: ProfilePage,
  },
];

export const adminRoutes = [
  {
    path: ROUTERS.ADMIN.DASHBOARD,
    component: DashBoardPage,
  },
  {
    path: ROUTERS.ADMIN.MENU,
    component: AdminMenuPage,
  },
  {
    path: ROUTERS.ADMIN.CATEGORY,
    component: DashBoardPage,
  },
  {
    path: ROUTERS.ADMIN.BRAND,
    component: DashBoardPage,
  },
  {
    path: ROUTERS.ADMIN.PRODUCT,
    component: DashBoardPage,
  },
  {
    path: ROUTERS.ADMIN.ORDER,
    component: DashBoardPage,
  },
];
