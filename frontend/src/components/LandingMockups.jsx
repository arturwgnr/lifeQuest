import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  Clock,
  GitBranch,
  GripVertical,
  HelpCircle,
  HeartPulse,
  Landmark,
  Send,
  Sparkles,
  Wallet,
  X
} from "lucide-react";
import { AVATAR_STAGES, stageLevelRange } from "../constants/avatarStages.js";
import { pillarScaleStyle } from "../constants/pillars.js";
import AvatarBadge from "./AvatarBadge.jsx";
import "../styles/LandingMockups.css";

// Live, static mockups of real app screens for the landing page. Built from
// the app's own visual language (category chips, status pills, avatar,
// pillar color scale) instead of screenshots, so they stay crisp at any size
// and cost nothing to load. Everything here is decorative: aria-hidden.

function Chip({ tone, icon: Icon, children }) {
  return (
    <span className={`landing-mock__chip landing-mock__chip--${tone}`}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function WindowBar({ label }) {
  return (
    <div className="landing-mock__bar">
      <span />
      <span />
      <span />
      <strong>{label}</strong>
    </div>
  );
}

export function DashboardMock() {
  return (
    <div className="landing-mock landing-mock--dashboard" aria-hidden="true">
      <div className="landing-mock__window">
        <WindowBar label="Dashboard" />
        <div className="landing-mock__body">
          <div className="landing-mock__section-head">
            <span className="landing-mock__pulse" />
            Needs attention today
            <span className="landing-mock__count">3</span>
          </div>

          <div className="landing-mock__attention landing-mock__attention--stuck">
            <div className="landing-mock__attention-top">
              <Chip tone="rose" icon={HeartPulse}>
                Health
              </Chip>
              <span className="landing-mock__flag landing-mock__flag--rose">
                <Clock size={11} />
                Stuck 6 days
              </span>
            </div>
            <p>Book doctor&apos;s appointment</p>
            <div className="landing-mock__attention-actions">
              <span className="landing-mock__btn-ghost">Details</span>
              <span className="landing-mock__btn-solid">Mark done</span>
            </div>
          </div>

          <div className="landing-mock__attention landing-mock__attention--overdue">
            <div className="landing-mock__attention-top">
              <Chip tone="slate" icon={Landmark}>
                Bureaucracy
              </Chip>
              <span className="landing-mock__flag landing-mock__flag--amber">
                <AlertTriangle size={11} />
                Overdue 2 days
              </span>
            </div>
            <p>Renew passport</p>
          </div>

          <div className="landing-mock__chain-row">
            <GitBranch size={13} />
            <span>Move apartment</span>
            <div className="landing-mock__progress">
              <span style={{ width: "66%" }} />
            </div>
            <em>2/3</em>
          </div>
        </div>
      </div>

      <div className="landing-mock__float">
        <div className="landing-mock__float-head">
          <Sparkles size={12} />
          Oracle proposes
        </div>
        <p>Schedule dental cleaning</p>
        <div className="landing-mock__float-meta">
          <Chip tone="rose">Health</Chip>
          <span className="landing-mock__xp">+25 XP</span>
        </div>
        <div className="landing-mock__float-actions">
          <span className="landing-mock__btn-ghost">
            <X size={12} />
            Reject
          </span>
          <span className="landing-mock__btn-solid">
            <Check size={12} />
            Approve
          </span>
        </div>
      </div>
    </div>
  );
}

export function OracleMock() {
  return (
    <div className="landing-mock landing-mock--oracle" aria-hidden="true">
      <div className="landing-mock__msg landing-mock__msg--user">
        Finished the budget review. Still haven&apos;t called the bank about the card.
      </div>
      <div className="landing-mock__msg-row">
        <span className="landing-mock__orb">
          <Sparkles size={11} />
        </span>
        <div className="landing-mock__msg landing-mock__msg--oracle">I drafted one quest for the bank call.</div>
      </div>
      <div className="landing-mock__question">
        <HelpCircle size={12} />
        Is &ldquo;Budget review&rdquo; the quest already in your log?
      </div>
      <div className="landing-mock__proposal">
        <div className="landing-mock__proposal-top">
          <Chip tone="amber" icon={Wallet}>
            Finance
          </Chip>
          <span className="landing-mock__xp">+25 XP</span>
        </div>
        <p>Call the bank about the card</p>
        <div className="landing-mock__float-actions">
          <span className="landing-mock__btn-ghost">Edit</span>
          <span className="landing-mock__btn-solid">
            <Check size={12} />
            Approve
          </span>
        </div>
      </div>
      <div className="landing-mock__composer">
        <span>Speak naturally...</span>
        <span className="landing-mock__send">
          <Send size={11} />
        </span>
      </div>
    </div>
  );
}

export function ChainMock() {
  const steps = [
    { title: "Sign the new lease", status: "Done", tone: "done" },
    { title: "Book the movers", status: "In progress", tone: "progress" },
    { title: "Update address everywhere", status: "To do", tone: "todo" }
  ];
  return (
    <div className="landing-mock landing-mock--chain" aria-hidden="true">
      <div className="landing-mock__chain-parent">
        <span className="landing-mock__main-tag">Main</span>
        <strong>Move apartment</strong>
        <div className="landing-mock__progress landing-mock__progress--lg">
          <span style={{ width: "40%" }} />
        </div>
        <em>1 of 3 · 33%</em>
      </div>
      <ul className="landing-mock__chain-list">
        {steps.map(step => (
          <li key={step.title}>
            <span className={`landing-mock__dot landing-mock__dot--${step.tone}`} />
            <span className={step.tone === "done" ? "landing-mock__strike" : undefined}>{step.title}</span>
            <span className={`landing-mock__status landing-mock__status--${step.tone}`}>{step.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlanningMock() {
  const cards = ["Renew passport", "Book the movers", "Draft quarterly review"];
  return (
    <div className="landing-mock landing-mock--planning" aria-hidden="true">
      {cards.map((title, idx) => (
        <div key={title} className={`landing-mock__plan-card${idx === 1 ? " landing-mock__plan-card--lifted" : ""}`}>
          <span className="landing-mock__plan-index">{idx + 1}</span>
          <span className="landing-mock__plan-title">{title}</span>
          <GripVertical size={14} />
        </div>
      ))}
      <div className="landing-mock__plan-hint">
        <ArrowDownToLine size={12} />
        Drag into the order you&apos;ll actually work
      </div>
    </div>
  );
}

// Fixed sample month: null = no report, otherwise completion %
const PILLAR_SAMPLE = [
  null, null, 100, 80, 60, 100, 40,
  20, 80, 100, 100, 60, null, 80,
  100, 100, 80, 40, 0, 60, 100,
  80, 100, 100, 60, 80, 100, null
];

export function PillarsMock() {
  return (
    <div className="landing-mock landing-mock--pillars" aria-hidden="true">
      <div className="landing-mock__cal">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={`h-${i}`} className="landing-mock__cal-head">
            {d}
          </span>
        ))}
        {PILLAR_SAMPLE.map((rate, i) => (
          <span
            key={i}
            className={`landing-mock__cal-cell${rate === null ? " landing-mock__cal-cell--empty" : ""}`}
            style={pillarScaleStyle(rate) || undefined}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="landing-mock__legend">
        <span>0%</span>
        <span className="landing-mock__legend-bar" />
        <span>100%</span>
      </div>
    </div>
  );
}

// Deterministic "random" pattern so the mock never changes between renders
const HEAT_SAMPLE = Array.from({ length: 16 * 7 }, (_, i) => {
  const v = (i * 37 + (i % 7) * 11 + Math.floor(i / 7) * 5) % 9;
  return v < 3 ? 0 : v < 5 ? 1 : v < 7 ? 2 : v < 8 ? 3 : 4;
});

export function StatsMock() {
  return (
    <div className="landing-mock landing-mock--stats" aria-hidden="true">
      <div className="landing-mock__kpis">
        <div>
          <strong>12</strong>
          <span>Day streak</span>
        </div>
        <div>
          <strong>78%</strong>
          <span>Completion</span>
        </div>
      </div>
      <div className="landing-mock__heat">
        {HEAT_SAMPLE.map((level, i) => (
          <span key={i} className={`landing-mock__heat-cell landing-mock__heat-cell--${level}`} />
        ))}
      </div>
    </div>
  );
}

export function AvatarEvolution() {
  return (
    <ol className="landing-mock__evolution" aria-label="Avatar stages from Wanderer to Transcendent">
      {AVATAR_STAGES.map(stage => (
        <li key={stage.key} className={stage.stage === AVATAR_STAGES.length ? "landing-mock__evolution-final" : undefined}>
          <AvatarBadge stage={stage.stage} size={stage.stage === AVATAR_STAGES.length ? 64 : 52} showLevel={false} showProgress={false} />
          <strong>{stage.name}</strong>
          <span>{stageLevelRange(stage)}</span>
        </li>
      ))}
    </ol>
  );
}
