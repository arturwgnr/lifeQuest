import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, User, Mail, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AvatarBadge from "./AvatarBadge.jsx";
import "../styles/Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("NEUTRAL");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register({ email, password, name, gender });
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__badge auth-card__badge--indigo">
            <Sparkles size={18} />
          </div>
          <h1>Create Your Quest Log</h1>
          <p>Configure your personal chronicle sentinel.</p>
        </div>

        <div className="auth-card__avatar-preview">
          <AvatarBadge level={1} xp={0} size={64} />
          <div>
            <span className="auth-card__avatar-tier">
              Level 1 Sentinel State
            </span>
            <span className="auth-card__avatar-label">Silent Silhouette</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label>Your Name</label>
            <div className="auth-field__input-wrap">
              <User size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Artur Wagner"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Account Email</label>
            <div className="auth-field__input-wrap">
              <Mail size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-field__input-wrap">
              <Lock size={16} />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Avatar Gender Aesthetic</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="NEUTRAL">Neutral</option>
              <option value="FEMININE">Feminine</option>
              <option value="MASCULINE">Masculine</option>
            </select>
          </div>

          <div className="auth-card__xp-note">
            <div className="auth-card__xp-note-title">
              <CheckCircle2 size={16} />
              Mechanism of Quest Progression
            </div>
            <p>
              Complete tasks to earn Experience Points (XP) and advance levels.
              XP is purely cosmetic &mdash; it only changes how your avatar
              looks, never what you can do.
            </p>
          </div>

          {error && <div className="auth-form__error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Forging..." : "Forge Character & Embark"}
          </button>
        </form>

        <div className="auth-card__switch">
          Already have a quest log? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
