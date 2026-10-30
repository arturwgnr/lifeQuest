import { resolveStamp } from "../constants/stamps.js";
import "../styles/StampBadge.css";

// The day-type stamp in a small tinted seal. Decorative by default (callers
// put the day type in their own text/aria-label); pass `title` to expose it.
export default function StampBadge({ stampIcon, stampTone, name, size = "md", title }) {
  const stamp = resolveStamp({ stampIcon, stampTone, name });
  const Icon = stamp.Icon;
  const iconSize = { xs: 10, sm: 12, md: 15, lg: 20 }[size] || 15;
  return (
    <span
      className={`stamp-badge stamp-badge--${size} stamp-badge--${stamp.tone}`}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
      title={title}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  );
}
