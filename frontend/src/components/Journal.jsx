import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Trash2, Save, BarChart2 } from "lucide-react";
import { api } from "../api/client.js";
import { MOOD_OPTIONS, ratingColor } from "../constants/moods.js";
import JournalCalendar from "./JournalCalendar.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Journal.css";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [month, setMonth] = useState(() => new Date(new Date().toDateString()));
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [weeklyAiLimitReached, setWeeklyAiLimitReached] = useState(false);

  const [text, setText] = useState("");
  const [dayRating, setDayRating] = useState(3);
  const [moods, setMoods] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [entryAiLimitReached, setEntryAiLimitReached] = useState(false);

  const entriesByDate = useMemo(() => new Map(entries.map(e => [e.entryDate.slice(0, 10), e])), [entries]);

  const loadEntries = async () => {
    const { entries: loaded } = await api.journal.list();
    setEntries(loaded);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadEntries();
      setIsLoading(false);
    })();

    (async () => {
      setInsightLoading(true);
      const { insight: loaded, aiLimitReached } = await api.journal.generateInsight();
      setInsight(loaded);
      setWeeklyAiLimitReached(!!aiLimitReached);
      setInsightLoading(false);
    })();
  }, []);

  useEffect(() => {
    const existing = entriesByDate.get(selectedDate);
    setText(existing?.text || "");
    setDayRating(existing?.dayRating || 3);
    setMoods(existing?.moods || []);
  }, [selectedDate, entriesByDate]);

  const toggleMood = key => {
    setMoods(prev => (prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]));
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    try {
      const { aiLimitReached } = await api.journal.upsert(selectedDate, { text, dayRating, moods });
      setEntryAiLimitReached(!!aiLimitReached);
      await loadEntries();
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await api.journal.remove(selectedDate);
    await loadEntries();
    setText("");
    setDayRating(3);
    setMoods([]);
  };

  const hasExistingEntry = entriesByDate.has(selectedDate);
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });

  if (isLoading) {
    return (
      <div className="journal__loading">
        <LoadingIndicator variant="panel" size="lg" label="Opening your journal..." />
      </div>
    );
  }

  return (
    <div className="journal">
      <div className="journal__header">
        <h2>Journal</h2>
        <Link to="/app/journal/stats" className="journal__stats-link">
          <BarChart2 size={14} />
          View Journal Stats
        </Link>
      </div>

      <div className="journal__grid">
        <section className="journal__entry-card">
          <h3>{selectedDateLabel}</h3>

          <div className="journal__rating-row">
            <span className="journal__field-label">How was the day?</span>
            <div className="journal__rating-buttons">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`journal__rating-button ${dayRating === n ? "journal__rating-button--active" : ""}`}
                  style={{ background: dayRating === n ? ratingColor(n) : undefined, borderColor: ratingColor(n) }}
                  onClick={() => setDayRating(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="journal__mood-row">
            <span className="journal__field-label">Mood</span>
            <div className="journal__mood-chips">
              {MOOD_OPTIONS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  className={`journal__mood-chip ${moods.includes(m.key) ? "journal__mood-chip--active" : ""}`}
                  onClick={() => toggleMood(m.key)}
                >
                  <m.icon size={13} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="journal__textarea"
            rows={8}
            placeholder="Write freely about your day..."
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <div className="journal__entry-actions">
            {hasExistingEntry && (
              <button type="button" className="journal__delete" onClick={handleDelete}>
                <Trash2 size={14} />
                Delete Entry
              </button>
            )}
            <button type="button" className="journal__save" onClick={handleSave} disabled={isSaving || !text.trim()}>
              {isSaving ? <LoadingIndicator variant="inline" size="sm" label="Saving..." /> : (
                <>
                  <Save size={14} />
                  Save Entry
                </>
              )}
            </button>
            {savedNotice && <span className="journal__saved-notice">Saved</span>}
          </div>

          {entriesByDate.get(selectedDate)?.insightText && (
            <div className="journal__entry-insight">
              <Sparkles size={13} />
              <p>{entriesByDate.get(selectedDate).insightText}</p>
            </div>
          )}
          {entryAiLimitReached && (
            <p className="journal__ai-limit-note">Daily AI limit reached — insight will resume tomorrow.</p>
          )}
        </section>

        <div className="journal__side">
          <JournalCalendar
            entriesByDate={entriesByDate}
            month={month}
            onMonthChange={setMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <section className="journal__insight-card">
            <h4>
              <Sparkles size={14} />
              Weekly Insight
            </h4>
            {insightLoading ? (
              <div className="journal__insight-loading">
                <LoadingIndicator variant="inline" size="sm" label="Reflecting on your week..." />
              </div>
            ) : weeklyAiLimitReached ? (
              <p className="journal__ai-limit-note">Daily AI limit reached — your weekly insight will resume tomorrow.</p>
            ) : insight ? (
              <>
                <p className="journal__insight-range">
                  {new Date(insight.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })} &ndash;{" "}
                  {new Date(insight.weekEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
                <p className="journal__insight-text">{insight.summaryText}</p>
              </>
            ) : (
              <p className="journal__insight-loading">
                No insight yet &mdash; write a few entries this week and check back.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
