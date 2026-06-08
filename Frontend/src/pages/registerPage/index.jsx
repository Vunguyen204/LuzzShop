import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../../api/authApi";
import "../auth.scss";

function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      const res = await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      alert(res.data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={handleSubmit}>
        <h2>Đăng ký</h2>
        <div className="auth-line"></div>

        <p className="auth-note">
          Đã có tài khoản, đăng nhập <Link to="/login">tại đây</Link>
        </p>

        <input name="full_name" placeholder="Nhập tên của bạn (*)" onChange={handleChange} />
        <input name="email" type="email" placeholder="Nhập email của bạn (*)" onChange={handleChange} />
        <input name="phone" placeholder="Số điện thoại" onChange={handleChange} />
        <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} />
        <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" onChange={handleChange} />

        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default RegisterPage;