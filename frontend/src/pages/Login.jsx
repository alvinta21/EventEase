import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
      });

      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "creator") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Login</h1>

        <form
          onSubmit={handleSubmit}
          className="event-card"
          style={{ maxWidth: "500px", margin: "0 auto" }}
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={{ width: "100%", padding: "12px", marginBottom: "16px" }}
          />

          <button type="submit">Login</button>

          {message && <p style={{ marginTop: "12px" }}>{message}</p>}

          <p style={{ marginTop: "16px" }}>
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </>
  );
}