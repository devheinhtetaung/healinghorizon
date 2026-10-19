import './PieChart.css';
import { CHART_PALETTE } from './chartPalette';

/**
 * Lightweight SVG donut chart. Pass `data` as `[{ label, value, color? }]`;
 * colors default to CHART_PALETTE. Zero-value segments render as an empty
 * track (no divide-by-zero).
 */
export default function PieChart({
  data = [],
  size = 168,
  thickness = 22,
  ariaLabel = 'Pie chart',
}) {
  const cx = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const values = data.map((d) => Math.max(0, Number(d.value) || 0));
  const total = values.reduce((sum, v) => sum + v, 0);

  let acc = 0;

  return (
    <svg
      className="pie"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel}
    >
      <circle
        className="pie__track"
        cx={cx}
        cy={cx}
        r={radius}
        fill="none"
        strokeWidth={thickness}
      />
      {data.map((d, i) => {
        const value = values[i];
        const frac = total > 0 ? value / total : 0;
        const dash = frac * circumference;
        const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length];
        const segment = (
          <circle
            key={`${d.label}-${i}`}
            className="pie__segment"
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-acc}
            transform={`rotate(-90 ${cx} ${cx})`}
          >
            <title>{`${d.label}: ${value} (${Math.round(frac * 100)}%)`}</title>
          </circle>
        );
        acc += dash;
        return segment;
      })}
    </svg>
  );
}
