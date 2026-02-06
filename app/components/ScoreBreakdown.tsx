import { ScoreBreakdown as Breakdown } from "../utils/finance";

type Props = {
  breakdown: Breakdown;
};

export default function ScoreBreakdown({ breakdown }: Props) {
  return (
    <div className="breakdown">
      <div>Cash Flow: {breakdown.cashFlow}%</div>
      <div>Savings Buffer: {breakdown.savingsBuffer}%</div>
      <div>Purchase Impact: {breakdown.purchaseImpact}%</div>
    </div>
  );
}
