import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, Trophy, X } from "lucide-react";
import "../styles/Toaster.css";

const TONE_ICON = { success: CheckCircle2, error: AlertCircle, info: Info, level: Trophy };

function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);

  // Timer restarts from whatever is left whenever the toast un-pauses, so
  // hovering mid-way never resets it back to the full duration.
  useEffect(() => {
    if (toast.leaving || isPaused || !toast.duration) return undefined;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => onDismiss(toast.id), remainingRef.current);
    return () => {
      clearTimeout(timerRef.current);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    };
  }, [isPaused, toast.leaving, toast.duration, toast.id, onDismiss]);

  const Icon = toast.icon || TONE_ICON[toast.tone] || Info;

  const handleAction = () => {
    toast.action.onClick();
    onDismiss(toast.id);
  };

  return (
    <li
      className={`toast toast--${toast.tone}${toast.leaving ? " toast--leaving" : ""}${isPaused ? " toast--paused" : ""}`}
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <span className="toast__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="toast__body">
        <p className="toast__title">{toast.title}</p>
        {toast.description && <p className="toast__description">{toast.description}</p>}
      </div>
      {toast.action && (
        <button type="button" className="toast__action" onClick={handleAction}>
          {toast.action.label}
        </button>
      )}
      <button type="button" className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <X size={14} />
      </button>
      {toast.duration > 0 && (
        <span className="toast__timer" style={{ animationDuration: `${toast.duration}ms` }} aria-hidden="true" />
      )}
    </li>
  );
}

export default function Toaster({ toasts, onDismiss }) {
  return (
    <section className="toaster" aria-label="Notifications" aria-live="polite">
      <ol className="toaster__list">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </ol>
    </section>
  );
}
