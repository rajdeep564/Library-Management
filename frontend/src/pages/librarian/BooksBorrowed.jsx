import React, { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { StatusBadge } from "../../utils/statusBadge";
import { asArray } from "../../utils/safeArray";
import { SkeletonTable, EmptyState, ErrorBanner } from "../../components/ui";

function displayStatus(req) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (req.dueDate && req.status === "Issued") {
    const due = new Date(req.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due < today) return "Overdue";
  }
  return req.status;
}

export default function BooksBorrowed() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = Server_URL + "librarian/bookissued";
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setRequests(asArray(res.data.requests));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load issued books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-journal-check" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Books Issued
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Currently issued books across the library network
        </p>
      </div>

      <ErrorBanner message={error} onRetry={fetchRequests} />

      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : asArray(requests).length === 0 ? (
        <EmptyState iconClass="bi-journal-bookmark" title="No issued books" message="No books are currently issued" />
      ) : (
        <div className="gov-card">
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Book Title</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>{req.userId?.name || "N/A"}</td>
                    <td>{req.bookId?.title || "N/A"}</td>
                    <td>{new Date(req.issueDate).toLocaleDateString()}</td>
                    <td>{new Date(req.dueDate).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={displayStatus(req)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
