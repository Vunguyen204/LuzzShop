import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import Toast from "../../components/Toast";
import "../auth.scss";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await login(formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      showToast("Đăng nhập thành công", "success");

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToast(error.response?.data?.message || "Đăng nhập thất bại", "error");
    }
  };

  return (
    <div className="auth-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <form className="auth-box" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        <div className="auth-line"></div>

        <p className="auth-note">
          Chưa có tài khoản, đăng ký <Link to="/register">tại đây</Link>
        </p>

        <input
          name="email"
          type="email"
          placeholder="Nhập email của bạn (*)"
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Mật khẩu"
          onChange={handleChange}
        />

        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}

export default LoginPage;
