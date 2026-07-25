import { useState } from "react";
import { Link } from "react-router-dom";
import TypewriterWord from "./TypewriterWord";
import {
  Compass,
  AlertCircle,
  GitPullRequest,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Shield,
  ArrowRight,
  Mic,
  CheckCircle2,
  Circle,
  Check,
  X,
  BarChart3,
  Award,
  LogIn,
  UserPlus,
} from "lucide-react";
import "../styles/Landing.css";

const FEATURES = [
  {
    icon: AlertCircle,
    title: "Needs attention today",
    copy: "Overdue tasks and anything quietly stuck get flagged automatically, procrastination stops hiding at the bottom of a long list.",
  },
  {
    icon: GitPullRequest,
    title: "Real dependency chains",
    copy: "Break a goal into steps that actually depend on each other, and see the whole chain's progress at a glance, not just isolated checkboxes.",
  },
  {
    icon: Sparkles,
    title: "The Oracle turns talk into tasks",
    copy: "Narrate your day like you would to a person. The Oracle turns it into structured, categorized tasks, and asks before assuming anything's already done.",
  },
  {
    icon: ShieldCheck,
    title: "You approve everything",
    copy: "No task, edit, or status change happens without you. The Oracle proposes; you decide.",
  },
];

const STEPS = [
  {
    icon: Mic,
    title: "Narrate your day",
    copy: "Tell the Oracle what you did, what's stuck, and what's next, type it or say it.",
  },
  {
    icon: CheckCircle2,
    title: "Review & approve",
    copy: "The Oracle turns that into task suggestions. Nothing's saved until you approve, edit, or reject it.",
  },
  {
    icon: BarChart3,
    title: "Track real progress",
    copy: "Categories, chains, and a quiet XP counter keep the full picture visible, without turning work into a game.",
  },
];

const STEP_PREVIEWS = [
  {
    kind: "narrate",
    label: "New entry",
  },
  {
    kind: "review",
    label: "3 suggestions",
    suggestions: [
      {
        title: "Book the dentist appointment",
        category: "Health",
        avoided: true,
      },
      {
        title: "Reply to Mom about the weekend",
        category: "Personal",
        avoided: false,
      },
    ],
  },
  {
    kind: "track",
    label: "Today",
    tasks: [
      { title: "Draft quarterly review", done: true },
      { title: "Schedule the car inspection", done: false },
      { title: "Book dentist follow-up", done: false },
    ],
  },
];

export default function Landing() {
  const [activeStep, setActiveStep] = useState(1);
  const preview = STEP_PREVIEWS[activeStep - 1];

  return (
    <div className="landing">
      <div className="top-bar">
        <header className="landing__nav">
          <div className="landing__brand">
            <span className="landing__brand-icon">
              <Compass size={18} />
            </span>
            <span className="landing__brand-name">lifeQuest</span>
          </div>
          <div className="landing__nav-actions">
            <Link to="/login" className="landing__nav-cta">
              Sign In
            </Link>
            <Link to="/register" className="landing__nav-register">
              <UserPlus size={14} />
              Register
            </Link>
          </div>
        </header>
      </div>

      <section className="landing__block landing__block--hero">
        <div className="landing__inner landing__hero">
          <div className="landing__hero-copy">
            <span className="landing__eyebrow">
              <ShieldAlert size={13} />
              Not a game. A way to actually see your progress.
            </span>
            <h1 className="landing__headline">
              Know exactly what you're avoiding{" "}
              <TypewriterWord
                words={["today", "everyday", "any day"]}
                className="landing__headline-word"
              />
              .
            </h1>
            <p className="landing__subhead">
              lifeQuest tracks tasks by category, priority, and how they depend
              on each other, then quietly flags whatever you've been putting
              off. Tell the Oracle what's going on in plain language and it
              turns that into structured tasks, nothing gets created without you
              approving it first.
            </p>
            <div className="landing__hero-actions">
              <Link to="/register" className="landing__primary-cta">
                Start Your Quest Log
                <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="landing__ghost-cta">
                How it works
              </a>
            </div>
          </div>

          <div className="landing__hero-visual" aria-hidden="true">
            <div className="landing__hero-aura" />
            <div className="landing__hero-card landing__hero-card--float">
              <div className="landing__hero-card-row">
                <span className="landing__hero-dot" />
                Needs Attention Today
              </div>
              <p className="landing__hero-card-title">
                Consolidate retirement portfolio
              </p>
              <div className="landing__hero-progress-track">
                <div className="landing__hero-progress-fill" />
              </div>
            </div>
            <div className="landing__hero-card landing__hero-card--secondary">
              <div className="landing__hero-card-row landing__hero-card-row--muted">
                <GitPullRequest size={12} />
                Chain 2 / 3 complete
              </div>
              <p className="landing__hero-card-title landing__hero-card-title--small">
                Q3 Finance Reorganization
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing__block landing__block--white"
        id="how-it-works"
      >
        <div className="landing__inner">
          <h2 className="landing__section-title">How it works</h2>
          <p className="landing__section-subtitle">
            The same three steps, every day, no loot, no timers, no artificial
            urgency.
          </p>

          <div className="landing__steps">
            <div className="landing__steps-list">
              {STEPS.map((step, idx) => {
                const num = idx + 1;
                const isActive = activeStep === num;
                return (
                  <button
                    type="button"
                    key={step.title}
                    className={
                      "landing__step" +
                      (isActive ? " landing__step--active" : "")
                    }
                    onClick={() => setActiveStep(num)}
                    aria-pressed={isActive}
                  >
                    <div className="landing__step-number">{num}</div>
                    <div className="landing__step-icon">
                      <step.icon size={18} />
                    </div>
                    <div className="landing__step-text">
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="landing__steps-preview" aria-hidden="true">
              <div className="landing__preview-bar">
                <span className="landing__preview-dot" />
                <span className="landing__preview-dot" />
                <span className="landing__preview-dot" />
                <span className="landing__preview-label">{preview.label}</span>
              </div>

              <div className="landing__preview-body">
                {preview.kind === "narrate" && (
                  <div className="landing__preview-narrate">
                    <p className="landing__preview-textarea">
                      "Went grocery shopping, gym in the morning too. Still need
                      to book that doctor's appointment, third time I've said
                      that this week."
                    </p>
                    <span className="landing__preview-oracle-btn">
                      <Sparkles size={14} />
                      Consult the Oracle
                    </span>
                  </div>
                )}

                {preview.kind === "review" && (
                  <div className="landing__preview-review">
                    {preview.suggestions.map((s) => (
                      <div
                        className="landing__preview-suggestion"
                        key={s.title}
                      >
                        <div className="landing__preview-suggestion-text">
                          <span className="landing__preview-suggestion-badge">
                            {s.category}
                          </span>
                          <p>{s.title}</p>
                        </div>
                        <div className="landing__preview-suggestion-actions">
                          <span className="landing__preview-icon-btn landing__preview-icon-btn--approve">
                            <Check size={13} />
                          </span>
                          <span className="landing__preview-icon-btn landing__preview-icon-btn--reject">
                            <X size={13} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {preview.kind === "track" && (
                  <div className="landing__preview-track">
                    <div className="landing__preview-xp">
                      <Award size={13} />
                      Lv. 4 &middot; 60 / 100 XP
                    </div>
                    {preview.tasks.map((t) => (
                      <div className="landing__preview-task" key={t.title}>
                        {t.done ? (
                          <CheckCircle2
                            size={15}
                            className="landing__preview-task-icon landing__preview-task-icon--done"
                          />
                        ) : (
                          <Circle
                            style={{ color: "white" }}
                            size={15}
                            className="landing__preview-task-icon"
                          />
                        )}
                        <span
                          className={
                            t.done ? "landing__preview-task-done" : undefined
                          }
                        >
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__block landing__block--dark" id="features">
        <div className="landing__inner">
          <h2 className="landing__section-title landing__section-title--on-dark">
            Built to catch what a checklist can't
          </h2>
          <p className="landing__section-subtitle landing__section-subtitle--on-dark">
            A checklist tells you what's left. It doesn't tell you what you're
            stuck on, or why. This does.
          </p>

          <div className="landing__features">
            {FEATURES.map((f) => (
              <div
                className="landing__feature-card landing__feature-card--on-dark"
                key={f.title}
              >
                <div className="landing__feature-icon">
                  <f.icon size={20} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.copy}</p>
                <div className="landing__feature-flourish" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing__block landing__block--signin" id="sign-in">
        <div className="landing__inner landing__signin">
          <div className="landing__signin-copy">
            <span className="landing__eyebrow landing__eyebrow--signin">
              <Shield size={13} />
              100% sovereign productivity
            </span>
            <h2>Your day, organized honestly.</h2>
            <p>
              Free to run on your own infrastructure, nothing locked behind a
              paywall. Sign in and see what actually needs you today.
            </p>
            <ul className="landing__signin-trust">
              <li>No telemetry, no analytics cookies, no trackers.</li>
              <li>
                Leveling up is just a visual. Nothing here is designed to be
                addictive.
              </li>
            </ul>
          </div>

          <div className="landing__signin-visual">
            <div className="landing__signin-particles">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="landing__signin-particle" />
              ))}
            </div>
            <div className="landing__signin-glow" />
            <div className="landing__signin-card">
              <div className="landing__signin-icon">
                <Compass size={20} />
              </div>
              <h3>Ready when you are</h3>
              <p>
                Sign in to your existing quest log, or set one up, name, email,
                done, in under a minute.
              </p>
              <Link
                to="/login"
                className="landing__primary-cta landing__signin-cta"
              >
                <LogIn size={16} />
                Sign In to Quest Log
              </Link>
              <Link to="/register" className="landing__signin-secondary">
                <UserPlus size={13} />
                New here? Start your quest log
              </Link>
              <img
                src="/img/mascot.png"
                alt=""
                className="landing__signin-mascot"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="landing__footer">
        <div className="landing__inner">
          <div className="landing__footer-top">
            <div className="landing__footer-brand">
              <div className="landing__brand">
                <span className="landing__brand-icon">
                  <Compass size={16} />
                </span>
                <span className="landing__brand-name">lifeQuest</span>
              </div>
              <p>
                A personal quest tracker for real accountability, with a light
                RPG layer that never gets in the way.
              </p>
            </div>

            <div className="landing__footer-columns">
              <div className="landing__footer-column">
                <h4>Product</h4>
                <ul>
                  <li>
                    <a href="#how-it-works">How it Works</a>
                  </li>
                  <li>
                    <a href="#features">Features</a>
                  </li>
                  <li>
                    <a href="#sign-in">Sign In</a>
                  </li>
                </ul>
              </div>
              <div className="landing__footer-column">
                <h4>Principles</h4>
                <ul className="landing__footer-principles">
                  <li>
                    <span className="landing__footer-dot" />
                    No automatic AI task creation
                  </li>
                  <li>
                    <span className="landing__footer-dot" />
                    XP is cosmetic, never functional
                  </li>
                  <li>
                    <span className="landing__footer-dot" />
                    Clarity over gamification
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="landing__footer-bottom">
            <span>Artur Wagner 2026</span>
            <span>lifeQuest - a personal productivity tool.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
