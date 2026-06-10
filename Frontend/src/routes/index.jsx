import HomePage from "../pages/homePage";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";
import ProductPage from "../pages/productPage";
import productDetailPage from "../pages/productDetailPage";

export const ROUTERS = {
  USER: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    PRODUCT: "/products",
    PRODUCT_DETAIL: "/products/:id",
    CATEGORY: "/category/:slug",
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
    path: ROUTERS.USER.CATEGORY,
    component: ProductPage,
  },
  {
    path: ROUTERS.USER.PRODUCT_DETAIL,
    component: productDetailPage,
  }
];