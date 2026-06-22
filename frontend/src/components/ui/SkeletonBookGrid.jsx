import "./ui.css";

export default function SkeletonBookGrid({ count = 8 }) {
  return (
    <div className="ui-book-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ui-book-skeleton-card">
          <div className="ui-skeleton ui-book-skeleton-cover" />
          <div className="ui-book-skeleton-body">
            <div className="ui-skeleton ui-skeleton-bar-lg" />
            <div className="ui-skeleton ui-skeleton-bar-sm" />
            <div className="ui-skeleton ui-skeleton-bar-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
