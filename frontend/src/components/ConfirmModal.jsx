import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/ConfirmModal.css";

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';

// Generic "are you sure" dialog for destructive, irreversible actions.
// Keyboard: Enter confirms (unless focus is on another button), Esc cancels,
// Tab stays trapped inside the dialog, and focus returns to whatever opened it.
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!isProcessing) onCancel();
      return;
    }
    if (e.key === "Enter") {
      // A focused button handles Enter natively (e.g. Cancel)
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (!isProcessing) onConfirm();
      return;
    }
    if (e.key === "Tab") {
      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && !isProcessing && onCancel()}
    >
      <div
        ref={dialogRef}
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="confirm-modal__header">
          <span className="confirm-modal__icon">
            <AlertTriangle size={18} />
          </span>
          <h2 id="confirm-modal-title">{title}</h2>
          <button type="button" onClick={onCancel} disabled={isProcessing} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div id="confirm-modal-message" className="confirm-modal__message">
          {message}
        </div>

        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__cancel"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-modal__confirm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? <LoadingIndicator size="sm" tone="light" label="Working..." /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
