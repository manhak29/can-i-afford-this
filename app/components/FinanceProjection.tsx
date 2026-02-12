type Props = {
  income: number;
  expenses: number;
  purchase: number;
  savings: number;
};

export default function FinanceProjection({
  income,
  expenses,
  purchase,
  savings,
}: Props) {
  let currentSavings = savings;
  const months: number[] = [];

  for (let i = 1; i <= 6; i++) {
    currentSavings += income - expenses;
    if (i === 1) currentSavings -= purchase;
    months.push(currentSavings);
  }

  return (
    <div>
      <h2>6 Month Projection</h2>
      {months.map((amount, i) => (
        <p key={i}>
          Month {i + 1}: ${amount.toFixed(2)}
        </p>
      ))}
    </div>
  );
}
