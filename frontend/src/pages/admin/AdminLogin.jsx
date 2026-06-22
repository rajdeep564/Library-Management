import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Server_URL } from "../../utils/config";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${Server_URL}admin/login`, form);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("role", data.user.role);
      toast.success("Login successful");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--gov-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            background: "var(--gov-primary)",
            color: "white",
            padding: "24px 32px",
            borderRadius: "12px 12px 0 0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--gov-accent)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <i className="bi bi-building" style={{ fontSize: 26 }}></i>
          </div>
          <h5 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
            Ahmedabad Municipal Library Network
          </h5>
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.8 }}>
            e-GranthaAlaya — Staff Portal
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "28px 32px",
            borderRadius: "0 0 12px 12px",
            boxShadow: "var(--gov-shadow-lg)",
            border: "1px solid var(--gov-border)",
            borderTop: "none",
          }}
        >
          <h6
            style={{
              fontWeight: 600,
              color: "var(--gov-text-primary)",
              marginBottom: 20,
              fontSize: 15,
            }}
          >
            <i className="bi bi-shield-lock" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
            Staff / Administrator Login
          </h6>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="gov-label">Email Address</label>
              <input
                className="gov-input"
                type="email"
                placeholder="admin@library.gov.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="gov-label">Password</label>
              <input
                className="gov-input"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-gov-primary"
              style={{ width: "100%", padding: "11px", fontSize: 14 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: 12,
              color: "var(--gov-text-light)",
            }}
          >
            Member of the library?{" "}
            <Link to="/login" style={{ color: "var(--gov-primary)", fontWeight: 600 }}>
              Member Login
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--gov-text-light)" }}>
          © 2024 Ahmedabad Municipal Library Network. All rights reserved.
        </p>
      </div>
    </div>
  );
}
