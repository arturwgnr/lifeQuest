import "../styles/LoadingIndicator.css";

// Shared loading treatment for the whole app.
// - inline: spinner + optional label, sits in a row (buttons, status lines)
// - panel: centered block for a section/page that has nothing to show yet
// - tone="light": for use on dark/ink buttons
// - overlay: floating pill over content that stays rendered underneath while
//   it saves; the parent needs `position: relative`
export default function LoadingIndicator({ variant = "inline", label, size = "md", tone }) {
  return (
    <div
      className={`loading-indicator loading-indicator--${variant} loading-indicator--${size}${tone === "light" ? " loading-indicator--light" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-indicator__pill">
        <span className="loading-indicator__spinner" aria-hidden="true">
          <span className="loading-indicator__orbit" />
        </span>
        {label ? <span className="loading-indicator__label">{label}</span> : <span className="loading-indicator__sr">Loading</span>}
      </span>
    </div>
  );
}
