import "./ui.css";

export default function SkeletonRow({ cols = 4 }) {
  const widths = ["ui-skeleton-bar-md", "ui-skeleton-bar-lg", "ui-skeleton-bar-sm", "ui-skeleton-bar-md", "ui-skeleton-bar-full", "ui-skeleton-bar-sm"];

  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          {i === cols - 1 ? (
            <div style={{ display: "flex", gap: 8 }}>
              <span className="ui-skeleton ui-skeleton-btn" />
              <span className="ui-skeleton ui-skeleton-btn" />
            </div>
          ) : (
            <div className={`ui-skeleton ${widths[i % widths.length]}`} />
          )}
        </td>
      ))}
    </tr>
  );
}
