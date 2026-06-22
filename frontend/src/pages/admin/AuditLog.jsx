import { useState, useEffect } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { asArray } from "../../utils/safeArray";
import { SkeletonTable, EmptyState, ErrorBanner } from "../../components/ui";

const ACTION_COLORS = {
  USER_REGISTERED: "badge-issued",
  USER_LOGIN: "badge-issued",
  BOOK_ADDED: "badge-returned",
  BOOK_DELETED: "badge-overdue",
  BOOK_ISSUE_APPROVED: "badge-issued",
  BOOK_RETURN_APPROVED: "badge-returned",
  FINE_CALCULATED: "badge-overdue",
  LIBRARIAN_ADDED: "badge-pending",
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [error, setError] = useState(null);

  const fetchLogs = async (p = 1, action = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const params = { page: p, limit: 50 };
      if (action) params.action = action;
      const { data } = await axios.get(`${Server_URL}audit/`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setLogs(asArray(data.logs));
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, filterAction);
  }, [page, filterAction]);

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-shield-check" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          System Audit Log
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Complete record of all actions performed in the system
        </p>
      </div>

      <div className="gov-card" style={{ marginBottom: 16, padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="gov-input"
            style={{ maxWidth: 240 }}
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            {[
              "USER_REGISTERED",
              "USER_LOGIN",
              "BOOK_ADDED",
              "BOOK_DELETED",
              "BOOK_ISSUE_APPROVED",
              "BOOK_RETURN_APPROVED",
              "FINE_CALCULATED",
              "LIBRARIAN_ADDED",
            ].map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: "var(--gov-text-light)" }}>
            Showing page {page} of {totalPages}
          </span>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={() => fetchLogs(page, filterAction)} />

      {loading ? (
        <SkeletonTable rows={10} cols={7} />
      ) : (
      <div className="gov-card" style={{ padding: 0, overflow: "hidden" }}>
        {asArray(logs).length === 0 ? (
          <EmptyState
            iconClass="bi-clipboard-data"
            title="No audit logs found"
            message="Try adjusting the date range or action filter"
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                  {logs.map((log, i) => (
                    <tr key={log._id}>
                      <td style={{ color: "var(--gov-text-light)", fontSize: 12 }}>{(page - 1) * 50 + i + 1}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(log.timestamp)}</td>
                      <td>
                        <span className={ACTION_COLORS[log.action] || "badge-pending"} style={{ fontSize: 11 }}>
                          {log.action?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{log.performedByName || "System"}</td>
                      <td>
                        <span style={{ textTransform: "capitalize", fontSize: 12, color: "var(--gov-text-secondary)" }}>
                          {log.performedByRole}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          maxWidth: 280,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {log.details}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--gov-text-light)", fontFamily: "monospace" }}>
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && asArray(logs).length > 0 && (
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              gap: 8,
              justifyContent: "center",
              borderTop: "1px solid var(--gov-border)",
            }}
          >
            <button
              className="btn-gov-outline"
              style={{ padding: "5px 14px", fontSize: 12 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <i className="bi bi-chevron-left"></i> Prev
            </button>
            <span style={{ padding: "5px 12px", fontSize: 13, color: "var(--gov-text-secondary)" }}>
              Page {page} / {totalPages}
            </span>
            <button
              className="btn-gov-outline"
              style={{ padding: "5px 14px", fontSize: 12 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
