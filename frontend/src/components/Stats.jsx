import { useEffect, useState } from "react";
import { TrendingUp, LayoutGrid, Clock, Scale, Flame } from "lucide-react";
import { api } from "../api/client.js";
import { useCategories } from "../context/CategoriesContext.jsx";
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

export default function Stats() {
  const { getCategoryDisplay } = useCategories();
  const [window_, setWindow] = useState("4w");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const overview = await api.stats.overview(window_);
      setData(overview);
      setIsLoading(false);
    })();
  }, [window_]);

  return (
    <div className="stats">
      <div className="stats__header">
        <h2>Stats</h2>
        <div className="stats__window-toggle">
          <button type="button" className={window_ === "4w" ? "stats__window-btn--active" : ""} onClick={() => setWindow("4w")}>
            Last 4 Weeks
          </button>
          <button type="button" className={window_ === "all" ? "stats__window-btn--active" : ""} onClick={() => setWindow("all")}>
            All Time
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="stats__loading">
          <LoadingIndicator variant="panel" size="lg" label="Crunching the numbers..." />
        </div>
      ) : (
        <div className="stats__grid">
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
            <p className="stats__card-sub">Completion rate by category &mdash; where attention is (and isn't) going.</p>
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
              Time in Status (Procrastination Gaps)
            </h3>
            <p className="stats__card-sub">Average days tasks spend In Progress vs. Blocked, per category.</p>
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
              <Flame size={15} />
              Consistency
            </h3>
            <p className="stats__card-sub">Days with at least one completed quest.</p>
            <StreakHeatmap days={data.streakHeatmap} />
          </section>

          <section className="stats__card stats__card--wide">
            <h3>
              <LayoutGrid size={15} />
              Task Completion History
            </h3>
            <p className="stats__card-sub">Day-by-day record of completed quests &mdash; the shape of your follow-through over time.</p>
            <TaskHistoryPanel history={data.taskHistory} />
          </section>
        </div>
      )}
    </div>
  );
}
