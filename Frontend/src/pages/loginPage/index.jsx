import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import "../auth.scss";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

      alert("Đăng nhập thành công");
      navigate("/");
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        <div className="auth-line"></div>

        <p className="auth-note">
          Chưa có tài khoản, đăng ký <Link to="/register">tại đây</Link>
        </p>

        <input name="email" type="email" placeholder="Nhập email của bạn (*)" onChange={handleChange} />
        <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} />

        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}

export default LoginPage;