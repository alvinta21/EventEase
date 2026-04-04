import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
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
      const res = await api.post("/register", formData);
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Create Your Account</h1>

        <form
          onSubmit={handleSubmit}
          className="event-card"
          style={{ maxWidth: "500px", margin: "0 auto" }}
        >
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
          />

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
            style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            Choose account type
          </label>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{ width: "100%", padding: "12px", marginBottom: "16px" }}
          >
            <option value="user">Ticket Buyer</option>
            <option value="creator">Event Creator</option>
          </select>

          <button type="submit">Register</button>

          {message && <p style={{ marginTop: "12px" }}>{message}</p>}

          <p style={{ marginTop: "16px" }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </>
  );
}