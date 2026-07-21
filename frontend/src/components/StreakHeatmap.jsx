import "../styles/StreakHeatmap.css";

// GitHub-contributions-style grid: one column per week, one cell per day,
// intensity (single sequential hue) by completion count that day. Built on
// CSS Grid with `grid-auto-flow: column` so cell sizing never depends on
// flexbox shrink behavior (that's what made cells collapse/skew before).
export default function StreakHeatmap({ days }) {
  if (days.length === 0) {
    return <p className="streak-heatmap__empty">No activity recorded yet.</p>;
  }

  const maxCount = Math.max(1, ...days.map(d => d.count));
  const leadingBlank = (new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay() + 6) % 7;
  const cells = [...Array(leadingBlank).fill(null), ...days];

  const intensityClass = count => {
    if (count === 0) return "streak-heatmap__cell--0";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "streak-heatmap__cell--4";
    if (ratio > 0.5) return "streak-heatmap__cell--3";
    if (ratio > 0.25) return "streak-heatmap__cell--2";
    return "streak-heatmap__cell--1";
  };

  return (
    <div className="streak-heatmap">
      <div className="streak-heatmap__grid">
        {cells.map((day, idx) =>
          day ? (
            <span key={idx} className={`streak-heatmap__cell ${intensityClass(day.count)}`} title={`${day.date}: ${day.count} completed`} />
          ) : (
            <span key={idx} className="streak-heatmap__cell streak-heatmap__cell--blank" />
          )
        )}
      </div>
      <div className="streak-heatmap__legend">
        <span>Less</span>
        <span className="streak-heatmap__cell streak-heatmap__cell--0" />
        <span className="streak-heatmap__cell streak-heatmap__cell--1" />
        <span className="streak-heatmap__cell streak-heatmap__cell--2" />
        <span className="streak-heatmap__cell streak-heatmap__cell--3" />
        <span className="streak-heatmap__cell streak-heatmap__cell--4" />
        <span>More</span>
      </div>
    </div>
  );
}
