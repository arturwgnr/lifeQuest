import { useId } from "react";
import { AVATAR_STAGES, stageForUser } from "../constants/avatarStages.js";
import "../styles/AvatarBadge.css";

const RING_RADIUS = 45.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Gender only changes the silhouette (shoulder width + hair), never the
// stage gear, so every variant evolves through the same visible steps.
const BODY_SCALE = { MASCULINE: 1.14, FEMININE: 0.9, NEUTRAL: 1 };

const MARK_ANGLES = [45, 135, 225, 315];
const STAR_ANGLES = [0, 90, 180, 270];

// Below this rendered size the aura drops its layers/pulse and the starfield
// is hidden, so the final form stays a clean glow instead of visual noise.
const COMPACT_SIZE = 40;

function polar(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [50 + radius * Math.cos(rad), 50 + radius * Math.sin(rad)];
}

// One SVG used everywhere the avatar appears (sidebar, Profile, Oracle,
// auth pages, landing), so it renders identically in every place. Colors are
// fixed per stage, not theme tokens, so it reads the same in light and dark.
//
// Stage resolution: `stage` forces a specific stage (previews/teasers);
// otherwise it comes from level plus the stored `avatarStage` high-water
// mark, via the same helper the rest of the app uses.
export default function AvatarBadge({
  level = 1,
  xp = 0,
  avatarStage,
  size = 56,
  gender = "NEUTRAL",
  stage: stageOverride,
  locked = false,
  showLevel = true,
  showProgress = true
}) {
  const uid = useId().replace(/:/g, "");
  const stage = stageOverride ? AVATAR_STAGES[stageOverride - 1] : stageForUser({ level, avatarStage });
  const n = stage.stage;
  const isCompact = size < COMPACT_SIZE;
  const bodyScale = BODY_SCALE[gender] || 1;
  const progress = showProgress && !locked ? ((xp % 100) / 100) * RING_CIRCUMFERENCE : 0;

  const clipId = `av-clip-${uid}`;
  const bgId = `av-bg-${uid}`;
  const haloId = `av-halo-${uid}`;
  const ringId = `av-ring-${uid}`;
  const eyeGlowId = `av-eye-${uid}`;

  const classes = [
    "avatar-badge",
    `avatar-badge--${stage.key}`,
    isCompact && "avatar-badge--compact",
    locked && "avatar-badge--locked"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ width: size, height: size }}
      role="img"
      aria-label={locked ? `${stage.name} stage (locked)` : `${stage.name} avatar, level ${level}`}
    >
      {/* Final form: layered aura lives outside the SVG so it can glow
          beyond the avatar's bounds at any size */}
      {n >= 8 && (
        <span className="avatar-badge__aura" aria-hidden="true">
          <span />
          <span />
        </span>
      )}

      <svg viewBox="0 0 100 100" className="avatar-badge__svg" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="40" />
          </clipPath>
          <radialGradient id={bgId} cx="50%" cy="35%" r="75%">
            <stop offset="0%" className="avatar-badge__bg-stop-1" />
            <stop offset="100%" className="avatar-badge__bg-stop-2" />
          </radialGradient>
          <radialGradient id={haloId}>
            <stop offset="0%" className="avatar-badge__halo-stop" stopOpacity="0.95" />
            <stop offset="100%" className="avatar-badge__halo-stop" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={eyeGlowId}>
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="avatar-badge__ring-stop-1" />
            <stop offset="100%" className="avatar-badge__ring-stop-2" />
          </linearGradient>
        </defs>

        {/* Stage 7+: slow starlit outer ring (hidden when compact) */}
        {n >= 7 && !isCompact && (
          <g className="avatar-badge__starfield">
            <circle cx="50" cy="50" r="49" className="avatar-badge__aura-ring" />
            {STAR_ANGLES.map(angle => {
              const [x, y] = polar(angle, 49);
              return (
                <path
                  key={angle}
                  d={`M${x} ${y - 2.6} L${x + 0.8} ${y - 0.8} L${x + 2.6} ${y} L${x + 0.8} ${y + 0.8} L${x} ${y + 2.6} L${x - 0.8} ${y + 0.8} L${x - 2.6} ${y} L${x - 0.8} ${y - 0.8} Z`}
                  className="avatar-badge__star"
                />
              );
            })}
          </g>
        )}

        {/* XP ring: track + progress toward the next level */}
        <circle cx="50" cy="50" r={RING_RADIUS} className="avatar-badge__track" />
        {progress > 0 && (
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            className="avatar-badge__progress"
            stroke={`url(#${ringId})`}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE - progress}
            transform="rotate(-90 50 50)"
          />
        )}

        {/* Stage 3+: four ring marks */}
        {n >= 3 &&
          MARK_ANGLES.map(angle => {
            const [x, y] = polar(angle, RING_RADIUS);
            return <circle key={angle} cx={x} cy={y} r="1.9" className="avatar-badge__mark" />;
          })}

        {/* Portrait */}
        <circle cx="50" cy="50" r="40" fill={`url(#${bgId})`} />
        {n >= 4 && <circle cx="50" cy="50" r="38" className="avatar-badge__inner-ring" />}

        <g clipPath={`url(#${clipId})`}>
          {n >= 7 && <circle cx="50" cy="40" r="27" fill={`url(#${haloId})`} />}

          {n >= 6 && (
            <g className="avatar-badge__laurels">
              <path d="M26 68 C20 58 20 46 26 35" />
              <path d="M74 68 C80 58 80 46 74 35" />
              {[
                [22.5, 60, -35],
                [21.5, 51, -15],
                [23.5, 42, 10],
                [77.5, 60, 35],
                [78.5, 51, 15],
                [76.5, 42, -10]
              ].map(([cx, cy, rot]) => (
                <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.2" ry="4" transform={`rotate(${rot} ${cx} ${cy})`} />
              ))}
            </g>
          )}

          {gender === "FEMININE" && (
            <path
              d="M35 43 C35 27 43 24.5 50 24.5 C57 24.5 65 27 65 43 C65 52 67 58 69.5 62.5 C62 66.5 38 66.5 30.5 62.5 C33 58 35 52 35 43 Z"
              className="avatar-badge__hair"
            />
          )}

          <g transform={`translate(50 0) scale(${bodyScale} 1) translate(-50 0)`}>
            <path d="M45 50 H55 V66 H45 Z" className="avatar-badge__body" />
            <path d="M23 100 C23 76 35 64 50 64 C65 64 77 76 77 100 Z" className="avatar-badge__body" />

            {n >= 2 && <path d="M37 65.5 Q50 75 63 65.5 L61.5 71 Q50 80 38.5 71 Z" className="avatar-badge__scarf" />}
            {n >= 3 && <path d="M50 79 L55 85 L50 91 L45 85 Z" className="avatar-badge__sigil" />}
            {n >= 4 && (
              <>
                <path d="M23.5 81 C24.5 72 30 67.5 37 67 L35.5 76 C30.5 76.5 26.5 78.5 23.5 81 Z" className="avatar-badge__pauldron" />
                <path d="M76.5 81 C75.5 72 70 67.5 63 67 L64.5 76 C69.5 76.5 73.5 78.5 76.5 81 Z" className="avatar-badge__pauldron" />
              </>
            )}
          </g>

          <circle cx="50" cy="41" r={gender === "MASCULINE" ? 14.5 : 14} className="avatar-badge__head" />
          {gender === "MASCULINE" && (
            <path d="M35.6 39 C35.6 29 42 25.8 50 25.8 C58 25.8 64.4 29 64.4 39 C60 34.6 40 34.6 35.6 39 Z" className="avatar-badge__hair" />
          )}
          {gender === "FEMININE" && (
            <path d="M36 38 C37 29 43 26.5 50 26.5 C57 26.5 63 29 64 38 C58 32 44 31 36 38 Z" className="avatar-badge__hair" />
          )}

          {n === 5 && (
            <g>
              <path d="M36.5 35.5 Q50 30.5 63.5 35.5" className="avatar-badge__circlet" />
              <circle cx="50" cy="32.4" r="2" className="avatar-badge__gem" />
            </g>
          )}
          {n >= 6 && (
            <g>
              <path d="M37.5 32 L39.5 20.5 L45 26.5 L50 17 L55 26.5 L60.5 20.5 L62.5 32 Z" className="avatar-badge__crown" />
              {n >= 7 && <circle cx="50" cy="27" r="2.1" className="avatar-badge__gem" />}
            </g>
          )}

          {/* Stage 8 only: the third eye, fully open, with a soft glow */}
          {n >= 8 && (
            <g className="avatar-badge__third-eye">
              <circle cx="50" cy="37" r="6" fill={`url(#${eyeGlowId})`} className="avatar-badge__eye-glow" />
              <path d="M44.2 37 Q50 32.4 55.8 37 Q50 41.6 44.2 37 Z" className="avatar-badge__eye-white" />
              <circle cx="50" cy="37" r="1.9" className="avatar-badge__eye-iris" />
              <circle cx="50" cy="37" r="0.75" className="avatar-badge__eye-pupil" />
            </g>
          )}
        </g>
      </svg>

      {showLevel && !locked && <div className="avatar-badge__level">Lv {level}</div>}
    </div>
  );
}
