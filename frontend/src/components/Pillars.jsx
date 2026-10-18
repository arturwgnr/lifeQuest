import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Layers, Save, Settings } from "lucide-react";
import { api } from "../api/client.js";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { completionRate, dayQualityLabel, pillarScaleStyle } from "../constants/pillars.js";
import PillarsCalendar from "./PillarsCalendar.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Pillars.css";

// Calendar day in the user's own timezone (toISOString would roll over to
// "tomorrow" in the evening for anyone west of UTC).
function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDateKey(key, days) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthOf(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Live score for the day being edited, painted with the same scale as the calendar
function DayScore({ rate, completed, total }) {
  const progress = rate === null ? 0 : (rate / 100) * RING_CIRCUMFERENCE;
  return (
    <div className="pillars-score" style={pillarScaleStyle(rate ?? 0) || undefined}>
      <svg viewBox="0 0 80 80" className="pillars-score__ring" aria-hidden="true">
        <circle cx="40" cy="40" r={RING_RADIUS} className="pillars-score__track" />
        <circle
          cx="40"
          cy="40"
          r={RING_RADIUS}
          className="pillars-score__fill"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE - progress}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="pillars-score__value">
        <strong>{rate === null ? "–" : `${rate}%`}</strong>
        <span>
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}

export default function Pillars() {
  const toast = useToast();
  const todayKey = localDateKey();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [month, setMonth] = useState(() => monthOf(todayKey));
  const [summary, setSummary] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [savedChecklist, setSavedChecklist] = useState([]);
  const [logGroupId, setLogGroupId] = useState(null);
  const [isFetchingLog, setIsFetchingLog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const activeGroup = groups.find(g => g.isActive) || null;
  const logGroup = groups.find(g => g.id === logGroupId) || null;
  const summaryByDate = useMemo(() => new Map(summary.map(s => [s.date, s])), [summary]);

  const loadGroups = async () => {
    const { groups: loaded } = await api.pillars.groups.list();
    setGroups(loaded);
    return loaded;
  };

  const loadSummary = async () => {
    const { summary: loaded } = await api.pillars.summary();
    setSummary(loaded);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadGroups(), loadSummary()]);
      } catch (err) {
        errorToastFor(toast, err, "Couldn't load your pillars");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The previous day's checklist stays on screen (under an overlay) while the
  // next one loads, so switching days never flashes an empty card.
  useEffect(() => {
    if (isLoading) return undefined;
    let cancelled = false;
    (async () => {
      setIsFetchingLog(true);
      let next = [];
      let groupId = null;
      try {
        const { log } = await api.pillars.logs.get(selectedDate);
        groupId = log.groupId;
        next = log.entries
          .slice()
          .sort((a, b) => a.pillar.order - b.pillar.order)
          .map(e => ({ pillarId: e.pillarId, title: e.pillar.title, completed: e.completed }));
      } catch (err) {
        if (err.status !== 404) {
          if (!cancelled) errorToastFor(toast, err, "Couldn't load that day's report");
        } else if (activeGroup) {
          groupId = activeGroup.id;
          next = activeGroup.pillars.map(p => ({ pillarId: p.id, title: p.title, completed: false }));
        }
      }
      if (cancelled) return;
      setLogGroupId(groupId);
      setChecklist(next);
      setSavedChecklist(next);
      setIsFetchingLog(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, isLoading, groups]);

  const toggleEntry = pillarId => {
    setChecklist(prev => prev.map(e => (e.pillarId === pillarId ? { ...e, completed: !e.completed } : e)));
  };

  const isDirty = checklist.some((e, i) => savedChecklist[i]?.completed !== e.completed);
  const completedCount = checklist.filter(e => e.completed).length;
  const liveRate = completionRate(completedCount, checklist.length);
  const isReported = summaryByDate.has(selectedDate);

  const handleSave = async () => {
    if (!logGroupId) return;
    setIsSaving(true);
    try {
      await api.pillars.logs.upsert(selectedDate, {
        groupId: logGroupId,
        entries: checklist.map(e => ({ pillarId: e.pillarId, completed: e.completed }))
      });
      await loadSummary();
      setSavedChecklist(checklist);
      toast.success(`Pillar report saved · ${liveRate}%`, {
        description: `${dayQualityLabel(liveRate)} — ${completedCount} of ${checklist.length} pillars for ${selectedDateLabel}`
      });
    } catch (err) {
      errorToastFor(toast, err, "Report couldn't be saved");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchGroup = async groupId => {
    if (!groupId || groupId === activeGroup?.id) return;
    setIsSwitching(true);
    try {
      const { groups: updated } = await api.pillars.groups.activate(groupId);
      setGroups(updated);
      const next = updated.find(g => g.id === groupId);
      toast.info(`Active group: ${next?.name || "updated"}`, {
        description: "Days you already reported keep the group they were saved with."
      });
    } catch (err) {
      errorToastFor(toast, err, "Couldn't switch group");
    } finally {
      setIsSwitching(false);
    }
  };

  const selectDate = key => {
    setSelectedDate(key);
    const target = monthOf(key);
    if (target.getTime() !== month.getTime()) setMonth(target);
  };

  const selectedDateLabel = new Date(`${selectedDate}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });

  if (isLoading) {
    return (
      <div className="pillars__loading">
        <LoadingIndicator variant="panel" size="lg" label="Loading your pillars..." />
      </div>
    );
  }

  return (
    <div className="pillars">
      <header className="pillars__header">
        <div className="pillars__header-text">
          <span className="pillars__eyebrow">
            <CalendarCheck size={13} />
            Pillars Mode
          </span>
          <h2>The daily habits that hold everything else up</h2>
          <p>Check off today's pillars, separate from your one-off quests. Every day is scored by percentage, so any group size compares fairly.</p>
        </div>

        <div className="pillars__header-actions">
          {groups.length > 1 && (
            <label className="pillars__group-switch">
              <Layers size={14} />
              <span className="pillars__sr">Active group</span>
              <select value={activeGroup?.id || ""} onChange={e => handleSwitchGroup(e.target.value)} disabled={isSwitching}>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {isSwitching && <LoadingIndicator size="sm" />}
            </label>
          )}
          <Link to="/app/pillars/edit" className="pillars__edit-link">
            <Settings size={14} />
            Edit Pillars
          </Link>
        </div>
      </header>

      <div className="pillars__grid">
        <section className="pillars__report-card" aria-busy={isFetchingLog}>
          {isFetchingLog && <LoadingIndicator variant="overlay" size="sm" label="Loading day..." />}

          <div className="pillars__report-head">
            <div className="pillars__day-nav">
              <button type="button" onClick={() => selectDate(shiftDateKey(selectedDate, -1))} aria-label="Previous day">
                <ChevronLeft size={16} />
              </button>
              <div className="pillars__day-label">
                <span className="pillars__day-eyebrow">
                  {selectedDate === todayKey ? "Today" : isReported ? "Reported" : "Not reported"}
                  {logGroup && <> · {logGroup.name}</>}
                </span>
                <h3>{selectedDateLabel}</h3>
              </div>
              <button
                type="button"
                onClick={() => selectDate(shiftDateKey(selectedDate, 1))}
                disabled={selectedDate >= todayKey}
                aria-label="Next day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {selectedDate !== todayKey && (
              <button type="button" className="pillars__today-btn" onClick={() => selectDate(todayKey)}>
                Jump to today
              </button>
            )}
          </div>

          {checklist.length === 0 ? (
            <p className="pillars__empty">
              No Pillars defined for this group yet. <Link to="/app/pillars/edit">Add some</Link> to start tracking.
            </p>
          ) : (
            <>
              <div className="pillars__score-row">
                <DayScore rate={liveRate} completed={completedCount} total={checklist.length} />
                <div className="pillars__score-text">
                  <strong>{dayQualityLabel(liveRate)}</strong>
                  <p>
                    {completedCount === checklist.length
                      ? "Every pillar held today. That's the whole point."
                      : `${checklist.length - completedCount} pillar${checklist.length - completedCount === 1 ? "" : "s"} left to make this a perfect day.`}
                  </p>
                  <div className="pillars__score-bar" style={pillarScaleStyle(liveRate ?? 0) || undefined}>
                    <span style={{ width: `${liveRate ?? 0}%` }} />
                  </div>
                </div>
              </div>

              <ul className="pillars__checklist">
                {checklist.map(entry => (
                  <li key={entry.pillarId}>
                    <label className={`pillars__checklist-item${entry.completed ? " pillars__checklist-item--done" : ""}`}>
                      <input type="checkbox" checked={entry.completed} onChange={() => toggleEntry(entry.pillarId)} />
                      <span className="pillars__check" aria-hidden="true">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span className="pillars__checklist-title">{entry.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="pillars__report-actions">
            <span className={`pillars__save-state${isDirty ? " pillars__save-state--dirty" : ""}`}>
              {isDirty ? "Unsaved changes" : isReported ? "All changes saved" : "Not saved yet"}
            </span>
            <button
              type="button"
              className="pillars__save btn-lift"
              onClick={handleSave}
              disabled={isSaving || isFetchingLog || checklist.length === 0 || (!isDirty && isReported)}
            >
              {isSaving ? (
                <LoadingIndicator size="sm" tone="light" label="Saving..." />
              ) : (
                <>
                  <Save size={14} />
                  Save Report
                </>
              )}
            </button>
          </div>
        </section>

        <PillarsCalendar
          summaryByDate={summaryByDate}
          month={month}
          onMonthChange={setMonth}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          todayKey={todayKey}
        />
      </div>
    </div>
  );
}
