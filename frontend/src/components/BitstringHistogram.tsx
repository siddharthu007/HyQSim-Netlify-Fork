interface BitstringHistogramProps {
  counts: Record<string, number>;
  totalShots: number;
}

export default function BitstringHistogram({ counts, totalShots }: BitstringHistogramProps) {
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return null;

  // Y-axis scales to totalShots so bars show absolute proportion
  const yMax = totalShots;

  const barWidth = Math.max(24, Math.min(50, 400 / entries.length));
  const chartHeight = 200;
  const marginTop = 24;
  const marginBottom = 40;
  const marginLeft = 48;
  const svgWidth = marginLeft + entries.length * (barWidth + 6) + 10;
  const svgHeight = chartHeight + marginTop + marginBottom;

  // Y-axis tick values: 0, 25%, 50%, 75%, 100% of totalShots
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="overflow-x-auto">
      <div className="text-xs text-slate-400 mb-1">
        Total shots: {totalShots.toLocaleString()}
      </div>
      <svg width={svgWidth} height={svgHeight} className="block">
        {/* Y-axis */}
        <line
          x1={marginLeft} y1={marginTop}
          x2={marginLeft} y2={marginTop + chartHeight}
          stroke="#475569" strokeWidth={1}
        />
        {/* Y-axis ticks and gridlines */}
        {yTicks.map((frac) => {
          const y = marginTop + chartHeight * (1 - frac);
          const val = Math.round(yMax * frac);
          return (
            <g key={frac}>
              <line
                x1={marginLeft} y1={y}
                x2={svgWidth - 10} y2={y}
                stroke="#334155" strokeWidth={1}
                strokeDasharray={frac > 0 ? '3,3' : 'none'}
              />
              <text x={marginLeft - 6} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize={9}>
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {entries.map(([bitstring, count], i) => {
          const barHeight = yMax > 0 ? (count / yMax) * chartHeight : 0;
          const x = marginLeft + i * (barWidth + 6) + 6;
          const y = marginTop + chartHeight - barHeight;
          return (
            <g key={bitstring}>
              <rect
                x={x} y={y}
                width={barWidth} height={barHeight}
                fill="#3b82f6" rx={2}
              />
              {/* Count label above bar */}
              <text
                x={x + barWidth / 2} y={y - 4}
                textAnchor="middle" fill="#cbd5e1" fontSize={9} fontWeight="bold"
              >
                {count}
              </text>
              {/* Bitstring label below */}
              <text
                x={x + barWidth / 2}
                y={marginTop + chartHeight + 14}
                textAnchor="middle" fill="#cbd5e1" fontSize={10}
                fontFamily="monospace"
              >
                {bitstring}
              </text>
            </g>
          );
        })}

        {/* X-axis line */}
        <line
          x1={marginLeft} y1={marginTop + chartHeight}
          x2={svgWidth} y2={marginTop + chartHeight}
          stroke="#475569" strokeWidth={1}
        />
      </svg>
    </div>
  );
}
