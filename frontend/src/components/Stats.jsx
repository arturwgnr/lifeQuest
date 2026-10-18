import { useEffect, useState } from "react";
import { TrendingUp, LayoutGrid, Clock, Scale, Flame, History, CheckCircle2, Target, Swords, Hourglass } from "lucide-react";
import { api } from "../api/client.js";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { TONE_HEX } from "../constants/tones.js";
import BarChart from "./BarChart.jsx";
import StackedBar from "./StackedBar.jsx";
import StreakHeatmap from "./StreakHeatmap.jsx";
import TaskHistoryPanel from "./TaskHistoryPanel.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/Stats.css";

function formatTrendLabel(periodLabel, window) {
  if (window === "4w") {
    return new Date(`${periodLabel}T00:00:00.000Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  }
  const [year, month] = periodLabel.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC"
  });
}

// Headline numbers derived from the same overview payload as the charts
function buildKpis(data) {
  const completed = data.completionTrend.reduce((sum, t) => sum + t.count, 0);
  const total = data.categoryBreakdown.reduce((sum, c) => sum + c.totalCount, 0);
  const done = data.categoryBreakdown.reduce((sum, c) => sum + c.completedCount, 0);
  const balanceTotal = data.mainSideBalance.MAIN + data.mainSideBalance.SIDE;
  const blocked = data.timeInStatus.map(t => t.avgDaysBlocked).filter(v => v > 0);
  return {
    completed,
    rate: total > 0 ? Math.round((done / total) * 100) : null,
    mainShare: balanceTotal > 0 ? Math.round((data.mainSideBalance.MAIN / balanceTotal) * 100) : null,
    avgBlocked: blocked.length ? Math.round((blocked.reduce((a, b) => a + b, 0) / blocked.length) * 10) / 10 : null
  };
}

export default function Stats() {
  const { getCategoryDisplay } = useCategories();
  const toast = useToast();
  const [window_, setWindow] = useState("4w");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Switching window keeps the previous numbers on screen under an overlay
  // instead of dropping back to an empty loading panel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const overview = await api.stats.overview(window_);
        if (!cancelled) setData(overview);
      } catch (err) {
        if (!cancelled) errorToastFor(toast, err, "Couldn't load your stats");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window_]);

  const kpis = data ? buildKpis(data) : null;

  return (
    <div className="stats">
      <header className="stats__header">
        <div className="stats__header-text">
          <span className="stats__eyebrow">
            <TrendingUp size={13} />
            Stats
          </span>
          <h2>How your follow-through actually looks</h2>
          <p>Completions, consistency and where quests get stuck, straight from your status history.</p>
        </div>
        <div className="stats__window-toggle" role="tablist" aria-label="Time window">
          <button
            type="button"
            role="tab"
            aria-selected={window_ === "4w"}
            className={window_ === "4w" ? "stats__window-btn--active" : ""}
            onClick={() => setWindow("4w")}
          >
            Last 4 Weeks
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={window_ === "all"}
            className={window_ === "all" ? "stats__window-btn--active" : ""}
            onClick={() => setWindow("all")}
          >
            All Time
          </button>
        </div>
      </header>

      {!data ? (
        <div className="stats__loading">
          {isLoading ? (
            <LoadingIndicator variant="panel" size="lg" label="Crunching the numbers..." />
          ) : (
            <p className="stats__error">Stats are unavailable right now.</p>
          )}
        </div>
      ) : (
        <div className={`stats__body${isLoading ? " stats__body--refreshing" : ""}`} aria-busy={isLoading}>
          {isLoading && <LoadingIndicator variant="overlay" size="sm" label="Updating..." />}

          <div className="stats__kpis">
            <div className="stats__kpi">
              <span className="stats__kpi-icon stats__kpi-icon--emerald">
                <CheckCircle2 size={16} />
              </span>
              <strong>{kpis.completed}</strong>
              <span>Quests completed</span>
            </div>
            <div className="stats__kpi">
              <span className="stats__kpi-icon stats__kpi-icon--indigo">
                <Target size={16} />
              </span>
              <strong>{kpis.rate === null ? "–" : `${kpis.rate}%`}</strong>
              <span>Completion rate</span>
            </div>
            <div className="stats__kpi">
              <span className="stats__kpi-icon stats__kpi-icon--amber">
                <Swords size={16} />
              </span>
              <strong>{kpis.mainShare === null ? "–" : `${kpis.mainShare}%`}</strong>
              <span>Main quest share</span>
            </div>
            <div className="stats__kpi">
              <span className="stats__kpi-icon stats__kpi-icon--rose">
                <Hourglass size={16} />
              </span>
              <strong>{kpis.avgBlocked === null ? "–" : `${kpis.avgBlocked}d`}</strong>
              <span>Avg time blocked</span>
            </div>
          </div>

          <div className="stats__grid">
            <section className="stats__card stats__card--wide">
              <div className="stats__card-head">
                <h3>
                  <Flame size={15} />
                  Consistency
                </h3>
                <span className="stats__card-tag">Last 26 weeks</span>
              </div>
              <p className="stats__card-sub">Days with at least one completed quest.</p>
              <StreakHeatmap days={data.streakHeatmap} />
            </section>

            <section className="stats__card">
              <h3>
                <TrendingUp size={15} />
                Completion Trend
              </h3>
              <p className="stats__card-sub">Tasks completed per {window_ === "4w" ? "week" : "month"}.</p>
              <BarChart
                bars={data.completionTrend.map(t => ({
                  key: t.periodLabel,
                  label: formatTrendLabel(t.periodLabel, window_),
                  values: [t.count],
                  color: TONE_HEX.indigo
                }))}
                colors={[TONE_HEX.indigo]}
                showValues
                emptyLabel="No completions recorded in this window."
              />
            </section>

            <section className="stats__card">
              <h3>
                <LayoutGrid size={15} />
                Category Breakdown
              </h3>
              <p className="stats__card-sub">Completion rate by category &mdash; where attention is (and isn&apos;t) going.</p>
              <BarChart
                bars={data.categoryBreakdown.map(c => {
                  const config = getCategoryDisplay(c.categoryId);
                  return {
                    key: c.categoryId,
                    label: config.name,
                    values: [c.completionRate],
                    color: TONE_HEX[config.tone] || TONE_HEX.slate
                  };
                })}
                colors={[TONE_HEX.indigo]}
                valueSuffix="%"
                showValues
                emptyLabel="No tasks in this window yet."
              />
            </section>

            <section className="stats__card">
              <h3>
                <Clock size={15} />
                Time in Status
              </h3>
              <p className="stats__card-sub">Average days tasks spend In Progress vs. Blocked, per category &mdash; your procrastination gaps.</p>
              <BarChart
                bars={data.timeInStatus.map(t => ({
                  key: t.categoryId,
                  label: getCategoryDisplay(t.categoryId).name,
                  values: [t.avgDaysInProgress, t.avgDaysBlocked]
                }))}
                colors={[TONE_HEX.indigo, TONE_HEX.rose]}
                seriesLabels={["In Progress (avg days)", "Blocked (avg days)"]}
                valueSuffix="d"
                showValues
                emptyLabel="No in-progress or blocked history in this window yet."
              />
            </section>

            <section className="stats__card">
              <h3>
                <Scale size={15} />
                Main vs Side Balance
              </h3>
              <p className="stats__card-sub">Share of completed quests going to Main vs Side priority.</p>
              <StackedBar
                segments={[
                  { label: "Main", value: data.mainSideBalance.MAIN, color: "#d97706" },
                  { label: "Side", value: data.mainSideBalance.SIDE, color: "#0284c7" }
                ]}
              />
            </section>

            <section className="stats__card stats__card--wide">
              <h3>
                <History size={15} />
                Task Completion History
              </h3>
              <p className="stats__card-sub">Day-by-day record of completed quests &mdash; the shape of your follow-through over time.</p>
              <TaskHistoryPanel history={data.taskHistory} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
