import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "Mr",
    first_name: "",
    middle_names: "",
    last_name: "",
    organisation_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "role") {
        if (value === "user") {
          updated.organisation_name = "";
        } else if (value === "creator") {
          updated.title = "Mr";
          updated.first_name = "";
          updated.middle_names = "";
          updated.last_name = "";
        }
      }

      return updated;
    });
  };

  const isValidName = (value) => /^[A-Za-z\s'-]+$/.test(value);
  const isValidOrgName = (value) => /^[A-Za-z0-9\s&'.,\-()]+$/.test(value);

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(formData.password),
    match:
      formData.confirmPassword.length > 0 &&
      formData.password === formData.confirmPassword,
  };

  const validate = () => {
    const role = formData.role.trim();
    const title = formData.title.trim();
    const firstName = formData.first_name.trim();
    const middleNames = formData.middle_names.trim();
    const lastName = formData.last_name.trim();
    const organisationName = formData.organisation_name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();
    const confirmPassword = formData.confirmPassword.trim();

    if (!role || !email || !password || !confirmPassword) {
      return "All required fields must be completed";
    }

    if (role === "user") {
      if (!title || !firstName || !lastName) {
        return "Title, first name and surname are required";
      }

      if (!["Mr", "Mrs", "Ms", "Miss", "Dr"].includes(title)) {
        return "Invalid title";
      }

      if (!isValidName(firstName)) {
        return "First name must only contain letters";
      }

      if (middleNames && !isValidName(middleNames)) {
        return "Middle names must only contain letters";
      }

      if (!isValidName(lastName)) {
        return "Last name must only contain letters";
      }
    }

    if (role === "creator") {
      if (!organisationName) {
        return "Organisation name is required";
      }

      if (!isValidOrgName(organisationName)) {
        return "Organisation name contains invalid characters";
      }
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Invalid email format";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }

    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
      return "Password must contain at least one special character";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      const payload =
        formData.role === "user"
          ? {
              role: "user",
              title: formData.title.trim(),
              first_name: formData.first_name.trim(),
              middle_names: formData.middle_names.trim(),
              last_name: formData.last_name.trim(),
              email: formData.email.trim().toLowerCase(),
              password: formData.password.trim(),
            }
          : {
              role: "creator",
              organisation_name: formData.organisation_name.trim(),
              email: formData.email.trim().toLowerCase(),
              password: formData.password.trim(),
            };

      const res = await api.post("/register", payload);

      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Registration failed");
    }
  };

  const checklistItemStyle = (passed) => ({
    color: passed ? "#4ade80" : "#f87171",
    marginBottom: "6px",
    listStyleType: "none",
  });

  const confirmPasswordStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    border:
      formData.confirmPassword.length === 0
        ? "1px solid #ccc"
        : passwordChecks.match
        ? "2px solid #4ade80"
        : "2px solid #f87171",
    outline: "none",
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
          <label style={{ marginBottom: "8px", display: "block" }}>
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

          {formData.role === "user" && (
            <>
              <select
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Miss">Miss</option>
                <option value="Dr">Dr</option>
              </select>

              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
              />

              <input
                type="text"
                name="middle_names"
                placeholder="Middle Name(s)"
                value={formData.middle_names}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
              />

              <input
                type="text"
                name="last_name"
                placeholder="Surname"
                value={formData.last_name}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
              />
            </>
          )}

          {formData.role === "creator" && (
            <input
              type="text"
              name="organisation_name"
              placeholder="Organisation Name"
              value={formData.organisation_name}
              onChange={handleChange}
              style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
            />
          )}

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

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={confirmPasswordStyle}
          />

          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: "14px",
              lineHeight: "1.6",
              textAlign: "left",
            }}
          >
            <strong>Password requirements:</strong>
            <ul style={{ marginTop: "8px", marginBottom: "0", paddingLeft: "0" }}>
              <li style={checklistItemStyle(passwordChecks.length)}>
                {passwordChecks.length ? "✅" : "❌"} At least 8 characters
              </li>
              <li style={checklistItemStyle(passwordChecks.uppercase)}>
                {passwordChecks.uppercase ? "✅" : "❌"} At least 1 uppercase letter
              </li>
              <li style={checklistItemStyle(passwordChecks.number)}>
                {passwordChecks.number ? "✅" : "❌"} At least 1 number
              </li>
              <li style={checklistItemStyle(passwordChecks.special)}>
                {passwordChecks.special ? "✅" : "❌"} At least 1 special character
              </li>
              <li style={checklistItemStyle(passwordChecks.match)}>
                {passwordChecks.match ? "✅" : "❌"} Passwords match
              </li>
            </ul>
          </div>

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