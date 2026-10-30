import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
  Save,
  Settings
} from "lucide-react";
import { api } from "../api/client.js";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { completionRate, dayQualityLabel, localDateKey, pillarScaleStyle } from "../constants/pillars.js";
import PillarsCalendar from "./PillarsCalendar.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import StampBadge from "./StampBadge.jsx";
import PillarTitleForm from "./PillarTitleForm.jsx";
import "../styles/Pillars.css";

function shiftDateKey(key, days) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatFullDate(key) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
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
  const [pendingDeleteKey, setPendingDeleteKey] = useState(null);
  const [isDeletingDay, setIsDeletingDay] = useState(false);
  // Bumped after deleting the selected day so its (now empty) checklist reloads
  const [logVersion, setLogVersion] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [isAddingPillar, setIsAddingPillar] = useState(false);
  const [isSavingPillar, setIsSavingPillar] = useState(false);

  const activeGroup = groups.find(g => g.isActive) || null;
  const logGroup = groups.find(g => g.id === logGroupId) || null;
  const summaryByDate = useMemo(() => new Map(summary.map(s => [s.date, s])), [summary]);
  // Read inside the day loader without making every groups change reload
  // the day (which would wipe unsaved checks after adding a pillar inline)
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const loadGroups = async () => {
    const { groups: loaded } = await api.pillars.groups.list();
    setGroups(loaded);
    return loaded;
  };

  const loadSummary = async () => {
    const { summary: loaded } = await api.pillars.summary();
    setSummary(loaded);
  };

  const loadAll = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await Promise.all([loadGroups(), loadSummary()]);
    } catch (err) {
      setLoadError(err);
      errorToastFor(toast, err, "Couldn't load your pillars");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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
      const currentActive = groupsRef.current.find(g => g.isActive) || null;
      try {
        const { log } = await api.pillars.logs.get(selectedDate);
        // null when the day's group was deleted: the day keeps its snapshot
        // score on the calendar but has no checklist left to show
        groupId = log.groupId;
        next = log.entries
          .slice()
          .sort((a, b) => a.pillar.order - b.pillar.order)
          .map(e => ({ pillarId: e.pillarId, title: e.pillar.title, completed: e.completed }));

        // Pillars added to the group after today's report was saved show up
        // unchecked, without touching the saved report until it's saved again
        const group = groupId && selectedDate === todayKey ? groupsRef.current.find(g => g.id === groupId) : null;
        if (group) {
          const logged = new Set(next.map(e => e.pillarId));
          const order = new Map(group.pillars.map(p => [p.id, p.order]));
          next = [
            ...next,
            ...group.pillars
              .filter(p => !logged.has(p.id))
              .map(p => ({ pillarId: p.id, title: p.title, completed: false, isNew: true }))
          ].sort((a, b) => (order.get(a.pillarId) ?? 0) - (order.get(b.pillarId) ?? 0));
        }
      } catch (err) {
        if (err.status !== 404) {
          if (!cancelled) errorToastFor(toast, err, "Couldn't load that day's report");
        } else if (currentActive) {
          groupId = currentActive.id;
          next = currentActive.pillars.map(p => ({ pillarId: p.id, title: p.title, completed: false }));
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
  }, [selectedDate, isLoading, activeGroup?.id, logVersion]);

  const toggleEntry = pillarId => {
    setChecklist(prev => prev.map(e => (e.pillarId === pillarId ? { ...e, completed: !e.completed } : e)));
  };

  const isDirty = checklist.some((e, i) => savedChecklist[i]?.completed !== e.completed);
  const completedCount = checklist.filter(e => e.completed).length;
  const liveRate = completionRate(completedCount, checklist.length);
  const isReported = summaryByDate.has(selectedDate);
  const savedDay = summaryByDate.get(selectedDate) || null;
  const savedRate = savedDay ? completionRate(savedDay.completedCount, savedDay.totalCount) : null;
  const hasNewPillars = checklist.some(e => e.isNew);
  // The calendar keeps the snapshot a day was saved with; say so whenever the
  // checklist on screen no longer matches it (pillars added/removed since)
  const snapshotDiffers = Boolean(savedDay) && !isDirty && savedDay.totalCount !== checklist.length;
  const isDeletedDayType = isReported && !logGroupId && !isFetchingLog;
  const canAddPillar = Boolean(logGroup) && selectedDate === todayKey;

  // Optimistic: the pillar joins today's checklist (unchecked) right away and
  // is saved to the group; a failure takes it back out.
  const handleAddPillar = async title => {
    if (!logGroup) return;
    const tempId = `pending-${Date.now()}`;
    const group = logGroup;
    const entry = { pillarId: tempId, title, completed: false, isNew: true };
    setChecklist(prev => [...prev, entry]);
    setSavedChecklist(prev => [...prev, entry]);
    setIsSavingPillar(true);
    try {
      const { pillar } = await api.pillars.items.add(group.id, { title });
      const swap = list => list.map(e => (e.pillarId === tempId ? { ...e, pillarId: pillar.id } : e));
      setChecklist(swap);
      setSavedChecklist(swap);
      setGroups(prev => prev.map(g => (g.id === group.id ? { ...g, pillars: [...g.pillars, pillar] } : g)));
      setIsAddingPillar(false);
      toast.success(`Pillar added: ${title}`, {
        description: isReported
          ? "It counts from today. Save the report to include it in today's score."
          : `It counts in ${group.name} from today on.`
      });
    } catch (err) {
      const drop = list => list.filter(e => e.pillarId !== tempId);
      setChecklist(drop);
      setSavedChecklist(drop);
      errorToastFor(toast, err, "Pillar couldn't be added");
      throw err;
    } finally {
      setIsSavingPillar(false);
    }
  };

  const handleSave = async () => {
    if (!logGroupId) return;
    setIsSaving(true);
    try {
      await api.pillars.logs.upsert(selectedDate, {
        groupId: logGroupId,
        entries: checklist.map(e => ({ pillarId: e.pillarId, completed: e.completed }))
      });
      await loadSummary();
      const saved = checklist.map(({ isNew, ...e }) => e);
      setChecklist(saved);
      setSavedChecklist(saved);
      toast.success(`Pillar report saved · ${liveRate}%`, {
        description: `${dayQualityLabel(liveRate)}: ${completedCount} of ${checklist.length} pillars for ${selectedDateLabel}`
      });
    } catch (err) {
      errorToastFor(toast, err, "Report couldn't be saved");
    } finally {
      setIsSaving(false);
    }
  };

  // Days without a report have nothing to delete, so they never open the modal
  const requestDeleteDay = key => {
    if (!summaryByDate.has(key) || isDeletingDay) return;
    setPendingDeleteKey(key);
  };

  // Optimistic: the day drops off the calendar (and its color) immediately;
  // a failed request puts it back. Only that day's log is removed.
  const handleDeleteDay = async () => {
    const key = pendingDeleteKey;
    if (!key) return;
    const snapshot = summary;
    setPendingDeleteKey(null);
    setSummary(prev => prev.filter(d => d.date !== key));
    setIsDeletingDay(true);
    try {
      await api.pillars.logs.remove(key);
      toast.info(`Report for ${formatFullDate(key)} deleted`);
      if (key === selectedDate) setLogVersion(v => v + 1);
    } catch (err) {
      setSummary(snapshot);
      errorToastFor(toast, err, "That day couldn't be deleted, so it was restored");
    } finally {
      setIsDeletingDay(false);
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

  if (loadError) {
    const offline = loadError instanceof TypeError;
    return (
      <div className="pillars__loading">
        <div className="pillars__load-error" role="alert">
          <AlertTriangle size={20} />
          <h3>Pillars couldn't load</h3>
          <p>{offline ? "Network error. Check your connection or whether the server is running." : loadError.message}</p>
          {loadError.status && (
            <code>
              HTTP {loadError.status}
              {loadError.data?.code ? ` · ${loadError.data.code}` : ""}
            </code>
          )}
          <button type="button" className="pillars__save btn-lift" onClick={loadAll}>
            <RotateCw size={14} />
            Try again
          </button>
        </div>
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
              {activeGroup && <StampBadge {...activeGroup} size="xs" />}
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
                  {logGroup ? (
                    <span className="pillars__day-type">
                      <StampBadge {...logGroup} size="xs" />
                      {logGroup.name}
                    </span>
                  ) : (
                    isDeletedDayType && (
                      <span className="pillars__day-type">
                        <span className="pillars__day-type-dot" aria-hidden="true" />
                        {savedDay?.groupName || "Deleted day type"}
                      </span>
                    )
                  )}
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

          {isDeletedDayType ? (
            <p className="pillars__empty">
              This day was reported as <strong>{savedDay?.groupName || "a day type"}</strong>, which has since been deleted.
              Its saved score of {savedRate}% ({savedDay.completedCount}/{savedDay.totalCount}) stays on your calendar.
            </p>
          ) : checklist.length === 0 ? (
            <p className="pillars__empty">
              No pillars in {logGroup ? logGroup.name : "this group"} yet.{" "}
              {canAddPillar ? "Add one below" : <Link to="/app/pillars/edit">Add some</Link>} to start tracking.
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
                      {entry.isNew && isReported && <span className="pillars__new-tag">New</span>}
                    </label>
                  </li>
                ))}
              </ul>

              {snapshotDiffers && (
                <p className="pillars__snapshot-note">
                  {hasNewPillars
                    ? `Saved on the calendar as ${savedRate}% (${savedDay.completedCount}/${savedDay.totalCount}). A pillar was added after this report, so save again to include it.`
                    : `Saved on the calendar as ${savedRate}% (${savedDay.completedCount}/${savedDay.totalCount}), from before this group's pillars changed. Saving again updates it.`}
                </p>
              )}
            </>
          )}

          {canAddPillar &&
            (isAddingPillar ? (
              <div className="pillars__add-pillar">
                <PillarTitleForm
                  placeholder={`New pillar for ${logGroup.name}`}
                  submitLabel="Add"
                  isSaving={isSavingPillar}
                  onSubmit={handleAddPillar}
                  onCancel={() => setIsAddingPillar(false)}
                />
              </div>
            ) : (
              <button type="button" className="pillars__add-pillar-btn" onClick={() => setIsAddingPillar(true)}>
                <Plus size={13} />
                Add pillar
              </button>
            ))}

          <div className="pillars__report-actions">
            <span className={`pillars__save-state${isDirty || hasNewPillars ? " pillars__save-state--dirty" : ""}`}>
              {isDirty
                ? "Unsaved changes"
                : isReported && hasNewPillars
                  ? "New pillar not in the saved report yet"
                  : isReported
                    ? "All changes saved"
                    : "Not saved yet"}
            </span>
            <button
              type="button"
              className="pillars__save btn-lift"
              onClick={handleSave}
              disabled={
                isSaving ||
                isFetchingLog ||
                isSavingPillar ||
                checklist.length === 0 ||
                (!isDirty && isReported && !hasNewPillars && !snapshotDiffers)
              }
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
          onRequestDelete={requestDeleteDay}
          isDeleting={isDeletingDay}
        />
      </div>

      {pendingDeleteKey && (
        <ConfirmModal
          title="Delete this day's report?"
          message={
            <>
              <p>
                <strong>{formatFullDate(pendingDeleteKey)}</strong>
              </p>
              <p>
                This removes that day's pillar report and its{" "}
                {(() => {
                  const day = summaryByDate.get(pendingDeleteKey);
                  return day ? `${completionRate(day.completedCount, day.totalCount)}%` : "";
                })()}{" "}
                completion score. Your pillar group and every other day stay untouched.
              </p>
              <p>This cannot be undone.</p>
            </>
          }
          confirmLabel="Delete day"
          onConfirm={handleDeleteDay}
          onCancel={() => setPendingDeleteKey(null)}
        />
      )}
    </div>
  );
}
