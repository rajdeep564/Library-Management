import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Server_URL } from "../../utils/config";
import { asArray } from "../../utils/safeArray";
import FineCollectModal from "../../components/FineCollectModal";
import FineWaiveModal from "../../components/FineWaiveModal";
import { SkeletonCard, SkeletonTable, EmptyState, ErrorBanner, ButtonSpinner } from "../../components/ui";

function formatCurrency(paisa = 0) {
  return `₹${(Number(paisa || 0) / 100).toFixed(2)}`;
}

function fineBadge(status) {
  if (status === "PAID") return "badge-returned";
  if (status === "WAIVED") return "badge-pending";
  if (status === "UNPAID") return "badge-overdue";
  return "badge-issued";
}

export default function FineManagement() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("authToken");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [summary, setSummary] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [collectLoan, setCollectLoan] = useState(null);
  const [waiveLoan, setWaiveLoan] = useState(null);
  const [filters, setFilters] = useState({
    memberSearch: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    showPaid: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: 1,
        limit: 100,
        includePaid: filters.showPaid,
      };
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.minAmount) params.minAmount = Math.round(Number(filters.minAmount) * 100);

      const [summaryRes, loansRes] = await Promise.all([
        axios.get(`${Server_URL}fines/summary`, { headers }),
        axios.get(`${Server_URL}fines/outstanding`, { headers, params }),
      ]);
      setSummary(summaryRes.data);
      setLoans(asArray(loansRes.data.loans));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load fines";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters.fromDate, filters.toDate, filters.minAmount, filters.showPaid, headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLoans = asArray(loans).filter((loan) => {
    const term = filters.memberSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      loan.userId?.name?.toLowerCase().includes(term) ||
      loan.userId?.email?.toLowerCase().includes(term)
    );
  });

  const collectFine = async (paymentMethod) => {
    setActionLoading(true);
    try {
      await axios.post(
        `${Server_URL}fines/collect/${collectLoan._id}`,
        { paymentMethod },
        { headers }
      );
      toast.success(`Fine of ${formatCurrency(collectLoan.fineAmount)} collected successfully`);
      setCollectLoan(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to collect fine");
    } finally {
      setActionLoading(false);
    }
  };

  const waiveFine = async (reason) => {
    setActionLoading(true);
    try {
      await axios.post(
        `${Server_URL}fines/waive/${waiveLoan._id}`,
        { reason },
        { headers }
      );
      toast.success("Fine waived successfully");
      setWaiveLoan(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to waive fine");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-currency-rupee" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Fine Management
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Track outstanding, collected, and waived library fines
        </p>
      </div>

      <ErrorBanner message={error} onRetry={fetchData} />

      {loading && !summary ? (
        <SkeletonCard count={4} />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Total Outstanding", formatCurrency(summary?.totalOutstanding), "bi-exclamation-circle", "#c8102e"],
          ["Collected This Month", formatCurrency(summary?.totalCollectedThisMonth), "bi-cash-coin", "#276749"],
          ["Waived", formatCurrency(summary?.totalWaived), "bi-slash-circle", "#718096"],
          ["Overdue Count", summary?.overdueCount || 0, "bi-clock-history", "#b45309"],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="stat-card" style={{ borderLeftColor: color }}>
            <div className="stat-card-icon" style={{ background: color }}>
              <i className={`bi ${icon}`}></i>
            </div>
            <div>
              <div className="stat-card-value">{value}</div>
              <div className="stat-card-label">{label}</div>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className="gov-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <input
            className="gov-input"
            placeholder="Search member name/email"
            value={filters.memberSearch}
            onChange={(e) => setFilters((f) => ({ ...f, memberSearch: e.target.value }))}
          />
          <input
            className="gov-input"
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
          />
          <input
            className="gov-input"
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
          />
          <input
            className="gov-input"
            type="number"
            min="0"
            placeholder="Min amount (₹)"
            value={filters.minAmount}
            onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gov-text-secondary)" }}>
            <input
              type="checkbox"
              checked={filters.showPaid}
              onChange={(e) => setFilters((f) => ({ ...f, showPaid: e.target.checked }))}
            />
            Show paid/waived
          </label>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : filteredLoans.length === 0 ? (
        <EmptyState
          iconClass="bi-currency-rupee"
          title="No outstanding fines"
          message="All members are up to date"
        />
      ) : (
      <div className="gov-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Fine Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loan.userId?.name || "N/A"}</div>
                        <div style={{ fontSize: 11, color: "var(--gov-text-light)" }}>{loan.userId?.email}</div>
                      </td>
                      <td>{loan.bookId?.title || "N/A"}</td>
                      <td>{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString("en-IN") : "-"}</td>
                      <td>{loan.daysOverdue || 0}</td>
                      <td>{formatCurrency(loan.fineAmount)}</td>
                      <td><span className={fineBadge(loan.fineStatus)}>{loan.fineStatus}</span></td>
                      <td>
                        {loan.fineStatus === "UNPAID" ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <ButtonSpinner
                              variant="primary"
                              style={{ padding: "5px 10px", fontSize: 12 }}
                              onClick={() => setCollectLoan(loan)}
                            >
                              Collect Fine
                            </ButtonSpinner>
                            {role === "admin" && (
                              <ButtonSpinner
                                variant="secondary"
                                style={{ padding: "5px 10px", fontSize: 12 }}
                                onClick={() => setWaiveLoan(loan)}
                              >
                                Waive
                              </ButtonSpinner>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--gov-text-light)" }}>No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
      </div>
      )}

      <FineCollectModal
        loan={collectLoan}
        loading={actionLoading}
        onClose={() => setCollectLoan(null)}
        onConfirm={collectFine}
      />
      <FineWaiveModal
        loan={waiveLoan}
        loading={actionLoading}
        onClose={() => setWaiveLoan(null)}
        onConfirm={waiveFine}
      />
    </div>
  );
}
