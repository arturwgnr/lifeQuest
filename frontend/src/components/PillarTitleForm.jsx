import { useState } from "react";
import { Check, X } from "lucide-react";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/PillarTitleForm.css";

// The one pillar input used everywhere a single pillar is added or renamed
// (group list, daily report). Enter saves, Esc cancels. onSubmit may be async;
// the form stays open with the text if it throws.
export default function PillarTitleForm({
  initialTitle = "",
  placeholder = "Pillar title",
  submitLabel = "Save",
  onSubmit,
  onCancel,
  isSaving = false
}) {
  const [title, setTitle] = useState(initialTitle);
  const trimmed = title.trim();
  const canSubmit = Boolean(trimmed) && trimmed !== initialTitle.trim() && !isSaving;

  const submit = async e => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit(trimmed);
    } catch {
      // The caller already surfaced the error as a toast
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (!isSaving) onCancel();
    }
  };

  return (
    <form className="pillar-title-form" onSubmit={submit}>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={120}
        autoFocus
        disabled={isSaving}
      />
      <button type="button" className="pillar-title-form__cancel" onClick={onCancel} disabled={isSaving} aria-label="Cancel">
        <X size={14} />
      </button>
      <button type="submit" className="pillar-title-form__save" disabled={!canSubmit}>
        {isSaving ? (
          <LoadingIndicator size="sm" tone="light" label="Saving..." />
        ) : (
          <>
            <Check size={14} />
            <span>{submitLabel}</span>
          </>
        )}
      </button>
    </form>
  );
}
