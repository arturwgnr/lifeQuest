import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff, Lock, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/DeleteAccountModal.css";

// Two steps: a warm (and honest) farewell, then real re-authentication -
// current password plus a typed phrase (the account name or DELETE) before
// the destructive button enables. Cancel is always as easy as continuing.
export default function DeleteAccountModal({ onClose }) {
  const { user, deleteAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState("farewell");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [errors, setErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const passwordRef = useRef(null);

  const firstName = user.name.trim().split(/\s+/)[0];
  const phraseMatches =
    phrase.trim() === "DELETE" || phrase.trim() === user.name.trim();
  const canDelete = password.length > 0 && phraseMatches && !isDeleting;

  useEffect(() => {
    if (step === "confirm") passwordRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDeleting, onClose]);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canDelete) return;
    setErrors({});
    setIsDeleting(true);
    try {
      await deleteAccount({ password, confirmation: phrase.trim() });
      navigate("/", { replace: true });
      toast.info("Your account was deleted", {
        description: `Everything is gone for good. Safe travels, ${firstName}.`,
        duration: 8000,
      });
    } catch (err) {
      setIsDeleting(false);
      if (err.data?.field === "password") {
        setErrors({
          password: "That password isn't right. Nothing was deleted.",
        });
      } else if (err.data?.field === "confirmation") {
        setErrors({ phrase: "The phrase doesn't match. Nothing was deleted." });
      } else if (err instanceof TypeError) {
        setErrors({
          form: "Network error. Nothing was deleted, check your connection and try again.",
        });
      } else {
        setErrors({
          form: err.message || "Something went wrong. Nothing was deleted.",
        });
      }
    }
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !isDeleting && onClose()
      }
    >
      <div
        className="delete-account"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <button
          type="button"
          className="delete-account__close"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === "farewell" ? (
          <>
            <div className="delete-account__hero">
              <img
                src="/img/mascot.png"
                alt=""
                className="delete-account__mascot"
              />
            </div>
            <h2 id="delete-account-title">
              Wait, you&apos;re leaving the Quest?!
            </h2>
            <p className="delete-account__lead">
              This place will be much quieter without someone like you,{" "}
              {firstName}... The Oracle has witnessed countless endings, but
              yours shall echo through eternity.
            </p>
            <p className="delete-account__lead">
              The universe keeps no record of those who leave.
            </p>

            <div className="delete-account__warning">
              <AlertTriangle size={16} />
              <p>
                <strong>This cannot be undone.</strong> Your quests, chains,
                categories, Oracle conversations, pillars, journal entries,
                status history, XP and avatar are permanently deleted.
              </p>
            </div>

            <div className="delete-account__actions">
              <button
                type="button"
                className="delete-account__cancel"
                onClick={onClose}
              >
                Stay, I&apos;ll keep questing
              </button>
              <button
                type="button"
                className="delete-account__continue"
                onClick={() => setStep("confirm")}
              >
                Continue to delete
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleDelete} noValidate>
            <span className="delete-account__step">
              Step 2 of 2 · Confirm it&apos;s really you
            </span>
            <h2 id="delete-account-title">Permanently delete your account</h2>
            <p className="delete-account__lead">
              Enter your password and type <code>DELETE</code> (or your account
              name, <code>{user.name}</code>) to unlock the final button. This
              cannot be undone.
            </p>

            <div
              className={`delete-account__field${errors.password ? " delete-account__field--error" : ""}`}
            >
              <label htmlFor="delete-password">Current password</label>
              <div className="delete-account__input">
                <Lock size={15} />
                <input
                  id="delete-password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isDeleting}
                />
                <button
                  type="button"
                  className="delete-account__reveal"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="delete-account__error">{errors.password}</p>
              )}
            </div>

            <div
              className={`delete-account__field${errors.phrase ? " delete-account__field--error" : ""}`}
            >
              <label htmlFor="delete-phrase">
                Type DELETE or your account name
              </label>
              <div className="delete-account__input">
                <input
                  id="delete-phrase"
                  type="text"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isDeleting}
                  placeholder="DELETE"
                />
              </div>
              {errors.phrase && (
                <p className="delete-account__error">{errors.phrase}</p>
              )}
            </div>

            {errors.form && (
              <div className="delete-account__form-error" role="alert">
                <AlertTriangle size={15} />
                {errors.form}
              </div>
            )}

            <div className="delete-account__actions">
              <button
                type="button"
                className="delete-account__cancel"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel, keep my account
              </button>
              <button
                type="submit"
                className="delete-account__destroy"
                disabled={!canDelete}
              >
                {isDeleting ? (
                  <LoadingIndicator
                    size="sm"
                    tone="light"
                    label="Deleting..."
                  />
                ) : (
                  "Permanently delete account"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
