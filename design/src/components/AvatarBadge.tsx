import { motion } from "motion/react";

interface AvatarBadgeProps {
  level: number;
  xp: number;
  className?: string;
}

export default function AvatarBadge({ level, xp, className = "w-14 h-14" }: AvatarBadgeProps) {
  // Determine avatar rank & color style based on level
  let badgeColor = "border-amber-700/40 text-amber-700 bg-amber-50";
  let crestLabel = "Novice";
  let levelGroup = 1;

  if (level >= 9) {
    badgeColor = "border-indigo-500/40 text-indigo-500 bg-indigo-50 ring-2 ring-indigo-400/20";
    crestLabel = "Sovereign";
    levelGroup = 5;
  } else if (level >= 7) {
    badgeColor = "border-amber-500/40 text-amber-600 bg-amber-50/50 ring-1 ring-amber-400/20";
    crestLabel = "Champion";
    levelGroup = 4;
  } else if (level >= 5) {
    badgeColor = "border-slate-500/40 text-slate-600 bg-slate-50";
    crestLabel = "Pathfinder";
    levelGroup = 3;
  } else if (level >= 3) {
    badgeColor = "border-slate-400/40 text-slate-600 bg-slate-50";
    crestLabel = "Initiate";
    levelGroup = 2;
  }

  // Evolving vector elements based on progression tier
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer Crest Ring */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tier-based circular border and accents */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="currentColor"
          className="text-slate-50/90 dark:text-slate-900/90"
        />
        
        {/* Progress gauge background */}
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-slate-200"
        />

        {/* Dynamic XP track arc around the badge */}
        <motion.circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke={level >= 9 ? "#6366f1" : level >= 7 ? "#d97706" : level >= 5 ? "#475569" : "#64748b"}
          strokeWidth="2.5"
          strokeDasharray="257.6"
          initial={{ strokeDashoffset: 257.6 }}
          animate={{ strokeDashoffset: 257.6 - (257.6 * (xp % 100)) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />

        {/* Decorative elements based on level tier */}
        {levelGroup >= 2 && (
          // Silver/Initiate: Simple guide lines
          <path d="M 50 4 L 50 10 M 50 90 L 50 96" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
        )}
        {levelGroup >= 3 && (
          // Pathfinder: Crossbars
          <path d="M 4 50 L 10 50 M 90 50 L 96 50" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
        )}
        {levelGroup >= 4 && (
          // Champion: Golden wing-flairs in background
          <g className="text-amber-500/20" stroke="currentColor" strokeWidth="1.5" fill="none">
            <path d="M 12 35 C 18 30, 22 45, 18 55" />
            <path d="M 88 35 C 82 30, 78 45, 82 55" />
          </g>
        )}
        {levelGroup >= 5 && (
          // Sovereign: Ethereal radiant star behind silhouette
          <g className="text-indigo-400/40" stroke="currentColor" strokeWidth="1" fill="none">
            <line x1="50" y1="15" x2="50" y2="85" />
            <line x1="15" y1="50" x2="85" y2="50" />
            <line x1="25" y1="25" x2="75" y2="75" strokeDasharray="2,2" />
            <line x1="25" y1="75" x2="75" y2="25" strokeDasharray="2,2" />
          </g>
        )}

        {/* Core Silhouette Avatar */}
        <g transform="translate(18, 18) scale(0.64)">
          {/* Base Head Silhouette */}
          <path
            d="M50,15 C33.43,15 20,28.43 20,45 C20,53.28 23.36,60.78 28.78,66.22 C21.15,70.83 15,78.2 15,87 C15,88.66 16.34,90 18,90 L82,90 C83.66,90 85,88.66 85,87 C85,78.2 78.85,70.83 71.22,66.22 C76.64,60.78 80,53.28 80,45 C80,28.43 66.57,15 50,15 Z"
            fill="currentColor"
            className="text-slate-400 dark:text-slate-600"
          />

          {/* Evolving visual accessories (equipment/features) */}
          {levelGroup >= 2 && (
            // Initiate: Simple cloak-collar line (Silver)
            <path
              d="M32,68 C40,75 60,75 68,68"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {levelGroup >= 3 && (
            // Pathfinder: Iron cowl hood outline (Steel)
            <path
              d="M30,35 C38,18 62,18 70,35 C74,45 74,58 68,66 C60,74 40,74 32,66 C26,58 26,45 30,35 Z"
              fill="none"
              stroke="#475569"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {levelGroup >= 4 && (
            // Champion: Glowing crown or forehead mark (Amber/Gold)
            <polygon
              points="42,24 50,14 58,24 50,28"
              fill="#d97706"
              className="animate-pulse"
            />
          )}

          {levelGroup >= 5 && (
            // Sovereign: Luminescent halo ring around head (Indigo)
            <circle
              cx="50"
              cy="40"
              r="24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeDasharray="4 4"
              className="animate-spin"
              style={{ transformOrigin: "50px 40px", animationDuration: "12s" }}
            />
          )}
        </g>
      </svg>

      {/* Mini Level Indicator Badge */}
      <div className={`absolute -bottom-1 right-0 px-1.5 py-0.5 rounded-full border text-[10px] font-mono font-bold leading-none tracking-tight shadow-sm ${badgeColor}`}>
        Lvl {level}
      </div>
    </div>
  );
}
