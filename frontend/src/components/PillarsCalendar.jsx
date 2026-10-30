import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { completionRate, dayQualityLabel, pillarScaleStyle } from "../constants/pillars.js";
import { resolveStamp } from "../constants/stamps.js";
import LoadingIndicator from "./LoadingIndicator.jsx";
import StampBadge from "./StampBadge.jsx";
import "../styles/PillarsCalendar.css";

// Two clicks/taps on the same reported day within this window count as a
// double-click (desktop) or double-tap (touch, where dblclick is unreliable).
const DOUBLE_TAP_MS = 300;
// Single clicks on a reported day wait this long before selecting, so a
// double-click never also opens the day. Short enough not to feel laggy;
// unreported days and the already-selected day skip the wait entirely.
const SINGLE_CLICK_DELAY_MS = 220;

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

function dayTypeName(day) {
  if (!day) return null;
  return day.groupName ? `${day.groupName}${day.groupDeleted ? " (deleted)" : ""}` : "Deleted day type";
}

// The stamp glyph for a reported day. Deleted day types have no stamp left,
// so they get a plain dot instead of a guessed symbol.
function DayStamp({ day }) {
  if (day.groupDeleted) return <span className="pillars-calendar__cell-stamp pillars-calendar__cell-stamp--dot" aria-hidden="true" />;
  const { Icon } = resolveStamp({ stampIcon: day.stampIcon, name: day.groupName });
  return (
    <span className="pillars-calendar__cell-stamp" aria-hidden="true">
      <Icon strokeWidth={2.25} />
    </span>
  );
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
export default function PillarsCalendar({
  summaryByDate,
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  todayKey,
  onRequestDelete,
  isDeleting = false
}) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [direction, setDirection] = useState(0);
  const lastTapRef = useRef(null);
  const clickTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(clickTimerRef.current), []);

  const handleCellClick = (key, hasReport) => {
    const now = Date.now();
    const last = lastTapRef.current;

    if (hasReport && last && last.key === key && now - last.time < DOUBLE_TAP_MS) {
      clearTimeout(clickTimerRef.current);
      lastTapRef.current = null;
      onRequestDelete(key);
      return;
    }

    lastTapRef.current = { key, time: now };
    clearTimeout(clickTimerRef.current);
    if (!hasReport || key === selectedDate) {
      onSelectDate(key);
      return;
    }
    clickTimerRef.current = setTimeout(() => onSelectDate(key), SINGLE_CLICK_DELAY_MS);
  };

  // Keyboard path to the same action: Delete/Backspace on a focused day
  const handleCellKeyDown = (e, key, hasReport) => {
    if (hasReport && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      onRequestDelete(key);
    }
  };
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

  // Legend lists only the day types actually stamped on this month's grid
  const legendTypes = [];
  const seenTypes = new Set();
  for (const day of monthDays) {
    const typeKey = day.groupId || `deleted:${day.groupName}`;
    if (seenTypes.has(typeKey)) continue;
    seenTypes.add(typeKey);
    legendTypes.push(day);
  }

  const detailKey = hoveredKey || selectedDate;
  const detailDay = summaryByDate.get(detailKey);
  const detailRate = detailDay ? completionRate(detailDay.completedCount, detailDay.totalCount) : null;

  return (
    <div className="pillars-calendar" aria-busy={isDeleting}>
      {isDeleting && <LoadingIndicator variant="overlay" size="sm" label="Deleting day..." />}
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
            ? `${formatLongDate(key)}: ${dayTypeName(day)}, ${rate ?? 0}% (${day.completedCount} of ${day.totalCount} pillars)`
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
              onClick={() => handleCellClick(key, Boolean(day))}
              onKeyDown={e => handleCellKeyDown(e, key, Boolean(day))}
              onMouseEnter={() => setHoveredKey(key)}
              onFocus={() => setHoveredKey(key)}
              onBlur={() => setHoveredKey(null)}
              className={classes}
              style={pillarScaleStyle(rate) || undefined}
              aria-label={label}
              aria-pressed={key === selectedDate}
              title={label}
            >
              {day && <DayStamp day={day} />}
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
          <span className="pillars-calendar__detail-sub">
            {detailDay ? (
              <>
                {detailDay.groupDeleted ? (
                  <span className="pillars-calendar__detail-dot" aria-hidden="true" />
                ) : (
                  <StampBadge stampIcon={detailDay.stampIcon} stampTone={detailDay.stampTone} name={detailDay.groupName} size="xs" />
                )}
                <span>
                  {dayTypeName(detailDay)} · {detailRate ?? 0}% · {detailDay.completedCount}/{detailDay.totalCount} pillars
                </span>
              </>
            ) : (
              "No report saved for this day"
            )}
          </span>
        </div>
        <span className="pillars-calendar__detail-label">{dayQualityLabel(detailRate)}</span>
        {detailDay && (
          <button
            type="button"
            className="pillars-calendar__delete"
            onClick={() => onRequestDelete(detailKey)}
            disabled={isDeleting}
            aria-label={`Delete report for ${formatLongDate(detailKey)}`}
            title="Delete this day's report"
          >
            <Trash2 size={14} />
            <span>Delete day</span>
          </button>
        )}
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

      {legendTypes.length > 0 && (
        <ul className="pillars-calendar__stamps" aria-label="Day types this month">
          {legendTypes.map(day => (
            <li key={day.groupId || `deleted:${day.groupName}`}>
              {day.groupDeleted ? (
                <span className="pillars-calendar__detail-dot" aria-hidden="true" />
              ) : (
                <StampBadge stampIcon={day.stampIcon} stampTone={day.stampTone} name={day.groupName} size="xs" />
              )}
              <span>{dayTypeName(day)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
