import { useState } from "react";
import { ButtonSpinner } from "./ui";

function formatCurrency(paisa = 0) {
  return `₹${(Number(paisa || 0) / 100).toFixed(2)}`;
}

export default function FineWaiveModal({ loan, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  if (!loan) return null;
  const valid = reason.trim().length >= 10;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content gov-card" style={{ padding: 0 }}>
          <div className="modal-header" style={{ background: "var(--gov-accent)", color: "white" }}>
            <h5 className="modal-title">Waive Fine</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p><strong>Member:</strong> {loan.userId?.name || "N/A"}</p>
            <p><strong>Book:</strong> {loan.bookId?.title || "N/A"}</p>
            <p><strong>Fine Amount:</strong> {formatCurrency(loan.fineAmount)}</p>
            <label className="gov-label">Reason for Waiver</label>
            <textarea
              className="gov-input"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a clear reason for audit records"
            />
            {!valid && (
              <div style={{ fontSize: 12, color: "var(--gov-danger)", marginTop: 6 }}>
                Reason must be at least 10 characters.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-gov-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <ButtonSpinner
              type="button"
              variant="danger"
              loading={loading}
              disabled={!valid}
              onClick={() => onConfirm(reason)}
            >
              Confirm Waiver
            </ButtonSpinner>
          </div>
        </div>
      </div>
    </div>
  );
}
