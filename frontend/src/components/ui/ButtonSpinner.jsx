import "./ui.css";

const VARIANT_CLASS = {
  primary: "btn-gov-primary",
  danger: "btn-gov-danger",
  secondary: "btn-gov-outline",
};

export default function ButtonSpinner({
  onClick,
  loading = false,
  disabled = false,
  children,
  variant = "primary",
  className = "",
  type = "button",
  style = {},
  minWidth,
}) {
  const btnClass = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const spinnerClass =
    variant === "secondary" ? "spinner-border spinner-border-sm" : "spinner-border spinner-border-sm text-light";

  return (
    <button
      type={type}
      className={`${btnClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ minWidth: minWidth || style.minWidth, ...style }}
    >
      {loading && (
        <span
          className={spinnerClass}
          style={{ marginRight: 8, verticalAlign: "middle" }}
          role="status"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
