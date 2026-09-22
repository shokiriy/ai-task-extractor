interface LoadingStateProps {
  label: string;
  rows?: number;
}

export function LoadingState({ label, rows = 3 }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index} aria-hidden="true">
          <span className="skeleton-line skeleton-line-primary" />
          <span className="skeleton-line skeleton-line-secondary" />
        </div>
      ))}
    </div>
  );
}
