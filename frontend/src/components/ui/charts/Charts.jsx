import './Charts.css';

/*
 * Lightweight SVG chart primitives styled with design tokens.
 * No chart library dependency — data arrays in, accessible SVG out.
 * Consuming cards are responsible for labeling sample vs. real data.
 */

const PAD = { top: 12, right: 8, bottom: 24, left: 34 };

function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function LineChart({ data = [], color = 'var(--color-primary)', formatValue = (v) => v, ariaLabel = 'Line chart' }) {
  const W = 560;
  const H = 220;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const rawMax = Math.max(...values);
  const max = niceMax(rawMax);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${lineD} L${(PAD.left + innerW).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      {gridLines.map((g) => {
        const y = PAD.top + innerH - g * innerH;
        const val = max * g;
        return (
          <g key={g}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="chart__grid" />
            <text x={PAD.left - 6} y={y + 3} className="chart__axis-label" textAnchor="end">
              {formatValue(val)}
            </text>
          </g>
        );
      })}

      <path d={areaD} className="chart__area" style={{ fill: color }} opacity="0.12" />
      <path d={lineD} className="chart__line" style={{ stroke: color }} fill="none" />

      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" className="chart__dot" style={{ fill: color }}>
            <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          </circle>
          {i % labelEvery === 0 && (
            <text
              x={p.x}
              y={H - 6}
              className="chart__axis-label"
              textAnchor="middle"
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data = [], color = 'var(--color-primary)', formatValue = (v) => v, ariaLabel = 'Bar chart' }) {
  const W = 560;
  const H = 220;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (data.length === 0) return null;

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.55, 28);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      {gridLines.map((g) => {
        const y = PAD.top + innerH - g * innerH;
        return (
          <g key={g}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="chart__grid" />
            <text x={PAD.left - 6} y={y + 3} className="chart__axis-label" textAnchor="end">
              {formatValue(max * g)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = PAD.left + i * slot + (slot - barW) / 2;
        const y = PAD.top + innerH - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx="3" className="chart__bar" style={{ fill: color }}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text
                x={PAD.left + i * slot + slot / 2}
                y={H - 6}
                className="chart__axis-label"
                textAnchor="middle"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* Horizontal distribution rows (e.g., ratings 1–5). CSS-based, responsive. */
function HBarChart({ data = [], formatValue = (v) => v, ariaLabel = 'Distribution chart' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="hbar" role="img" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.label} className="hbar__row">
          <span className="hbar__label">{d.label}</span>
          <span className="hbar__track">
            <span
              className="hbar__fill"
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%` }}
            />
          </span>
          <span className="hbar__value">{formatValue(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export { LineChart, BarChart, HBarChart };
