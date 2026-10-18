import { useMemo, useState } from "react";
import "../styles/StreakHeatmap.css";

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

function formatDay(key) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function intensity(count, maxCount) {
  if (count === 0) return 0;
  const ratio = count / maxCount;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

// Consecutive active days ending at the last day (or the day before, so the
// streak doesn't read as broken before you've had a chance to act today).
function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  while (i >= 0 && days[i].count > 0) {
    current += 1;
    i -= 1;
  }
  return { current, longest };
}

// Contributions-style grid. The backend always sends whole weeks starting on
// a Monday, so the data is chunked straight into 7-day columns; columns use
// 1fr so the grid fills its card at any width instead of overflowing it
// (the old fixed-size cells pushed the page sideways on phones).
export default function StreakHeatmap({ days }) {
  const [hovered, setHovered] = useState(null);

  const { weeks, maxCount, monthLabels, stats } = useMemo(() => {
    const leadingBlank = days.length ? (new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay() + 6) % 7 : 0;
    const padded = [...Array(leadingBlank).fill(null), ...days];
    while (padded.length % 7 !== 0) padded.push(null);

    const chunked = [];
    for (let i = 0; i < padded.length; i += 7) chunked.push(padded.slice(i, i + 7));

    // Label a column when it holds the 1st of a month (or it's the first column)
    let lastMonth = null;
    const labels = chunked.map((week, idx) => {
      const firstDay = week.find(Boolean);
      if (!firstDay) return "";
      const date = new Date(`${firstDay.date}T00:00:00.000Z`);
      const month = date.getUTCMonth();
      const holdsFirst = week.some(d => d && d.date.endsWith("-01"));
      if ((idx === 0 || holdsFirst) && month !== lastMonth) {
        const labelDate = holdsFirst ? new Date(`${week.find(d => d && d.date.endsWith("-01")).date}T00:00:00.000Z`) : date;
        lastMonth = labelDate.getUTCMonth();
        return labelDate.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
      }
      return "";
    });

    const active = days.filter(d => d.count > 0).length;
    const total = days.reduce((sum, d) => sum + d.count, 0);
    return {
      weeks: chunked,
      maxCount: Math.max(1, ...days.map(d => d.count)),
      monthLabels: labels,
      stats: { active, total, ...streaks(days) }
    };
  }, [days]);

  if (days.length === 0) {
    return <p className="streak-heatmap__empty">No activity recorded yet.</p>;
  }

  const lastDay = days[days.length - 1];
  const detail = hovered || lastDay;

  return (
    <div className="streak-heatmap">
      <div className="streak-heatmap__stats">
        <div>
          <strong>{stats.current}</strong>
          <span>Current streak</span>
        </div>
        <div>
          <strong>{stats.longest}</strong>
          <span>Longest streak</span>
        </div>
        <div>
          <strong>{stats.active}</strong>
          <span>Active days</span>
        </div>
        <div>
          <strong>{stats.total}</strong>
          <span>Quests done</span>
        </div>
      </div>

      <div
        className="streak-heatmap__board"
        style={{ "--weeks": weeks.length }}
        onMouseLeave={() => setHovered(null)}
      >
        <span className="streak-heatmap__corner" />
        {monthLabels.map((label, idx) => (
          <span key={`m-${idx}`} className="streak-heatmap__month" style={{ gridColumn: idx + 2, gridRow: 1 }}>
            {label}
          </span>
        ))}

        {WEEKDAY_LABELS.map((label, row) => (
          <span key={`w-${row}`} className="streak-heatmap__weekday" style={{ gridColumn: 1, gridRow: row + 2 }}>
            {label}
          </span>
        ))}

        {weeks.map((week, col) =>
          week.map((day, row) => {
            const style = { gridColumn: col + 2, gridRow: row + 2 };
            if (!day) return <span key={`${col}-${row}`} className="streak-heatmap__cell streak-heatmap__cell--blank" style={style} />;
            const label = `${formatDay(day.date)}: ${day.count} quest${day.count === 1 ? "" : "s"} completed`;
            return (
              <span
                key={day.date}
                className={`streak-heatmap__cell streak-heatmap__cell--${intensity(day.count, maxCount)}${
                  day.date === lastDay.date ? " streak-heatmap__cell--today" : ""
                }`}
                style={style}
                title={label}
                aria-label={label}
                role="img"
                tabIndex={0}
                onMouseEnter={() => setHovered(day)}
                onFocus={() => setHovered(day)}
                onBlur={() => setHovered(null)}
              />
            );
          })
        )}
      </div>

      <div className="streak-heatmap__footer">
        <span className="streak-heatmap__detail" aria-live="polite">
          <strong>{formatDay(detail.date)}</strong> · {detail.count} quest{detail.count === 1 ? "" : "s"} completed
        </span>
        <div className="streak-heatmap__legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className={`streak-heatmap__swatch streak-heatmap__cell--${level}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
