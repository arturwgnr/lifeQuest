import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
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
          <div className="auth-card__badge">
            <Shield size={18} />
          </div>
          <h1>lifeQuest</h1>
          <p>Secure Accountability Log &amp; Productivity Engine</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label>Account Email</label>
            <div className="auth-field__input-wrap">
              <Mail size={16} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-field__input-wrap">
              <Lock size={16} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          {error && <div className="auth-form__error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In to Quest Log"}
          </button>
        </form>

        <div className="auth-card__switch">
          New here? <Link to="/register">Register a quest log</Link>
        </div>
      </div>
    </div>
  );
}
