import { useMemo, useState, useRef } from 'react';
import './Charts.css';

/* ============================================================
   Shared chart primitives (no external chart library — the
   project has none, so these are lightweight SVG/CSS charts
   styled with the admin design tokens).
   ============================================================ */

/**
 * Line / area chart.
 * data: [{ label, value }]
 */
export function LineChart({ data, formatValue = (v) => v, height = 240 }) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  const W = 720;
  const H = height;
  const P = { top: 16, right: 12, bottom: 28, left: 40 };

  const max = Math.max(...data.map((d) => d.value), 1);
  const yMax = Math.ceil(max / 10) * 10;
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;

  const xFor = (i) => P.left + (innerW * i) / Math.max(data.length - 1, 1);
  const yFor = (v) => P.top + innerH - (innerH * v) / yMax;

  const points = data.map((d, i) => [xFor(i), yFor(d.value)]);
  const path = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ');
  const area = `${path} L ${xFor(data.length - 1)} ${P.top + innerH} L ${xFor(0)} ${P.top + innerH} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);

  const handleMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    points.forEach(([x], i) => {
      const d = Math.abs(x - relX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  };

  return (
    <div
      className="chart-wrap"
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Line chart">
        <defs>
          <linearGradient id="lineAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5a2b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#8a5a2b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t}>
            <line x1={P.left} x2={W - P.right} y1={yFor(t)} y2={yFor(t)} className="chart-grid" />
            <text x={P.left - 8} y={yFor(t) + 4} className="chart-tick" textAnchor="end">
              {formatValue(t)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#lineAreaFill)" />
        <path d={path} fill="none" className="chart-line" />

        {points.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={hover === i ? 5 : 3.5} className={`chart-dot ${hover === i ? 'active' : ''}`} />
            {i % Math.ceil(data.length / 8) === 0 && (
              <text x={x} y={H - 8} className="chart-tick" textAnchor="middle">
                {data[i].label}
              </text>
            )}
          </g>
        ))}

        {hover !== null && (
          <g>
            <line
              x1={points[hover][0]}
              x2={points[hover][0]}
              y1={P.top}
              y2={P.top + innerH}
              className="chart-cursor"
            />
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(points[hover][0] / W) * 100}%`,
            top: `${(points[hover][1] / H) * 100}%`,
          }}
        >
          <strong>{data[hover].label}</strong>
          <span>{formatValue(data[hover].value)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Vertical bar chart.
 * data: [{ label, value }]
 */
export function BarChart({ data, color = 'accent', formatValue = (v) => v, height = 220 }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const P = { top: 20, right: 12, bottom: 28, left: 40 };

  const max = Math.max(...data.map((d) => d.value), 1);
  const yMax = Math.ceil(max / 10) * 10;
  const innerW = W - P.left - P.right;
  const innerH = H - P.top - P.bottom;
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.55, 46);

  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Bar chart">
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={P.left}
              x2={W - P.right}
              y1={P.top + innerH - (innerH * t) / yMax}
              y2={P.top + innerH - (innerH * t) / yMax}
              className="chart-grid"
            />
            <text
              x={P.left - 8}
              y={P.top + innerH - (innerH * t) / yMax + 4}
              className="chart-tick"
              textAnchor="end"
            >
              {formatValue(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = P.left + slot * i + (slot - barW) / 2;
          const barH = (innerH * d.value) / yMax;
          const y = P.top + innerH - barH;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={P.left + slot * i}
                y={P.top}
                width={slot}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 2)}
                rx={6}
                className={`chart-bar chart-bar-${color} ${hover === i ? 'active' : ''}`}
              />
              {hover === i && (
                <text x={x + barW / 2} y={y - 7} className="chart-value" textAnchor="middle">
                  {formatValue(d.value)}
                </text>
              )}
              <text x={x + barW / 2} y={H - 8} className="chart-tick" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Horizontal utilization bars (CSS-based).
 * data: [{ label, value (0-100), meta }]
 */
export function UtilizationBars({ data, unit = '%' }) {
  return (
    <div className="utilbars">
      {data.map((d) => (
        <div key={d.label} className="utilbar-row" title={`${d.label}: ${d.value}${unit}`}>
          <span className="utilbar-label">{d.label}</span>
          <span className="utilbar-track">
            <span
              className={`utilbar-fill ${d.tone || ''}`}
              style={{ width: `${Math.min(d.value, 100)}%` }}
            />
          </span>
          <span className="utilbar-value">{d.value}{unit}</span>
          {d.meta && <span className="utilbar-meta">{d.meta}</span>}
        </div>
      ))}
    </div>
  );
}

/**
 * Donut chart (SVG stroke-based).
 * data: [{ label, value, className }]
 * Renders segments proportional to value; sum should equal 100 for %s.
 */
export function DonutChart({ data, centerLabel, centerValue }) {
  const [hover, setHover] = useState(null);

  const R = 15.9155; // circumference = 100
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  let offset = 25; // start at top

  const segments = data.map((d) => {
    const len = (d.value / total) * 100;
    const seg = { ...d, len, offset };
    offset -= len;
    return seg;
  });

  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <svg viewBox="0 0 42 42" role="img" aria-label="Donut chart">
          <circle cx="21" cy="21" r={R} className="donut-track" />
          {segments.map((s) => (
            <circle
              key={s.label}
              cx="21"
              cy="21"
              r={R}
              className={`donut-seg ${s.className}`}
              strokeDasharray={`${Math.max(s.len - 0.6, 0)} ${100 - Math.max(s.len - 0.6, 0)}`}
              strokeDashoffset={s.offset}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="donut-center">
          <strong>{hover ? `${hover.value}%` : centerValue}</strong>
          <span>{hover ? hover.label : centerLabel}</span>
        </div>
      </div>
      <div className="donut-legend">
        {data.map((d) => (
          <div
            key={d.label}
            className={`donut-legend-item ${hover?.label === d.label ? 'active' : ''}`}
            onMouseEnter={() => setHover(d)}
            onMouseLeave={() => setHover(null)}
          >
            <i className={d.className} />
            <span className="donut-legend-label">{d.label}</span>
            <span className="donut-legend-value">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
