import { Check } from "lucide-react";
import { STAMP_OPTIONS, STAMP_REGISTRY, STAMP_LABELS, STAMP_TONES } from "../constants/stamps.js";
import "../styles/StampPicker.css";

// Grid of curated stamps plus an optional muted tone. Both are radio groups,
// so arrow keys aren't needed: every option is a plain focusable button.
export default function StampPicker({ stampIcon, stampTone, onChange }) {
  const tone = stampTone || "slate";
  return (
    <div className="stamp-picker">
      <div className="stamp-picker__grid" role="radiogroup" aria-label="Stamp">
        {STAMP_OPTIONS.map(key => {
          const Icon = STAMP_REGISTRY[key];
          const isSelected = key === stampIcon;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={STAMP_LABELS[key]}
              title={STAMP_LABELS[key]}
              className={`stamp-picker__option${isSelected ? " stamp-picker__option--selected" : ""}`}
              onClick={() => onChange({ stampIcon: key, stampTone: tone })}
            >
              <Icon size={17} strokeWidth={2} />
            </button>
          );
        })}
      </div>

      <div className="stamp-picker__tones" role="radiogroup" aria-label="Stamp tone">
        <span className="stamp-picker__tones-label">Tone</span>
        {STAMP_TONES.map(t => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={tone === t.key}
            aria-label={t.label}
            title={t.label}
            className={`stamp-picker__tone stamp-picker__tone--${t.key}${tone === t.key ? " stamp-picker__tone--selected" : ""}`}
            onClick={() => onChange({ stampIcon, stampTone: t.key })}
          >
            {tone === t.key && <Check size={11} strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  );
}
