import { useState } from "react";
import { ButtonSpinner } from "./ui";

function formatCurrency(paisa = 0) {
  return `₹${(Number(paisa || 0) / 100).toFixed(2)}`;
}

export default function FineCollectModal({ loan, onClose, onConfirm, loading }) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  if (!loan) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content gov-card" style={{ padding: 0 }}>
          <div className="modal-header" style={{ background: "var(--gov-primary)", color: "white" }}>
            <h5 className="modal-title">Collect Fine</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p><strong>Member:</strong> {loan.userId?.name || "N/A"}</p>
            <p><strong>Book:</strong> {loan.bookId?.title || "N/A"}</p>
            <p><strong>Due Date:</strong> {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString("en-IN") : "-"}</p>
            <p><strong>Days Overdue:</strong> {loan.daysOverdue || 0}</p>
            <p><strong>Fine Amount:</strong> {formatCurrency(loan.fineAmount)}</p>
            <label className="gov-label">Payment Method</label>
            <select className="gov-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-gov-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <ButtonSpinner type="button" loading={loading} onClick={() => onConfirm(paymentMethod)}>
              Confirm Collection
            </ButtonSpinner>
          </div>
        </div>
      </div>
    </div>
  );
}
