import "../styles/BarChart.css";

const HEIGHT = 160;
const BAR_GAP = 10;

// Simple vertical bar chart. `bars` is [{ label, values: [n] | [n, n], key, color? }].
// `colors` has one hex per series (1 or 2); a bar's own `color` overrides it for
// single-series charts where each bar carries its own identity color (e.g. category).
// `seriesLabels` renders a legend when there are 2+ series - a single series is
// named by the chart title instead.
export default function BarChart({ bars, colors, seriesLabels, valueSuffix = "", emptyLabel = "No data yet", showValues = false }) {
  if (bars.length === 0) {
    return <p className="bar-chart__empty">{emptyLabel}</p>;
  }

  const seriesCount = bars[0].values.length;
  const maxValue = Math.max(1, ...bars.flatMap(b => b.values));
  const groupWidth = 100 / bars.length;
  const barWidth = (groupWidth - BAR_GAP) / seriesCount;

  return (
    <div className="bar-chart">
      {seriesLabels && (
        <div className="bar-chart__legend">
          {seriesLabels.map((label, i) => (
            <span key={label} className="bar-chart__legend-item">
              <span className="bar-chart__legend-swatch" style={{ background: colors[i] }} />
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="bar-chart__plot">
        <svg viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none" className="bar-chart__svg" role="img">
          <line x1="0" y1={HEIGHT - 24} x2="100" y2={HEIGHT - 24} className="bar-chart__baseline" />
          {bars.map((bar, groupIdx) => {
            const groupX = groupIdx * groupWidth;
            return (
              <g key={bar.key}>
                {bar.values.map((value, seriesIdx) => {
                  const barHeight = (value / maxValue) * (HEIGHT - 44);
                  const x = groupX + BAR_GAP / 2 + seriesIdx * barWidth;
                  const y = HEIGHT - 24 - barHeight;
                  return (
                    <rect
                      key={seriesIdx}
                      x={x}
                      y={y}
                      width={Math.max(barWidth - 2, 1)}
                      height={Math.max(barHeight, 0)}
                      rx="2"
                      fill={bar.color || colors[seriesIdx]}
                    >
                      <title>
                        {bar.label}: {value}
                        {valueSuffix}
                      </title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Rendered as plain HTML, not SVG <text>, so labels are never subject to
            the non-uniform stretch that `preserveAspectRatio="none"` applies to
            the chart's coordinate system (bars are fine as rects; glyphs are not). */}
        {showValues && (
          <div className="bar-chart__value-layer">
            {bars.map((bar, groupIdx) => {
              const groupX = groupIdx * groupWidth;
              return bar.values.map((value, seriesIdx) => {
                if (value <= 0) return null;
                const barHeight = (value / maxValue) * (HEIGHT - 44);
                const x = groupX + BAR_GAP / 2 + seriesIdx * barWidth;
                const y = HEIGHT - 24 - barHeight;
                return (
                  <span
                    key={`${bar.key}-${seriesIdx}`}
                    className="bar-chart__value"
                    style={{
                      left: `${x + (barWidth - 2) / 2}%`,
                      top: `${(y / HEIGHT) * 100}%`
                    }}
                  >
                    {value}
                    {valueSuffix}
                  </span>
                );
              });
            })}
          </div>
        )}
      </div>

      <div className="bar-chart__labels">
        {bars.map(bar => (
          <span key={bar.key} className="bar-chart__label" style={{ width: `${groupWidth}%` }}>
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
