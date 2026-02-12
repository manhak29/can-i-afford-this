"use client";

import { useState } from "react";
import StatusRing from "./StatusRing";
import FinanceCalendar from "./FinanceCalendar";
import FinanceProjection from "./FinanceProjection";
import {
  calculateScore,
  getRecommendation,
  totalExpenses
} from "../utils/finance";

export default function HomeTab() {
  const [income, setIncome] = useState(2000);
  const [savings, setSavings] = useState(500);
  const [purchase, setPurchase] = useState(250);

  const budget = {
    rent: 800,
    food: 300,
    utilities: 200,
    insurance: 150
  };

  const expenses = totalExpenses(budget);
  const score = calculateScore(income, expenses, purchase);
  const recommendation = getRecommendation(score);

  return (
    <div className="dashboard-grid">
      <div className="section-card">
        <StatusRing score={score} />
        <p>
          Recommendation:
          <span className={`dot ${recommendation.color}`} />
        </p>
      </div>

      <div className="section-card">
        <h2>Inputs</h2>

        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          placeholder="Monthly Income"
        />

        <input
          type="number"
          value={savings}
          onChange={(e) => setSavings(Number(e.target.value))}
          placeholder="Savings"
        />

        <input
          type="number"
          value={purchase}
          onChange={(e) => setPurchase(Number(e.target.value))}
          placeholder="Purchase Cost"
        />

        <FinanceCalendar
          budget={budget}
          income={income}
          savings={savings}
          purchaseCost={purchase}
        />

        <FinanceProjection
          income={income}
          expenses={expenses}
          purchase={purchase}
          savings={savings}
        />
      </div>
    </div>
  );
}
