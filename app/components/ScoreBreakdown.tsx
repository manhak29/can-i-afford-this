export default function ScoreBreakdown() {
  return (
    <div className="section">
      <h2>Score Breakdown</h2>
      <div className="timeline">
        <div className="month">
          <span>Budget Discipline</span>
          <span className="dot green">● Excellent</span>
        </div>
        <div className="month warning">
          <span>Savings Goal</span>
          <span className="dot yellow">● Near Limit</span>
        </div>
        <div className="month">
          <span>Fixed Expenses</span>
          <span className="dot green">● Stable</span>
        </div>
      </div>
    </div>
  );
}