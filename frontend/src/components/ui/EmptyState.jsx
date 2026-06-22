import ButtonSpinner from "./ButtonSpinner";
import "./ui.css";

export default function EmptyState({ iconClass = "bi-inbox", title, message, action }) {
  return (
    <div className="ui-empty-state gov-card animate-fadeIn">
      <i className={`bi ${iconClass} ui-empty-state__icon`} aria-hidden="true" />
      <div className="ui-empty-state__title">{title}</div>
      {message && <div className="ui-empty-state__message">{message}</div>}
      {action && (
        <ButtonSpinner variant="primary" onClick={action.onClick}>
          {action.label}
        </ButtonSpinner>
      )}
    </div>
  );
}
