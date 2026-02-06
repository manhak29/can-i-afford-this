"use client";

import { useState } from "react";
import {
  Budget,
  getScoreBreakdown,
  getFinalScore,
  getStatusColor
} from "../utils/finance";
import StatusRing from "./StatusRing";
import ScoreBreakdown from "./ScoreBreakdown";

export default function HomeTab() {
  const [income, setIncome] = useState(0);
  const [savings, setSavings] = useState(0);
  const [purchaseCost, setPurchaseCost] = useState(0);

  const [budget, setBudget] = useState<Budget>({
    rent: 0,
    insurance: 0,
    food: 0,
    subscriptions: 0,
    discretionary: 0
  });

  const breakdown = getScoreBreakdown(
    income,
    savings,
    budget,
    purchaseCost
  );

  const score = getFinalScore(breakdown);
  const color = getStatusColor(score);

  function updateBudget(key: keyof Budget, value: number) {
    setBudget({ ...budget, [key]: value });
  }

  return (
    <div className="home-layout">
      <StatusRing score={score} color={color} />

      <div className="panel">
        <h2>Income & Savings</h2>
        <input placeholder="Monthly Income" type="number" onChange={e => setIncome(+e.target.value)} />
        <input placeholder="Current Savings" type="number" onChange={e => setSavings(+e.target.value)} />
        <input placeholder="Purchase Cost" type="number" onChange={e => setPurchaseCost(+e.target.value)} />

        <h2>Budget</h2>
        {Object.keys(budget).map(key => (
          <input
            key={key}
            placeholder={key}
            type="number"
            onChange={e => updateBudget(key as keyof Budget, +e.target.value)}
          />
        ))}

        <ScoreBreakdown breakdown={breakdown} />
      </div>
    </div>
  );
}
