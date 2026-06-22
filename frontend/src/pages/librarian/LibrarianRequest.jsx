import React, { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { StatusBadge } from "../../utils/statusBadge";
import { asArray } from "../../utils/safeArray";
import { SkeletonTable, EmptyState, ErrorBanner, ButtonSpinner } from "../../components/ui";

export default function LibrarianRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = Server_URL + "librarian/issuerequest";
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setRequests(asArray(res.data.requests));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (id) => {
    setApprovingId(id);
    try {
      const url = Server_URL + "librarian/approverequest/" + id;
      const response = await axios.put(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      showSuccessToast(response.data.message || "Book issued successfully!");
      fetchRequests();
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.error || "Something went wrong";
        showErrorToast(message);
      } else {
        showErrorToast("Network error: " + err.message);
      }
      console.error("Error approving request:", err);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-arrow-down-circle" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Pending Book Requests
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Review and approve member issue requests
        </p>
      </div>

      <ErrorBanner message={error} onRetry={fetchRequests} />

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : asArray(requests).length === 0 ? (
        <EmptyState iconClass="bi-journal-bookmark" title="No active loans" message="No pending issue requests at this time" />
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
                  <th>Actions</th>
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
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <ButtonSpinner
                        className="btn-sm"
                        loading={approvingId === req._id}
                        onClick={() => approveRequest(req._id)}
                        style={{ padding: "4px 10px", fontSize: 12 }}
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Approve
                      </ButtonSpinner>
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
