import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { StatusBadge } from "../../utils/statusBadge";
import { asArray } from "../../utils/safeArray";
import { SkeletonTable, EmptyState, ErrorBanner, ButtonSpinner } from "../../components/ui";

export default function ReturnRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = Server_URL + "librarian/returnrequest";
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setRequests(asArray(res.data.requests));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (request) => {
    setApprovingId(request._id);
    try {
      const url = Server_URL + "librarian/approvereturnrequest/" + request._id;
      const response = await axios.put(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      showSuccessToast(response.data.message || "Book returned successfully!");
      setRequests((prev) => prev.filter((req) => req._id !== request._id));
      if ((request.fine || 0) > 0) {
        navigate("/admin/fines");
      }
    } catch (err) {
      console.error("Error approving request", err);
      showErrorToast("Failed to approve request");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-arrow-up-circle" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Return Book Requests
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Approve member return requests and record fines
        </p>
      </div>

      <ErrorBanner message={error} onRetry={fetchRequests} />

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : asArray(requests).length === 0 ? (
        <EmptyState iconClass="bi-arrow-return-left" title="No return requests" message="No pending return requests at this time" />
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
                  <th>Fine</th>
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
                    <td>₹{((req.fine ?? 0) / 100).toFixed(2)}</td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <ButtonSpinner
                        className="btn-sm"
                        loading={approvingId === req._id}
                        onClick={() => approveRequest(req)}
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
