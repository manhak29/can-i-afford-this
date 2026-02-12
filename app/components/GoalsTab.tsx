"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_EXPENSES,
  getStoredProfile,
  saveStoredProfile,
  type ExpenseFields,
} from "../utils/profile";

type ExpenseKey = keyof ExpenseFields;
type ExpensesState = ExpenseFields;

const EXPENSE_LABELS: Record<ExpenseKey, string> = {
  rent: "Rent",
  utilities: "Utilities",
  food: "Food",
  transport: "Transport",
  insurance: "Insurance",
  other: "Other",
};

export default function GoalsTab() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [paychecksPerMonth, setPaychecksPerMonth] = useState("2");
  const [expenses, setExpenses] = useState<ExpensesState>(DEFAULT_EXPENSES);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredProfile();
    if (!stored) {
      setIsHydrated(true);
      return;
    }

    setMonthlyIncome(stored.monthlyIncome || "");
    setMonthlyGoal(stored.monthlyGoal || "");
    setPaychecksPerMonth(stored.paychecksPerMonth || "2");
    setExpenses(stored.expenses || DEFAULT_EXPENSES);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStoredProfile({
      monthlyIncome,
      monthlyGoal,
      paychecksPerMonth,
      expenses,
    });
  }, [monthlyIncome, monthlyGoal, paychecksPerMonth, expenses, isHydrated]);

  const parsedIncome = Number(monthlyIncome) || 0;
  const parsedGoal = Number(monthlyGoal) || 0;
  const parsedPaychecks = Math.max(Number(paychecksPerMonth) || 1, 1);

  const totalMonthlyExpenses = useMemo(
    () => Object.values(expenses).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [expenses]
  );

  const remainingAfterBills = parsedIncome - totalMonthlyExpenses;
  const recommendedMonthlySave = Math.max(
    Math.min(parsedGoal > 0 ? parsedGoal : remainingAfterBills, remainingAfterBills),
    0
  );
  const recommendedPerPaycheck = recommendedMonthlySave / parsedPaychecks;
  const goalGap = Math.max(parsedGoal - remainingAfterBills, 0);
  const goalPerPaycheck = parsedGoal / parsedPaychecks;

  function updateExpense(key: ExpenseKey, value: string) {
    setExpenses((prev) => ({ ...prev, [key]: value }));
  }

  const hasInputs = parsedIncome > 0 || parsedGoal > 0;

  return (
    <section className="goals-layout">
      <div className="dashboard-grid">
        <div className="section-card">
          <h2>savings-goal</h2>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="Enter monthly take-home pay"
          />
          <input
            type="number"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            placeholder="Enter monthly savings target"
          />
          <label className="field-label" htmlFor="paychecks">
            Paychecks per month
          </label>
          <select
            id="paychecks"
            className="field-select"
            value={paychecksPerMonth}
            onChange={(e) => setPaychecksPerMonth(e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
        </div>

        <div className="section-card">
          <h2>monthly-expenses</h2>
          {Object.entries(EXPENSE_LABELS).map(([key, label]) => (
            <input
              key={key}
              type="number"
              value={expenses[key as ExpenseKey]}
              onChange={(e) => updateExpense(key as ExpenseKey, e.target.value)}
              placeholder={`${label} amount`}
            />
          ))}
        </div>
      </div>

      <div className="section-card goals-results">
        <h2>plan-summary</h2>
        <p className="status-line">Total monthly expenses: ${totalMonthlyExpenses.toFixed(2)}</p>
        <p className="status-line">
          Remaining after bills: ${remainingAfterBills.toFixed(2)}
        </p>

        {hasInputs ? (
          <>
            <p className="status-line">
              Set aside <strong>${recommendedPerPaycheck.toFixed(2)}</strong> per paycheck
              after bills.
            </p>
            <p className="status-line">
              Monthly savings recommendation: ${recommendedMonthlySave.toFixed(2)}
            </p>
            {goalGap > 0 ? (
              <p className="status-line">
                You are short by ${goalGap.toFixed(2)} this month. To hit your goal, you need
                either lower expenses or higher income by ${goalGap.toFixed(2)} (
                ${Math.max(goalPerPaycheck - recommendedPerPaycheck, 0).toFixed(2)} per paycheck).
              </p>
            ) : (
              <p className="status-line">Your current budget can support this savings goal.</p>
            )}
          </>
        ) : (
          <p className="status-line">Add monthly income and goal to generate your plan.</p>
        )}
      </div>
    </section>
  );
}
