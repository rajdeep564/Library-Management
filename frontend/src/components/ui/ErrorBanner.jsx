import { useState } from "react";
import "./ui.css";

export default function ErrorBanner({ message, onRetry }) {
  const [dismissed, setDismissed] = useState(false);
  if (!message || dismissed) return null;

  return (
    <div className="ui-error-banner animate-fadeIn" role="alert">
      <i className="bi bi-exclamation-circle ui-error-banner__icon" aria-hidden="true" />
      <div className="ui-error-banner__body">{message}</div>
      {onRetry && (
        <button type="button" className="ui-error-banner__retry" onClick={onRetry}>
          Try Again
        </button>
      )}
      <button
        type="button"
        className="btn-close"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        style={{ flexShrink: 0 }}
      />
    </div>
  );
}
