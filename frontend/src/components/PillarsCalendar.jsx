import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { completionRate, dayQualityLabel, pillarScaleStyle } from "../constants/pillars.js";
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

function formatLongDate(key) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

// Month grid painted with the continuous completion scale. Hover (or focus,
// or tapping a day on touch) fills the detail strip below with the date, the
// group used and the exact percentage, so color is never the only signal.
export default function PillarsCalendar({ summaryByDate, month, onMonthChange, selectedDate, onSelectDate, todayKey }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [direction, setDirection] = useState(0);
  const cells = buildMonthGrid(month);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const monthKey = `${month.getUTCFullYear()}-${month.getUTCMonth()}`;

  const shiftMonth = delta => {
    setDirection(delta);
    onMonthChange(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1)));
  };

  // Month-level summary for the footer
  const monthDays = cells.filter(Boolean).map(d => summaryByDate.get(toDateKey(d))).filter(Boolean);
  const monthRates = monthDays.map(d => completionRate(d.completedCount, d.totalCount)).filter(r => r !== null);
  const monthAverage = monthRates.length ? Math.round(monthRates.reduce((a, b) => a + b, 0) / monthRates.length) : null;
  const perfectDays = monthRates.filter(r => r === 100).length;

  const detailKey = hoveredKey || selectedDate;
  const detailDay = summaryByDate.get(detailKey);
  const detailRate = detailDay ? completionRate(detailDay.completedCount, detailDay.totalCount) : null;

  return (
    <div className="pillars-calendar">
      <div className="pillars-calendar__header">
        <h4>{monthLabel}</h4>
        <div className="pillars-calendar__nav">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="pillars-calendar__weekdays">
        {WEEKDAY_LABELS.map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div
        key={monthKey}
        className={`pillars-calendar__grid${direction > 0 ? " pillars-calendar__grid--next" : direction < 0 ? " pillars-calendar__grid--prev" : ""}`}
        onMouseLeave={() => setHoveredKey(null)}
      >
        {cells.map((date, idx) => {
          if (!date) return <span key={idx} className="pillars-calendar__cell pillars-calendar__cell--empty" />;
          const key = toDateKey(date);
          const day = summaryByDate.get(key);
          const rate = day ? completionRate(day.completedCount, day.totalCount) : null;
          const isFuture = key > todayKey;
          const label = day
            ? `${formatLongDate(key)}: ${rate}% (${day.completedCount} of ${day.totalCount} pillars, ${day.groupName || "Pillars"})`
            : `${formatLongDate(key)}: no report`;

          const classes = [
            "pillars-calendar__cell",
            rate !== null ? "pillars-calendar__cell--scored" : "pillars-calendar__cell--unreported",
            key === selectedDate && "pillars-calendar__cell--selected",
            key === todayKey && "pillars-calendar__cell--today",
            isFuture && "pillars-calendar__cell--future"
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(key)}
              onMouseEnter={() => setHoveredKey(key)}
              onFocus={() => setHoveredKey(key)}
              onBlur={() => setHoveredKey(null)}
              className={classes}
              style={pillarScaleStyle(rate) || undefined}
              aria-label={label}
              aria-pressed={key === selectedDate}
              title={label}
            >
              <span className="pillars-calendar__cell-day">{date.getUTCDate()}</span>
              {rate !== null && <span className="pillars-calendar__cell-rate">{rate}%</span>}
            </button>
          );
        })}
      </div>

      <div className="pillars-calendar__detail" aria-live="polite">
        <span
          className={`pillars-calendar__detail-swatch${detailRate === null ? " pillars-calendar__detail-swatch--empty" : ""}`}
          style={pillarScaleStyle(detailRate) || undefined}
        />
        <div className="pillars-calendar__detail-text">
          <strong>
            {formatLongDate(detailKey)}
            {detailKey === todayKey && <span className="pillars-calendar__detail-today">Today</span>}
          </strong>
          <span>
            {detailDay
              ? `${detailRate}% · ${detailDay.completedCount}/${detailDay.totalCount} pillars · ${detailDay.groupName || "Pillars"}`
              : "No report saved for this day"}
          </span>
        </div>
        <span className="pillars-calendar__detail-label">{dayQualityLabel(detailRate)}</span>
      </div>

      <div className="pillars-calendar__footer">
        <div className="pillars-calendar__stats">
          <div>
            <strong>{monthAverage === null ? "–" : `${monthAverage}%`}</strong>
            <span>Avg this month</span>
          </div>
          <div>
            <strong>{monthRates.length}</strong>
            <span>Days reported</span>
          </div>
          <div>
            <strong>{perfectDays}</strong>
            <span>Perfect days</span>
          </div>
        </div>
        <div className="pillars-calendar__legend" aria-hidden="true">
          <span className="pillars-calendar__legend-empty" />
          <span className="pillars-calendar__legend-label">None</span>
          <span className="pillars-calendar__legend-label">0%</span>
          <span className="pillars-calendar__legend-bar" />
          <span className="pillars-calendar__legend-label">100%</span>
        </div>
      </div>
    </div>
  );
}
