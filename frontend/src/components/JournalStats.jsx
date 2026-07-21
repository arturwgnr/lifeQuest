import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Heart } from "lucide-react";
import { api } from "../api/client.js";
import { MOOD_BY_KEY, ratingColor } from "../constants/moods.js";
import BarChart from "./BarChart.jsx";
import "../styles/JournalStats.css";

export default function JournalStats() {
  const [window_, setWindow] = useState("4w");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const stats = await api.journal.stats(window_);
      setData(stats);
      setIsLoading(false);
    })();
  }, [window_]);

  return (
    <div className="journal-stats">
      <div className="journal-stats__header">
        <Link to="/app/journal" className="journal-stats__back">
          <ArrowLeft size={14} />
          Back to Journal
        </Link>
        <div className="journal-stats__window-toggle">
          <button type="button" className={window_ === "4w" ? "journal-stats__window-btn--active" : ""} onClick={() => setWindow("4w")}>
            Last 4 Weeks
          </button>
          <button type="button" className={window_ === "all" ? "journal-stats__window-btn--active" : ""} onClick={() => setWindow("all")}>
            All Time
          </button>
        </div>
      </div>

      <h2 className="journal-stats__title">Journal Patterns</h2>

      {isLoading || !data ? (
        <p className="journal-stats__loading">Reading between the lines...</p>
      ) : (
        <div className="journal-stats__grid">
          <div className="journal-stats__summary-row">
            <div className="journal-stats__summary-tile">
              <span className="journal-stats__summary-value">{data.entryCount}</span>
              <span className="journal-stats__summary-label">Entries</span>
            </div>
            <div className="journal-stats__summary-tile">
              <span className="journal-stats__summary-value" style={{ color: data.avgRating ? ratingColor(Math.round(data.avgRating)) : undefined }}>
                {data.avgRating || "-"}
              </span>
              <span className="journal-stats__summary-label">Average Rating</span>
            </div>
          </div>

          <section className="journal-stats__card">
            <h3>
              <TrendingUp size={15} />
              Rating Trend
            </h3>
            <p className="journal-stats__card-sub">Each entry's day rating, colored the same way as the calendar.</p>
            <BarChart
              bars={data.ratingTrend.map(r => ({
                key: r.date,
                label: new Date(`${r.date}T00:00:00.000Z`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC"
                }),
                values: [r.dayRating],
                color: ratingColor(r.dayRating)
              }))}
              colors={[ratingColor(3)]}
              showValues
              emptyLabel="No journal entries in this window yet."
            />
          </section>

          <section className="journal-stats__card">
            <h3>
              <Heart size={15} />
              Mood Frequency
            </h3>
            <p className="journal-stats__card-sub">How often each mood was tagged in this window.</p>
            <BarChart
              bars={data.moodFrequency.map(m => ({
                key: m.mood,
                label: MOOD_BY_KEY[m.mood]?.label || m.mood,
                values: [m.count]
              }))}
              colors={["#6366f1"]}
              showValues
              emptyLabel="No moods tagged in this window yet."
            />
          </section>
        </div>
      )}
    </div>
  );
}
