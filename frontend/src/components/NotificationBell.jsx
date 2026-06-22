import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Server_URL } from "../utils/config";
import { asArray } from "../utils/safeArray";
import { Spinner, ButtonSpinner } from "./ui";

function timeAgo(dateValue) {
  const diff = Date.now() - new Date(dateValue).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day(s) ago`;
}

function typeIcon(type) {
  if (type === "OVERDUE") return "bi-exclamation-circle-fill";
  if (type === "DUE_TOMORROW") return "bi-clock-history";
  if (type === "FINE_REMINDER") return "bi-currency-rupee";
  return "bi-bell-fill";
}

export default function NotificationBell() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async (showPanelLoader = false) => {
    if (!token) return;
    if (showPanelLoader) setLoading(true);
    try {
      const [countRes, listRes] = await Promise.all([
        axios.get(`${Server_URL}notifications/unread-count`, { headers }),
        axios.get(`${Server_URL}notifications`, { headers }),
      ]);
      setCount(countRes.data.count || 0);
      setItems(asArray(listRes.data.notifications));
    } catch (err) {
      console.error("Failed to load notifications", err.response?.data?.message || err.message);
    } finally {
      if (showPanelLoader) setLoading(false);
    }
  }, [headers, token]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => fetchNotifications(), 60000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    const onClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!token) return null;

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications(true);
  };

  const markRead = async (item) => {
    try {
      await axios.put(`${Server_URL}notifications/${item._id}/read`, {}, { headers });
      fetchNotifications();
      if (item.type === "OVERDUE" || item.type === "FINE_REMINDER") {
        navigate(role === "user" ? "/user" : "/admin/fines");
      } else if (item.type === "DUE_TOMORROW") {
        navigate(role === "user" ? "/user" : "/admin/issued");
      }
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await axios.put(`${Server_URL}notifications/read-all`, {}, { headers });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          background: "var(--gov-bg)",
          border: "1px solid var(--gov-border)",
          borderRadius: 6,
          padding: "6px 10px",
          cursor: "pointer",
          position: "relative",
        }}
        aria-label="Notifications"
      >
        <i className="bi bi-bell" style={{ fontSize: 18, color: "var(--gov-primary)" }}></i>
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "var(--gov-danger)",
              color: "white",
              borderRadius: 999,
              fontSize: 10,
              minWidth: 18,
              height: 18,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 360,
            maxHeight: 420,
            overflow: "auto",
            background: "white",
            border: "1px solid var(--gov-border)",
            borderRadius: 8,
            boxShadow: "var(--gov-shadow-md)",
            zIndex: 200,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: "1px solid var(--gov-border)",
            }}
          >
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            {count > 0 && (
              <ButtonSpinner
                variant="secondary"
                loading={markingAll}
                style={{ padding: "2px 8px", fontSize: 11 }}
                onClick={markAllRead}
              >
                Mark all read
              </ButtonSpinner>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
              <Spinner size="sm" />
            </div>
          ) : asArray(items).length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--gov-text-light)", fontSize: 13 }}>
              <i className="bi bi-bell-slash" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
              No new notifications
            </div>
          ) : (
            asArray(items).map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => markRead(item)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom: "1px solid var(--gov-border)",
                  background: item.isRead ? "white" : "#ebf0f5",
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <i className={`bi ${typeIcon(item.type)}`} style={{ color: "var(--gov-primary)", marginTop: 2 }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--gov-text-secondary)", marginTop: 2 }}>
                      {(item.message || "").slice(0, 80)}{(item.message || "").length > 80 ? "..." : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gov-text-light)", marginTop: 4 }}>
                      {timeAgo(item.createdAt)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
