export type Budget = {
  rent: number;
  insurance: number;
  food: number;
  subscriptions: number;
  discretionary: number;
};

export type ScoreBreakdown = {
  cashFlow: number;
  savingsBuffer: number;
  purchaseImpact: number;
};

export function totalExpenses(budget: Budget) {
  return Object.values(budget).reduce((a, b) => a + b, 0);
}

export function calculateCashFlowScore(income: number, expenses: number) {
  const leftover = income - expenses;
  if (leftover <= 0) return 20;
  if (leftover < 100) return 40;
  if (leftover < 300) return 70;
  return 90;
}

export function calculateSavingsScore(savings: number, expenses: number) {
  const monthsCovered = savings / expenses;
  if (monthsCovered < 1) return 30;
  if (monthsCovered < 3) return 60;
  return 90;
}

export function calculatePurchaseImpact(
  discretionary: number,
  purchaseCost: number
) {
  if (purchaseCost > discretionary * 3) return 20;
  if (purchaseCost > discretionary * 1.5) return 50;
  return 80;
}

export function getScoreBreakdown(
  income: number,
  savings: number,
  budget: Budget,
  purchaseCost: number
): ScoreBreakdown {
  const expenses = totalExpenses(budget);

  return {
    cashFlow: calculateCashFlowScore(income, expenses),
    savingsBuffer: calculateSavingsScore(savings, expenses),
    purchaseImpact: calculatePurchaseImpact(
      budget.discretionary,
      purchaseCost
    )
  };
}

export function getFinalScore(breakdown: ScoreBreakdown) {
  return Math.round(
    (breakdown.cashFlow +
      breakdown.savingsBuffer +
      breakdown.purchaseImpact) / 3
  );
}

export function getStatusColor(score: number) {
  if (score < 40) return "red";
  if (score < 70) return "yellow";
  return "green";
}
