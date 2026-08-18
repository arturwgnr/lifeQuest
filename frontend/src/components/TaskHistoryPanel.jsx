import { useState } from "react";
import { List, GalleryHorizontal } from "lucide-react";
import "../styles/TaskHistoryPanel.css";

function formatDay(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

// Same TaskStatusHistory-derived data as the heatmap, presented as a
// day-by-day record instead of a dense grid: a scannable list, plus a
// horizontally-scrollable "story mode" timeline showing the shape of
// productivity over weeks/months.
export default function TaskHistoryPanel({ history }) {
  const [view, setView] = useState("story");

  if (!history || history.length === 0) {
    return <p className="task-history__empty">No completions recorded in this window.</p>;
  }

  const reverseChronological = [...history].reverse();
  const maxCount = Math.max(1, ...history.map(d => d.completedCount));

  return (
    <div className="task-history">
      <div className="task-history__toggle">
        <button
          type="button"
          className={view === "story" ? "task-history__toggle-btn--active" : ""}
          onClick={() => setView("story")}
        >
          <GalleryHorizontal size={13} />
          Story Mode
        </button>
        <button
          type="button"
          className={view === "list" ? "task-history__toggle-btn--active" : ""}
          onClick={() => setView("list")}
        >
          <List size={13} />
          List
        </button>
      </div>

      {view === "story" ? (
        <div className="task-history__story">
          {history.map(day => (
            <div
              key={day.date}
              className="task-history__story-item"
              title={`${formatDay(day.date)}: ${day.completedCount} completed`}
            >
              <div
                className="task-history__story-bar"
                style={{ height: `${Math.max(8, (day.completedCount / maxCount) * 100)}%` }}
              />
              <span className="task-history__story-count">{day.completedCount}</span>
              <span className="task-history__story-date">{formatDay(day.date)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="task-history__list">
          {reverseChronological.map(day => (
            <div key={day.date} className="task-history__list-row">
              <span className="task-history__list-date">{formatDay(day.date)}</span>
              <span className="task-history__list-count">{day.completedCount} completed</span>
              <span className="task-history__list-titles">{day.titles.join(", ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
