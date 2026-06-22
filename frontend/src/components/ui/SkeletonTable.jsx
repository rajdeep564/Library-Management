import SkeletonRow from "./SkeletonRow";
import "./ui.css";

export default function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="gov-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table className="gov-table">
          <thead className="ui-skeleton-table-header">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <div className="ui-skeleton" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
