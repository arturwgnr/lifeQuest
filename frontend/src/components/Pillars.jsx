import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Save, Settings } from "lucide-react";
import { api } from "../api/client.js";
import PillarsCalendar from "./PillarsCalendar.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Pillars.css";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Pillars() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [month, setMonth] = useState(() => new Date(new Date().toDateString()));
  const [summary, setSummary] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [logGroupId, setLogGroupId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const activeGroup = groups.find(g => g.isActive) || null;
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
      await Promise.all([loadGroups(), loadSummary()]);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    (async () => {
      try {
        const { log } = await api.pillars.logs.get(selectedDate);
        setLogGroupId(log.groupId);
        setChecklist(
          log.entries
            .slice()
            .sort((a, b) => a.pillar.order - b.pillar.order)
            .map(e => ({ pillarId: e.pillarId, title: e.pillar.title, completed: e.completed }))
        );
      } catch (err) {
        if (err.status !== 404) throw err;
        if (activeGroup) {
          setLogGroupId(activeGroup.id);
          setChecklist(activeGroup.pillars.map(p => ({ pillarId: p.id, title: p.title, completed: false })));
        } else {
          setLogGroupId(null);
          setChecklist([]);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, isLoading, groups]);

  const toggleEntry = pillarId => {
    setChecklist(prev => prev.map(e => (e.pillarId === pillarId ? { ...e, completed: !e.completed } : e)));
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
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
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
    } finally {
      setIsSwitching(false);
    }
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
      <div className="pillars__header">
        <div className="pillars__header-text">
          <h2>
            <CalendarCheck size={18} />
            Pillars Mode
          </h2>
          <p>Track the recurring daily habits that hold everything else up, separate from your one-off quests.</p>
        </div>
        <Link to="/app/pillars/edit" className="pillars__edit-link">
          <Settings size={14} />
          Edit Pillars
        </Link>
      </div>

      {groups.length > 1 && (
        <div className="pillars__group-switch">
          <span>Active group:</span>
          <select value={activeGroup?.id || ""} onChange={e => handleSwitchGroup(e.target.value)} disabled={isSwitching}>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="pillars__grid">
        <section className="pillars__report-card">
          <h3>{selectedDateLabel}</h3>

          {checklist.length === 0 ? (
            <p className="pillars__empty">
              No Pillars defined for this group yet. <Link to="/app/pillars/edit">Add some</Link> to start tracking.
            </p>
          ) : (
            <div className="pillars__checklist">
              {checklist.map(entry => (
                <label key={entry.pillarId} className="pillars__checklist-item">
                  <input type="checkbox" checked={entry.completed} onChange={() => toggleEntry(entry.pillarId)} />
                  <span className={entry.completed ? "pillars__checklist-title--done" : ""}>{entry.title}</span>
                </label>
              ))}
            </div>
          )}

          <div className="pillars__report-actions">
            <button type="button" className="pillars__save" onClick={handleSave} disabled={isSaving || checklist.length === 0}>
              {isSaving ? (
                <LoadingIndicator variant="inline" size="sm" label="Saving..." />
              ) : (
                <>
                  <Save size={14} />
                  Save Report
                </>
              )}
            </button>
            {savedNotice && <span className="pillars__saved-notice">Saved</span>}
          </div>
        </section>

        <PillarsCalendar
          summaryByDate={summaryByDate}
          month={month}
          onMonthChange={setMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    </div>
  );
}
