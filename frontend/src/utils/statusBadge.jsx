export function StatusBadge({ status }) {
  const s = status || "";
  if (s === "Issued") return <span className="badge-issued">Issued</span>;
  if (s === "Returned") return <span className="badge-returned">Returned</span>;
  if (s === "Overdue") return <span className="badge-overdue">Overdue</span>;
  if (s === "Requested" || s === "Requested Return" || s === "Pending")
    return <span className="badge-pending">{s}</span>;
  return <span className="badge-pending">{s}</span>;
}
