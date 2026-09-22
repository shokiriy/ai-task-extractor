import type { UiError } from '../api/apiError';

interface ErrorBannerProps {
  error: UiError;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-icon" aria-hidden="true">
        !
      </div>
      <div className="error-content">
        <strong>{error.title}</strong>
        <p>{error.message}</p>
      </div>
      {onDismiss ? (
        <button className="error-dismiss" type="button" onClick={onDismiss} aria-label="Dismiss error">
          ×
        </button>
      ) : null}
    </div>
  );
}
