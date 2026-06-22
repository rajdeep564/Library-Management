import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <>
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <span>
            <i className="bi bi-building me-1"></i>
            Ahmedabad Municipal Library Network
          </span>
          <span className="gov-top-bar-tag">Government of Gujarat Initiative</span>
        </div>
      </div>

      <nav className="gov-navbar navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <Link className="navbar-brand gov-navbar-brand" to="/">
            <div className="gov-brand-icon">
              <i className="bi bi-book-half"></i>
            </div>
            <div className="gov-brand-text">
              <span className="gov-brand-title">e-GranthaAlaya</span>
              <span className="gov-brand-subtitle">Digital Library Management</span>
            </div>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/books" onClick={() => setMenuOpen(false)}>Books</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/category" onClick={() => setMenuOpen(false)}>Category</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/aboutus" onClick={() => setMenuOpen(false)}>About</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/contactus" onClick={() => setMenuOpen(false)}>Contact</Link>
              </li>
            </ul>

            <ul className="navbar-nav gov-navbar-auth">
              {token && (
                <li className="nav-item d-flex align-items-center me-2">
                  <NotificationBell />
                </li>
              )}
              {token ? (
                <li className="nav-item dropdown">
                  <button
                    className="btn gov-profile-btn dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    Profile
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" to="/user">My Profile</Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="btn gov-login-btn me-2" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn gov-signup-btn" to="/register">Signup</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
