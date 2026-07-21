import { AlertTriangle, X } from "lucide-react";
import "../styles/ConfirmModal.css";

// Generic "are you sure" dialog for destructive, irreversible actions.
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="confirm-modal">
        <div className="confirm-modal__header">
          <span className="confirm-modal__icon">
            <AlertTriangle size={18} />
          </span>
          <h2>{title}</h2>
          <button type="button" onClick={onCancel} disabled={isProcessing}>
            <X size={18} />
          </button>
        </div>

        <p className="confirm-modal__message">{message}</p>

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
            {isProcessing ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
