"use client";

type TrendPoint = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  points: TrendPoint[];
  color?: string;
};

export default function TrendChart({ title, points, color = "#3b82f6" }: Props) {
  if (points.length === 0) {
    return (
      <div className="trend-chart-card">
        <p className="status-line">{title}</p>
        <p className="status-line">not enough history yet.</p>
      </div>
    );
  }

  const width = 280;
  const height = 110;
  const padding = 14;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const range = Math.max(max - min, 1);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coordinates = points
    .map((point, index) => {
      const x = padding + index * stepX;
      const y =
        height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="trend-chart-card">
      <p className="status-line">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart-svg" role="img" aria-label={title}>
        <polyline
          points={coordinates}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="trend-chart-footer">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
