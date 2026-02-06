type Props = {
  score: number;
  color: "green" | "yellow" | "red";
};

export default function StatusRing({ score, color }: Props) {
  return (
    <div className="ring-container">
      <div className={`ring ${color}`}>
        <span>{score}%</span>
      </div>
      <p>Financial Health</p>
    </div>
  );
}
