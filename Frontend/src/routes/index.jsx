import HomePage from "../pages/homePage";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";
import ProductPage from "../pages/productPage";
import SaleOffPage from "../pages/saleOffPage";
import ProductDetailPage from "../pages/productDetailPage";
import CartPage from "../pages/cartPage";
import CheckOutPage from "../pages/checkOutPage";
import ProfilePage from "../pages/profilePage";
import NewsPage from "../pages/newsPage";
import AboutUsPage from "../pages/aboutUsPage";
import ContactUsPage from "../pages/contactUsPage";
import WishListPage from "../pages/wishListPage";

import DashBoardPage from "../pages/adminDashBoardPage";
import AdminMenuPage from "../pages/adminMenuPage";
import AdminCategoryPage from "../pages/adminCategoryPage";
import AdminBrandPage from "../pages/adminBrandPage";
import AdminProductPage from "../pages/adminProductPage";
import AdminVariantPage from "../pages/adminVariantPage";
import AdminOrderPage from "../pages/adminOrderPage";
import AdminUserPage from "../pages/adminUserPage";

export const ROUTERS = {
  USER: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    PRODUCT: "/products",
    SALEOFF: "/saleoff",
    // PRODUCT_DETAIL: "/products/:id",
    PRODUCT_DETAIL: "/products/:slug",
    CATEGORY: "/category/:slug",
    CART: "/cart",
    CHECKOUT: "/checkout",
    PROFILE: "/profile",
    NEWS: "/news",
    ABOUTUS: "/aboutus",
    CONTACTUS: "/contactus",
    WISHLIST: "/wishlist",
  },

  ADMIN: {
    DASHBOARD: "",
    MENU: "menus",
    CATEGORY: "categories",
    BRAND: "brands",
    PRODUCT: "products",
    VARIANT: "products/:productId/variants",
    ORDER: "orders",
    USER: "users",
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
  {
    path: ROUTERS.USER.NEWS,
    component: NewsPage,
  },
  {
    path: ROUTERS.USER.ABOUTUS,
    component: AboutUsPage,
  },
  {
    path: ROUTERS.USER.CONTACTUS,
    component: ContactUsPage,
  },
  {
    path: ROUTERS.USER.WISHLIST,
    component: WishListPage,
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
    component: AdminCategoryPage,
  },
  {
    path: ROUTERS.ADMIN.BRAND,
    component: AdminBrandPage,
  },
  {
    path: ROUTERS.ADMIN.PRODUCT,
    component: AdminProductPage,
  },
  {
    path: ROUTERS.ADMIN.VARIANT,
    component: AdminVariantPage,
  },
  {
    path: ROUTERS.ADMIN.ORDER,
    component: AdminOrderPage,
  },
  {
    path: ROUTERS.ADMIN.USER,
    component: AdminUserPage,
  },
];
