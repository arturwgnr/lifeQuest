import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { AVATAR_STAGES } from "../constants/avatarStages.js";
import AuthLayout, { AuthField } from "./AuthLayout.jsx";
import AvatarBadge from "./AvatarBadge.jsx";
import BrandMark from "./BrandMark.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Auth.css";

const GENDER_OPTIONS = [
  { value: "NEUTRAL", label: "Neutral" },
  { value: "FEMININE", label: "Feminine" },
  { value: "MASCULINE", label: "Masculine" }
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("NEUTRAL");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async e => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register({ email, password, name, gender });
      navigate("/app");
    } catch (err) {
      setError(err instanceof TypeError ? "Network error. Check your connection and try again." : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card__header">
        <BrandMark size={44} />
        <h1>Create your quest log</h1>
        <p>A few details and your avatar starts its first stage.</p>
      </div>

      <div className="auth-card__avatar-preview">
        <AvatarBadge level={1} xp={0} size={64} gender={gender} />
        <div className="auth-card__avatar-text">
          <span className="auth-card__avatar-tier">Stage 1 of {AVATAR_STAGES.length}</span>
          <span className="auth-card__avatar-label">{name.trim() ? `${name.trim()}, the ${AVATAR_STAGES[0].name}` : AVATAR_STAGES[0].name}</span>
          <span className="auth-card__avatar-blurb">{AVATAR_STAGES[0].blurb}</span>
        </div>
      </div>

      <form onSubmit={handleRegister} className="auth-form">
        <AuthField label="Your Name" icon={User} required value={name} onChange={setName} placeholder="e.g., Artur Wagner" autoComplete="name" />
        <AuthField label="Account Email" icon={Mail} type="email" required value={email} onChange={setEmail} autoComplete="email" />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          required
          minLength={8}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />

        <fieldset className="auth-field auth-field--segmented">
          <legend>Avatar Gender Aesthetic</legend>
          <div className="auth-segmented" role="radiogroup">
            {GENDER_OPTIONS.map(option => (
              <label key={option.value} className={`auth-segmented__option${gender === option.value ? " auth-segmented__option--active" : ""}`}>
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={gender === option.value}
                  onChange={() => setGender(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="auth-card__xp-note">
          <CheckCircle2 size={16} />
          <p>
            <strong>XP is purely cosmetic.</strong> Finishing quests levels up how your avatar looks, never what you can do.
          </p>
        </div>

        {error && (
          <div className="auth-form__error" role="alert">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <button type="submit" className="auth-submit btn-lift" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoadingIndicator size="sm" tone="light" label="Forging..." />
          ) : (
            <>
              Forge Character &amp; Embark
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="auth-card__switch">
        Already have a quest log? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
