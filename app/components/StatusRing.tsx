type Props = {
  score: number;
};

export default function StatusRing({ score }: Props) {
  const percent = Math.min(Math.max(score, 0), 100);
  const degrees = percent * 3.6;

  return (
    <div
      className="status-ring"
      style={
        {
          "--percent": `${degrees}deg`
        } as React.CSSProperties
      }
    >
      <span>{percent}%</span>
    </div>
  );
}
