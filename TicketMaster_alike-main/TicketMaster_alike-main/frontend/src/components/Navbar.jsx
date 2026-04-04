import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">EventEase</div>

      <div className="navbar-links">
        <Link to="/">Home</Link>

        {user && user.role === "user" && <Link to="/my-tickets">My Tickets</Link>}
        {user && user.role === "creator" && <Link to="/dashboard">Dashboard</Link>}

        {!user && <Link to="/register">Register</Link>}
        {!user && <Link to="/login">Login</Link>}

        {/* {user && <span className="navbar-user">Hi, {user.username}</span>} */}
        {user && <button onClick={handleLogout}>Logout</button>}
      </div>
    </nav>
  );
}