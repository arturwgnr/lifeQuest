import { ChevronLeft, ChevronRight } from "lucide-react";
import { MOOD_BY_KEY, ratingColor } from "../constants/moods.js";
import "../styles/JournalCalendar.css";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(monthDate) {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(Date.UTC(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function JournalCalendar({ entriesByDate, month, onMonthChange, selectedDate, onSelectDate }) {
  const cells = buildMonthGrid(month);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const todayKey = toDateKey(new Date(new Date().toDateString()));

  const shiftMonth = delta => {
    onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1)));
  };

  return (
    <div className="journal-calendar">
      <div className="journal-calendar__header">
        <button type="button" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={16} />
        </button>
        <h4>{monthLabel}</h4>
        <button type="button" onClick={() => shiftMonth(1)}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="journal-calendar__weekdays">
        {WEEKDAY_LABELS.map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="journal-calendar__grid">
        {cells.map((date, idx) => {
          if (!date) return <span key={idx} className="journal-calendar__cell journal-calendar__cell--empty" />;
          const key = toDateKey(date);
          const entry = entriesByDate.get(key);
          const mood = entry?.moods?.[0] ? MOOD_BY_KEY[entry.moods[0]] : null;
          const MoodIcon = mood?.icon;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`journal-calendar__cell ${key === selectedDate ? "journal-calendar__cell--selected" : ""} ${
                key === todayKey ? "journal-calendar__cell--today" : ""
              }`}
              style={entry ? { background: ratingColor(entry.dayRating), borderColor: ratingColor(entry.dayRating) } : undefined}
              title={entry ? `Rating ${entry.dayRating}/5` : "No entry"}
            >
              <span className={`journal-calendar__cell-day ${entry ? "journal-calendar__cell-day--on-color" : ""}`}>
                {date.getUTCDate()}
              </span>
              {MoodIcon && <MoodIcon size={11} className="journal-calendar__cell-mood" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
