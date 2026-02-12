export type Budget = {
  rent: number;
  food: number;
  utilities: number;
  insurance: number;
};

export type MonthlyHealth = {
  score: number;
  status: "On Track" | "Needs Attention" | "Off Track";
  goalProgress: number;
  goalStatus: string;
  decisionStatus: string;
  decisionSeverity: "low" | "medium" | "high";
  projectedSavings: number;
  remainingAfterEssentials: number;
};

export type PurchaseAdvice = {
  color: "green" | "yellow" | "red";
  label: string;
  reason: string;
  isBigPurchase: boolean;
  bigThreshold: number;
  monthlyDisposable: number;
  monthlyRecoveryTarget: number;
  perPaycheckRecoveryTarget: number;
  monthsToRecover: number | null;
  emergencyBufferTarget: number;
  postPurchaseSavings: number;
};

type PurchaseDecisionInput = {
  income: number;
  monthlyBills: number;
  savings: number;
  paychecksPerMonth: number;
  purchaseAmount: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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

export function evaluateMonthlyHealth(
  income: number,
  expenses: number,
  plannedPurchase: number,
  monthlySavingsGoal: number
): MonthlyHealth {
  // No user input yet: skip scoring and show an empty-state result.
  if (income <= 0 && plannedPurchase <= 0 && monthlySavingsGoal <= 0) {
    return {
      score: 0,
      status: "Off Track",
      goalProgress: 0,
      goalStatus: "Enter your monthly values to start tracking",
      decisionStatus: "Add inputs to evaluate decision quality",
      decisionSeverity: "high",
      projectedSavings: 0,
      remainingAfterEssentials: 0,
    };
  }

  const remainingAfterEssentials = income - expenses;
  const projectedSavings = remainingAfterEssentials - plannedPurchase;

  const goalProgress =
    monthlySavingsGoal > 0
      ? clamp((projectedSavings / monthlySavingsGoal) * 100, 0, 150)
      : 0;

  const goalScore =
    monthlySavingsGoal > 0 ? clamp(goalProgress, 0, 100) : 50;

  const decisionQuality =
    remainingAfterEssentials > 0
      ? clamp(
          (1 - plannedPurchase / remainingAfterEssentials) * 100,
          0,
          100
        )
      : 0;

  const expenseStability =
    income > 0 ? clamp((1 - expenses / income) * 100, 0, 100) : 0;

  const score = Math.round(
    goalScore * 0.5 + decisionQuality * 0.35 + expenseStability * 0.15
  );

  const status =
    score >= 80
      ? "On Track"
      : score >= 55
        ? "Needs Attention"
        : "Off Track";

  let goalStatus = "Set a monthly savings goal";
  if (monthlySavingsGoal > 0) {
    goalStatus =
      goalProgress >= 100
        ? "Goal pace is on track"
        : goalProgress >= 75
          ? "Goal pace is slightly behind"
          : "Goal pace is behind";
  }

  const decisionStatus =
    decisionQuality >= 70
      ? "Purchase decisions look healthy"
      : decisionQuality >= 40
        ? "Purchase decisions are manageable"
        : "Purchase decisions are risky";

  const decisionSeverity =
    decisionQuality >= 70
      ? "low"
      : decisionQuality >= 40
        ? "medium"
        : "high";

  return {
    score,
    status,
    goalProgress,
    goalStatus,
    decisionStatus,
    decisionSeverity,
    projectedSavings,
    remainingAfterEssentials,
  };
}

export function getRecommendation(score: number) {
  if (score >= 75) return { color: "green", text: "Safe decision" };
  if (score >= 40) return { color: "yellow", text: "Manageable but tight" };
  return { color: "red", text: "Financial risk" };
}

export function calculateBigPurchaseThreshold(
  income: number,
  monthlyBills: number,
  savings: number,
  paychecksPerMonth: number
): number {
  const safePaychecks = Math.max(paychecksPerMonth, 1);
  const monthlyDisposable = Math.max(income - monthlyBills, 0);
  const perPaycheckDisposable = monthlyDisposable / safePaychecks;
  const affordabilityPool =
    monthlyDisposable + perPaycheckDisposable + Math.max(savings, 0) * 0.2;

  // "Big" means the purchase consumes at least 35% of the user's current affordability pool.
  return affordabilityPool * 0.35;
}

export function evaluatePurchaseDecision({
  income,
  monthlyBills,
  savings,
  paychecksPerMonth,
  purchaseAmount,
}: PurchaseDecisionInput): PurchaseAdvice {
  const safePaychecks = Math.max(paychecksPerMonth, 1);
  const normalizedPurchase = Math.max(purchaseAmount, 0);
  const monthlyDisposable = Math.max(income - monthlyBills, 0);
  const emergencyBufferTarget = Math.max(monthlyBills, 0);
  const postPurchaseSavings = savings - normalizedPurchase;

  const bigThreshold = calculateBigPurchaseThreshold(
    income,
    monthlyBills,
    savings,
    safePaychecks
  );
  const isBigPurchase = normalizedPurchase >= bigThreshold && normalizedPurchase > 0;

  const monthlyRecoveryTarget = monthlyDisposable * 0.4;
  const perPaycheckRecoveryTarget = monthlyRecoveryTarget / safePaychecks;

  let monthsToRecover: number | null = 0;
  if (normalizedPurchase > 0) {
    monthsToRecover =
      monthlyRecoveryTarget > 0
        ? Math.ceil(normalizedPurchase / monthlyRecoveryTarget)
        : null;
  }

  let color: PurchaseAdvice["color"] = "yellow";
  let label = "doable with caution";
  let reason = "this purchase is manageable but will slow down your savings pace.";

  if (monthlyDisposable <= 0) {
    color = "red";
    label = "not a good purchase";
    reason = "your bills already use all monthly income, so this adds direct risk.";
  } else if (postPurchaseSavings < 0 || normalizedPurchase > monthlyDisposable * 1.5) {
    color = "red";
    label = "not a good purchase";
    reason =
      "this cost is too large for your current monthly cushion and may push you into debt.";
  } else if (
    normalizedPurchase <= monthlyDisposable * 0.6 &&
    postPurchaseSavings >= emergencyBufferTarget
  ) {
    color = "green";
    label = "good purchase window";
    reason = "you can cover this and still keep a healthy emergency buffer.";
  } else if (
    normalizedPurchase <= monthlyDisposable * 1.1 &&
    postPurchaseSavings >= emergencyBufferTarget * 0.5
  ) {
    color = "yellow";
    label = "doable with caution";
    reason = "you can recover, but your safety margin will be thinner for a while.";
  } else {
    color = "red";
    label = "not a good purchase";
    reason = "recovery is possible, but the near-term cash strain is high.";
  }

  return {
    color,
    label,
    reason,
    isBigPurchase,
    bigThreshold,
    monthlyDisposable,
    monthlyRecoveryTarget,
    perPaycheckRecoveryTarget,
    monthsToRecover,
    emergencyBufferTarget,
    postPurchaseSavings,
  };
}
