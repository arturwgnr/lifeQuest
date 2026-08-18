import "../styles/LoadingIndicator.css";

export default function LoadingIndicator({ variant = "inline", label, size = "md" }) {
  return (
    <div className={`loading-indicator loading-indicator--${variant} loading-indicator--${size}`}>
      <span className="loading-indicator__spinner" aria-hidden="true" />
      {label && <span className="loading-indicator__label">{label}</span>}
    </div>
  );
}
