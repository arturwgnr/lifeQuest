import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Toaster from "../components/Toaster.jsx";

const ToastContext = createContext(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 220;
const DEFAULT_DURATION = { success: 4500, info: 4500, error: 7000, level: 6500 };

// One app-wide toast stack. Screens call useToast() and never render their
// own notification UI. A toast can carry one action ("View", "Undo"...),
// is always manually dismissable, and pauses its timer on hover/focus
// (the timer itself lives in Toaster so pausing stays per-toast).
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback(id => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), EXIT_MS);
  }, []);

  const show = useCallback(options => {
    idRef.current += 1;
    const id = idRef.current;
    const tone = options.tone || "info";
    const toast = {
      id,
      tone,
      title: options.title,
      description: options.description || null,
      action: options.action || null,
      icon: options.icon || null,
      duration: options.duration ?? DEFAULT_DURATION[tone] ?? 4500,
      leaving: false
    };
    // Oldest toasts fall off the stack instead of piling up past the limit
    setToasts(prev => [...prev.filter(t => !t.leaving).slice(-(MAX_VISIBLE - 1)), toast]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (title, options = {}) => show({ ...options, title, tone: "success" }),
      error: (title, options = {}) => show({ ...options, title, tone: "error" }),
      info: (title, options = {}) => show({ ...options, title, tone: "info" }),
      level: (title, options = {}) => show({ ...options, title, tone: "level" })
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Daily AI cap comes back as a 429 with error "ai_limit_reached"; every other
// failure shows its own message. Shared so every screen words it the same way.
export function errorToastFor(toast, err, fallbackTitle = "Something went wrong") {
  if (err?.status === 429 || err?.data?.error === "ai_limit_reached") {
    return toast.error("Daily AI limit reached", {
      description: "You've used today's Oracle credits. More arrive tomorrow."
    });
  }
  const offline = err instanceof TypeError || err?.message === "Failed to fetch";
  return toast.error(fallbackTitle, {
    description: offline ? "Network error. Check your connection and try again." : err?.message
  });
}
