import "./ui.css";

export default function SkeletonCard({ count = 4 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
        gap: 14,
        marginBottom: 20,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="ui-skeleton" style={{ width: 48, height: 48, borderRadius: "var(--gov-radius)", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ui-skeleton ui-skeleton-bar-lg" />
            <div className="ui-skeleton ui-skeleton-bar-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
