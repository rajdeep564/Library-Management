import "./ui.css";

export default function Spinner({ size = "md", color = "primary", label, className = "" }) {
  const sizeClass = size === "sm" ? "spinner-border-sm" : "";
  const colorStyle =
    color === "white"
      ? { color: "#fff" }
      : { color: "var(--gov-primary)" };

  const dim =
    size === "lg" ? { width: 48, height: 48, borderWidth: 4 } : size === "sm" ? {} : { width: 32, height: 32 };

  return (
    <div className={`ui-spinner-wrap ${label ? "" : ""} ${className}`} role="status">
      <div
        className={`spinner-border ${sizeClass}`}
        style={{ ...colorStyle, ...dim }}
        aria-hidden="true"
      />
      {label && (
        <span className="ui-page-loader__text" style={{ marginTop: label ? 0 : undefined }}>
          {label}
        </span>
      )}
      <span className="visually-hidden">{label || "Loading"}</span>
    </div>
  );
}
