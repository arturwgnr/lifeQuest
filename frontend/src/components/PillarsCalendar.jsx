import { ChevronLeft, ChevronRight } from "lucide-react";
import { pillarCompletionColor } from "../constants/pillars.js";
import "../styles/PillarsCalendar.css";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(monthDate) {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(Date.UTC(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Direct structural template of JournalCalendar's month grid, swapping
// ratingColor(dayRating) for a completion-rate color ramp.
export default function PillarsCalendar({ summaryByDate, month, onMonthChange, selectedDate, onSelectDate }) {
  const cells = buildMonthGrid(month);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const todayKey = toDateKey(new Date(new Date().toDateString()));

  const shiftMonth = delta => {
    onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1)));
  };

  return (
    <div className="pillars-calendar">
      <div className="pillars-calendar__header">
        <button type="button" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={16} />
        </button>
        <h4>{monthLabel}</h4>
        <button type="button" onClick={() => shiftMonth(1)}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="pillars-calendar__weekdays">
        {WEEKDAY_LABELS.map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="pillars-calendar__grid">
        {cells.map((date, idx) => {
          if (!date) return <span key={idx} className="pillars-calendar__cell pillars-calendar__cell--empty" />;
          const key = toDateKey(date);
          const day = summaryByDate.get(key);
          const rate = day && day.totalCount > 0 ? Math.round((day.completedCount / day.totalCount) * 100) : null;
          const color = pillarCompletionColor(rate);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`pillars-calendar__cell ${key === selectedDate ? "pillars-calendar__cell--selected" : ""} ${
                key === todayKey ? "pillars-calendar__cell--today" : ""
              }`}
              style={color ? { background: color, borderColor: color } : undefined}
              title={day ? `${day.completedCount}/${day.totalCount} pillars completed` : "No report"}
            >
              <span className={`pillars-calendar__cell-day ${color ? "pillars-calendar__cell-day--on-color" : ""}`}>
                {date.getUTCDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
