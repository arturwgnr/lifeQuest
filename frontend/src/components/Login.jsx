import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout, { AuthField } from "./AuthLayout.jsx";
import BrandMark from "./BrandMark.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
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
      setError(err instanceof TypeError ? "Network error. Check your connection and try again." : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card__header">
        <BrandMark size={44} />
        <h1>Welcome back</h1>
        <p>Sign in to pick up your quest log where you left it.</p>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        <AuthField label="Account Email" icon={Mail} type="email" required value={email} onChange={setEmail} autoComplete="email" />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          required
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {error && (
          <div className="auth-form__error" role="alert">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <button type="submit" className="auth-submit btn-lift" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoadingIndicator size="sm" tone="light" label="Signing in..." />
          ) : (
            <>
              Sign In to Quest Log
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="auth-card__switch">
        New here? <Link to="/register">Register a quest log</Link>
      </div>
    </AuthLayout>
  );
}
