import axios from "axios";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    } else if (status === 403) {
      window.alert(error.response?.data?.message || "Bạn không có quyền thực hiện thao tác này");
    }
    return Promise.reject(error);
  },
);

export default axios;
