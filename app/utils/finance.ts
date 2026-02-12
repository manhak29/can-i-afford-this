export type Budget = {
  rent: number;
  food: number;
  utilities: number;
  insurance: number;
};

export function totalExpenses(budget: Budget): number {
  return (
    budget.rent +
    budget.food +
    budget.utilities +
    budget.insurance
  );
}

export function calculateScore(
  income: number,
  expenses: number,
  purchase: number
): number {
  const leftover = income - expenses - purchase;

  if (leftover < 0) return 20;
  if (leftover < 200) return 50;
  return 85;
}

export function getRecommendation(score: number) {
  if (score >= 75) return { color: "green", text: "Safe decision" };
  if (score >= 40) return { color: "yellow", text: "Manageable but tight" };
  return { color: "red", text: "Financial risk" };
}
