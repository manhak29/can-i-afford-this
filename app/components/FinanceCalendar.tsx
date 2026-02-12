"use client";

import { type ComponentProps, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import { type Budget, totalExpenses } from "../utils/finance";

type DateValue = Date | null;

type FinanceCalendarProps = {
  budget: Budget;
  income: number;
  savings: number;
  purchaseCost: number;
};

type CalendarOnChange = NonNullable<ComponentProps<typeof Calendar>["onChange"]>;

export default function FinanceCalendar({
  budget,
  income,
  savings,
  purchaseCost,
}: FinanceCalendarProps) {
  const estimatedMonthlyBudget = Math.max(income - totalExpenses(budget), 0);

  const [selectedDate, setSelectedDate] = useState<DateValue>(new Date());
  const [monthlyBudget, setMonthlyBudget] = useState<number>(estimatedMonthlyBudget);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [inputAmount, setInputAmount] = useState<number>(0);

  useEffect(() => {
    setMonthlyBudget(estimatedMonthlyBudget);
  }, [estimatedMonthlyBudget]);

  const formatKey = (date: Date) => date.toISOString().split("T")[0];

  const handleDateChange: CalendarOnChange = (value) => {
    if (Array.isArray(value)) {
      const first = value[0];
      setSelectedDate(first instanceof Date ? first : null);
      return;
    }

    setSelectedDate(value instanceof Date ? value : null);
  };

  const handleAddSpending = () => {
    if (!selectedDate || inputAmount <= 0) return;
    const key = formatKey(selectedDate);
    setSpending((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + inputAmount,
    }));
    setInputAmount(0);
  };

  const totalSpent = useMemo(() => {
    return Object.values(spending).reduce((a, b) => a + b, 0);
  }, [spending]);

  const remaining = monthlyBudget - totalSpent;
  const percentUsed =
    monthlyBudget > 0
      ? Math.min((totalSpent / monthlyBudget) * 100, 100)
      : 0;

  const getDailyLimit = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return monthlyBudget / daysInMonth;
  };

  const dailyLimit = getDailyLimit();
  const projectedCashAfterPurchase = savings + remaining - purchaseCost;

  return (
    <div style={{ display: "flex", gap: "40px" }}>
      <div>
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          tileContent={({ date }) => {
            const key = formatKey(date);
            const amount = spending[key] || 0;
            if (!amount) return null;

            const color = amount > dailyLimit ? "red" : "green";

            return <div style={{ fontSize: 10, color }}>${amount}</div>;
          }}
        />
      </div>

      <div style={{ minWidth: "300px" }}>
        <h2>Monthly Budget</h2>

        <input
          type="number"
          value={monthlyBudget}
          onChange={(e) => setMonthlyBudget(Number(e.target.value))}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <h3>Add Spending</h3>

        <input
          type="number"
          value={inputAmount}
          onChange={(e) => setInputAmount(Number(e.target.value))}
          placeholder="Amount"
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button
          onClick={handleAddSpending}
          style={{
            width: "100%",
            padding: "8px",
            background: "#111",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add
        </button>

        <hr style={{ margin: "20px 0" }} />

        <h3>Summary</h3>
        <p>Total Spent: ${totalSpent.toFixed(2)}</p>
        <p>
          Remaining:{" "}
          <span style={{ color: remaining < 0 ? "red" : "green" }}>
            ${remaining.toFixed(2)}
          </span>
        </p>
        <p>
          Cash After Purchase:{" "}
          <span style={{ color: projectedCashAfterPurchase < 0 ? "red" : "green" }}>
            ${projectedCashAfterPurchase.toFixed(2)}
          </span>
        </p>

        <div
          style={{
            height: "20px",
            width: "100%",
            background: "#eee",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              width: `${percentUsed}%`,
              height: "100%",
              background: totalSpent > monthlyBudget ? "red" : "#4caf50",
            }}
          />
        </div>

        <p style={{ marginTop: "8px" }}>{percentUsed.toFixed(0)}% of budget used</p>
      </div>
    </div>
  );
}
