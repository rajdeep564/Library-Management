import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Server_URL } from "../../utils/config";
import { asArray } from "../../utils/safeArray";
import { SkeletonCard, PageLoader, ErrorBanner } from "../../components/ui";

const COLORS = ["#1a3c6e", "#c8102e", "#276749", "#b45309", "#2b6cb0", "#6b46c1"];
const BAR_COLORS = ["#1a3c6e", "#2b6cb0", "#276749", "#c8102e", "#6b46c1"];

function countOverdue(requests) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (requests || []).filter((r) => {
    if (!r.dueDate) return false;
    const due = new Date(r.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;
}

function sumFines(requests) {
  return (requests || []).reduce((sum, r) => sum + (r.fine || r.fineAmount || 0), 0);
}

function formatCurrency(paisa = 0) {
  return `₹${(Number(paisa || 0) / 100).toFixed(2)}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    issuedBooks: 0,
    totalMembers: 0,
    overdueBooks: 0,
    fineCollected: 0,
    pendingRequests: 0,
  });
  const [categoryData, setCategoryData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    setError(null);
    try {
        const [homeRes, usersRes, issuedRes, pendingRes, returnRes] = await Promise.all([
          axios.get(`${Server_URL}home/`, { headers }),
          axios.get(`${Server_URL}users`, { headers }).catch(() => ({ data: { user: [] } })),
          axios.get(`${Server_URL}librarian/bookissued`, { headers }).catch(() => ({ data: { requests: [] } })),
          axios.get(`${Server_URL}librarian/issuerequest`, { headers }).catch(() => ({ data: { requests: [] } })),
          axios.get(`${Server_URL}librarian/returnrequest`, { headers }).catch(() => ({ data: { requests: [] } })),
        ]);

        const home = homeRes.data;
        const users = asArray(usersRes.data.user);
        const issued = asArray(issuedRes.data.requests);
        const pending = asArray(pendingRes.data.requests);
        const returns = asArray(returnRes.data.requests);

        const totalBooks = home.stats?.totalBooks ?? 0;
        const totalMembers = users.filter((u) => u.role === "user").length;
        const issuedBooks = issued.length;
        const pendingRequests = pending.length;
        const overdueBooks = countOverdue(issued);
        const fineCollected = sumFines(returns);

        setStats({
          totalBooks,
          issuedBooks,
          totalMembers,
          overdueBooks,
          fineCollected,
          pendingRequests,
        });

        const cats = asArray(home.categories).map((c) => ({
          name: c.category || c._id || "Unknown",
          value: c.count || c.value || 0,
        }));
        setCategoryData(cats);

        setBarData([
          { name: "Total", value: totalBooks },
          { name: "Issued", value: issuedBooks },
          { name: "Members", value: totalMembers },
          { name: "Overdue", value: overdueBooks },
          { name: "Pending", value: pendingRequests },
        ]);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Books", value: stats.totalBooks, icon: "bi-book-fill", color: "#1a3c6e" },
    { label: "Books Issued", value: stats.issuedBooks, icon: "bi-arrow-right-circle-fill", color: "#2b6cb0" },
    { label: "Total Members", value: stats.totalMembers, icon: "bi-people-fill", color: "#276749" },
    { label: "Overdue Books", value: stats.overdueBooks, icon: "bi-exclamation-circle-fill", color: "#c8102e" },
    { label: "Fine Collected (₹)", value: formatCurrency(stats.fineCollected), icon: "bi-cash-coin", color: "#b45309" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: "bi-hourglass-split", color: "#6b46c1" },
  ];

  return (
    <div>
      <ErrorBanner message={error} onRetry={fetchData} />
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 20, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-speedometer2" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Dashboard Overview
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Ahmedabad Municipal Library Network — Real-time system summary
        </p>
      </div>

      {loading ? (
        <SkeletonCard count={6} />
      ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {statCards.map((card, i) => (
          <div key={i} className="stat-card" style={{ borderLeftColor: card.color }}>
            <div className="stat-card-icon" style={{ background: card.color }}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
      )}

      {loading ? (
        <PageLoader label="Loading charts..." />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="gov-card">
          <div className="gov-card-header">
            <i className="bi bi-pie-chart-fill"></i>
            Books by Category
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                  fontSize={11}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gov-text-light)",
                fontSize: 13,
              }}
            >
              No category data available
            </div>
          )}
        </div>

        <div className="gov-card">
          <div className="gov-card-header">
            <i className="bi bi-bar-chart-fill"></i>
            Circulation Overview
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: "#6b7280" }} />
              <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                fill={BAR_COLORS[0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      <div className="gov-card">
        <div className="gov-card-header">
          <i className="bi bi-lightning-fill"></i>
          Quick Actions
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Add New Book", icon: "bi-plus-circle", path: "/admin/addbook" },
            { label: "Bulk Import", icon: "bi-upload", path: "/admin/books/bulk-import" },
            { label: "Issue Requests", icon: "bi-arrow-down-circle", path: "/admin/issuerequest" },
            { label: "Return Requests", icon: "bi-arrow-up-circle", path: "/admin/returnrequest" },
            { label: "View Books", icon: "bi-book", path: "/admin/viewbook" },
            { label: "Issued Books", icon: "bi-journal-check", path: "/admin/issued" },
            { label: "Fine Management", icon: "bi-currency-rupee", path: "/admin/fines" },
            { label: "QR Codes", icon: "bi-qr-code", path: "/admin/qr-codes" },
            { label: "Reports", icon: "bi-file-earmark-bar-graph", path: "/admin/reports" },
            ...(localStorage.getItem("role") === "admin"
              ? [
                  { label: "Audit Log", icon: "bi-shield-check", path: "/admin/auditlog" },
                  { label: "Send Alert", icon: "bi-megaphone", path: "/admin/send-notification" },
                  { label: "Settings", icon: "bi-gear", path: "/admin/settings" },
                ]
              : []),
          ].map((a, i) => (
            <Link
              key={i}
              to={a.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "var(--gov-bg)",
                border: "1px solid var(--gov-border)",
                borderRadius: 6,
                color: "var(--gov-text-primary)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              <i className={`bi ${a.icon}`} style={{ color: "var(--gov-primary)", fontSize: 16 }}></i>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
