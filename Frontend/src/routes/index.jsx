import HomePage from "../pages/homePage";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";

export const ROUTERS = {
  USER: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
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
];