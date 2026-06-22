import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
const navItems = [
  { label: "Dashboard", path: "/admin", icon: "bi-speedometer2", roles: ["admin", "librarian"] },
  { label: "Books", path: "/admin/viewbook", icon: "bi-book", roles: ["admin", "librarian"] },
  { label: "Add Book", path: "/admin/addbook", icon: "bi-plus-circle", roles: ["admin", "librarian"] },
  { label: "Bulk Import", path: "/admin/books/bulk-import", icon: "bi-upload", roles: ["admin", "librarian"] },
  { label: "Issue Requests", path: "/admin/issuerequest", icon: "bi-arrow-down-circle", roles: ["librarian", "admin"] },
  { label: "Return Requests", path: "/admin/returnrequest", icon: "bi-arrow-up-circle", roles: ["librarian", "admin"] },
  { label: "Issued Books", path: "/admin/issued", icon: "bi-journal-check", roles: ["admin", "librarian"] },
  { label: "Add Librarian", path: "/admin/addlibrarian", icon: "bi-person-plus", roles: ["admin"] },
  { label: "Fines", path: "/admin/fines", icon: "bi-currency-rupee", roles: ["admin", "librarian"] },
  { label: "QR Codes", path: "/admin/qr-codes", icon: "bi-qr-code", roles: ["admin", "librarian"] },
  { label: "Reports", path: "/admin/reports", icon: "bi-file-earmark-bar-graph", roles: ["admin", "librarian"] },
  { label: "Audit Log", path: "/admin/auditlog", icon: "bi-shield-check", roles: ["admin"] },
  { label: "Settings", path: "/admin/settings", icon: "bi-gear", roles: ["admin"] },
  { label: "Send Alert", path: "/admin/send-notification", icon: "bi-megaphone", roles: ["admin"] },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("role");
    if (!token || !["admin", "librarian"].includes(userRole)) {
      navigate("/admin-login");
    } else {
      setRole(userRole);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    navigate("/admin-login");
  };

  const filtered = navItems.filter((n) => n.roles.includes(role));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gov-bg)" }}>
      <aside
        style={{
          width: sidebarOpen ? "var(--gov-sidebar-width)" : "64px",
          background: "var(--gov-primary)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s",
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 100,
          boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "0 16px",
            height: "var(--gov-header-height)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "var(--gov-accent)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className="bi bi-building" style={{ color: "white", fontSize: 18 }}></i>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                e-GranthaAlaya
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Library Management</div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div
            style={{
              margin: "12px 16px",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Logged in as
            </div>
            <div
              style={{
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "capitalize",
                marginTop: 2,
              }}
            >
              {role}
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {filtered.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: sidebarOpen ? "10px 20px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.75)",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  borderLeft: active ? "3px solid white" : "3px solid transparent",
                  transition: "all 0.15s",
                  textDecoration: "none",
                }}
              >
                <i className={`bi ${item.icon}`} style={{ fontSize: 18, flexShrink: 0 }}></i>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            margin: "12px 16px",
            padding: "10px",
            background: "rgba(200,16,46,0.8)",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            justifyContent: sidebarOpen ? "flex-start" : "center",
          }}
        >
          <i className="bi bi-box-arrow-right" style={{ fontSize: 16 }}></i>
          {sidebarOpen && "Logout"}
        </button>
      </aside>

      <div
        style={{
          marginLeft: sidebarOpen ? "var(--gov-sidebar-width)" : "64px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.25s",
        }}
      >
        <header
          style={{
            height: "var(--gov-header-height)",
            background: "white",
            borderBottom: "1px solid var(--gov-border)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "var(--gov-shadow-sm)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "var(--gov-text-secondary)",
              padding: 4,
            }}
          >
            <i className="bi bi-list"></i>
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gov-text-primary)" }}>
              Ahmedabad Municipal Library Network
            </div>
            <div style={{ fontSize: 11, color: "var(--gov-text-light)" }}>
              e-GranthaAlaya Digital Library Management System
            </div>
          </div>

          <NotificationBell />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "var(--gov-bg)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--gov-text-secondary)",
            }}
          >
            <i className="bi bi-person-circle" style={{ fontSize: 16, color: "var(--gov-primary)" }}></i>
            <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{role}</span>
          </div>
        </header>

        <main style={{ padding: 24, flex: 1 }} className="animate-fadeIn">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
