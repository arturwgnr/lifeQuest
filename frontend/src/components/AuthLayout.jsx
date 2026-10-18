import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Sparkles, Siren, Link2 } from "lucide-react";
import BrandMark from "./BrandMark.jsx";
import AvatarBadge from "./AvatarBadge.jsx";
import "../styles/Auth.css";

const FEATURES = [
  { icon: Siren, title: "Needs attention today", text: "Overdue and stuck quests rise to the top on their own." },
  { icon: Link2, title: "Quest chains", text: "Break big goals into steps and watch the chain fill up." },
  { icon: Sparkles, title: "The Oracle", text: "Talk through your day. Nothing is filed until you approve it." }
];

// Shared shell for Login and Register: a brand panel on desktop, a single
// focused column on phones. Both pages keep their own form markup.
export default function AuthLayout({ children }) {
  return (
    <div className="auth-screen">
      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside__glow" />
        <div className="auth-aside__grid" />

        <Link to="/" className="auth-aside__brand" tabIndex={-1}>
          <BrandMark size={36} tone="amber" withName />
        </Link>

        <div className="auth-aside__copy">
          <span className="auth-aside__eyebrow">Quest Intelligence</span>
          <h2>
            See what needs you today, <em>and what you keep avoiding.</em>
          </h2>
          <ul className="auth-aside__features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="auth-aside__feature-icon">
                  <Icon size={15} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-aside__progression">
          {[1, 3, 5, 8].map(stage => (
            <AvatarBadge key={stage} stage={stage} level={1} size={stage === 8 ? 46 : 38} showLevel={false} showProgress={false} />
          ))}
          <span>Your avatar evolves as you finish real work.</span>
        </div>
      </aside>

      <main className="auth-main">
        <Link to="/" className="auth-main__back">
          <ArrowLeft size={14} />
          Back to home
        </Link>
        <div className="auth-card animate-slide-in-up">{children}</div>
      </main>
    </div>
  );
}

export function AuthField({ label, icon: Icon, type = "text", value, onChange, error, autoComplete, ...inputProps }) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const id = `auth-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={`auth-field${error ? " auth-field--error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="auth-field__input-wrap">
        <Icon size={16} />
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-field__reveal"
            onClick={() => setRevealed(r => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="auth-field__error">{error}</p>}
    </div>
  );
}
