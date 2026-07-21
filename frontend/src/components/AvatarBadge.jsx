import "../styles/AvatarBadge.css";

const TIERS = [
  { min: 9, ring: "sovereign", label: "Sovereign", group: 5, stroke: "#6366f1" },
  { min: 7, ring: "champion", label: "Champion", group: 4, stroke: "#d97706" },
  { min: 5, ring: "pathfinder", label: "Pathfinder", group: 3, stroke: "#475569" },
  { min: 3, ring: "initiate", label: "Initiate", group: 2, stroke: "#64748b" },
  { min: 0, ring: "novice", label: "Novice", group: 1, stroke: "#64748b" }
];

function tierForLevel(level) {
  return TIERS.find(t => level >= t.min);
}

export default function AvatarBadge({ level, xp, size = 56 }) {
  const tier = tierForLevel(level);
  const circumference = 257.6;
  const progress = ((xp % 100) / 100) * circumference;

  return (
    <div className="avatar-badge" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="avatar-badge__svg">
        <circle cx="50" cy="50" r="44" className="avatar-badge__backdrop" />
        <circle cx="50" cy="50" r="41" className="avatar-badge__track" />
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke={tier.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 50 50)"
          className="avatar-badge__progress"
        />

        {tier.group >= 2 && (
          <path d="M 50 4 L 50 10 M 50 90 L 50 96" className="avatar-badge__accent-line" />
        )}
        {tier.group >= 3 && (
          <path d="M 4 50 L 10 50 M 90 50 L 96 50" className="avatar-badge__accent-line" />
        )}
        {tier.group >= 4 && (
          <g className="avatar-badge__wings">
            <path d="M 12 35 C 18 30, 22 45, 18 55" />
            <path d="M 88 35 C 82 30, 78 45, 82 55" />
          </g>
        )}
        {tier.group >= 5 && (
          <g className="avatar-badge__halo-lines">
            <line x1="50" y1="15" x2="50" y2="85" />
            <line x1="15" y1="50" x2="85" y2="50" />
            <line x1="25" y1="25" x2="75" y2="75" strokeDasharray="2,2" />
            <line x1="25" y1="75" x2="75" y2="25" strokeDasharray="2,2" />
          </g>
        )}

        <g transform="translate(18, 18) scale(0.64)">
          <path
            d="M50,15 C33.43,15 20,28.43 20,45 C20,53.28 23.36,60.78 28.78,66.22 C21.15,70.83 15,78.2 15,87 C15,88.66 16.34,90 18,90 L82,90 C83.66,90 85,88.66 85,87 C85,78.2 78.85,70.83 71.22,66.22 C76.64,60.78 80,53.28 80,45 C80,28.43 66.57,15 50,15 Z"
            className="avatar-badge__silhouette"
          />

          {tier.group >= 2 && <path d="M32,68 C40,75 60,75 68,68" className="avatar-badge__collar" />}
          {tier.group >= 3 && (
            <path
              d="M30,35 C38,18 62,18 70,35 C74,45 74,58 68,66 C60,74 40,74 32,66 C26,58 26,45 30,35 Z"
              className="avatar-badge__cowl"
            />
          )}
          {tier.group >= 4 && <polygon points="42,24 50,14 58,24 50,28" className="avatar-badge__crown" />}
          {tier.group >= 5 && <circle cx="50" cy="40" r="24" className="avatar-badge__aura" />}
        </g>
      </svg>

      <div className={`avatar-badge__level avatar-badge__level--${tier.ring}`}>Lvl {level}</div>
    </div>
  );
}

export { TIERS, tierForLevel };
