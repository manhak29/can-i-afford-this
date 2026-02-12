type Props = {
  score: number;
  severity: "low" | "medium" | "high";
};

export default function StatusRing({ score, severity }: Props) {
  const percent = Math.min(Math.max(score, 0), 100);
  const degrees = percent * 3.6;
  const ringColor =
    severity === "low"
      ? "var(--green)"
      : severity === "medium"
        ? "var(--yellow)"
        : "var(--red)";

  return (
    <div
      className="status-ring"
      style={
        {
          "--percent": `${degrees}deg`,
          "--ring-color": ringColor,
        } as React.CSSProperties
      }
    >
      <span>{percent}%</span>
    </div>
  );
}
