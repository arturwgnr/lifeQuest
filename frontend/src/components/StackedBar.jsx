import "../styles/StackedBar.css";

// A single 100%-stacked horizontal bar for a 2-way proportion (e.g. Main vs Side).
export default function StackedBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <p className="stacked-bar__empty">No completed quests in this window yet.</p>;
  }

  return (
    <div className="stacked-bar">
      <div className="stacked-bar__track">
        {segments.map(seg => {
          const pct = (seg.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={seg.label} className="stacked-bar__segment" style={{ width: `${pct}%`, background: seg.color }} title={`${seg.label}: ${seg.value}`}>
              {pct >= 12 && <span>{Math.round(pct)}%</span>}
            </div>
          );
        })}
      </div>
      <div className="stacked-bar__legend">
        {segments.map(seg => (
          <span key={seg.label} className="stacked-bar__legend-item">
            <span className="stacked-bar__legend-swatch" style={{ background: seg.color }} />
            {seg.label} ({seg.value})
          </span>
        ))}
      </div>
    </div>
  );
}
