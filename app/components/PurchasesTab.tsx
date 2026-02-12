"use client";

import { type ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import Calendar from "react-calendar";
import { evaluatePurchaseDecision } from "../utils/finance";
import TrendChart from "./TrendChart";
import {
  getStoredProfile,
  saveStoredProfile,
  type LoggedPurchase,
} from "../utils/profile";

type DateValue = Date | null;
type CalendarOnChange = NonNullable<ComponentProps<typeof Calendar>["onChange"]>;

function formatKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function PurchasesTab() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyBills, setMonthlyBills] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [paychecksPerMonth, setPaychecksPerMonth] = useState("2");
  const [plannedPurchase, setPlannedPurchase] = useState("");

  const [selectedDate, setSelectedDate] = useState<DateValue>(new Date());
  const [logAmount, setLogAmount] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logCategory, setLogCategory] = useState("shopping");
  const [logDate, setLogDate] = useState(() => formatKey(new Date()));
  const [purchaseLog, setPurchaseLog] = useState<LoggedPurchase[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [undoDelete, setUndoDelete] = useState<{ item: LoggedPurchase; index: number } | null>(
    null
  );
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = getStoredProfile();
    if (!stored) {
      setIsHydrated(true);
      return;
    }
    setMonthlyIncome(stored.monthlyIncome || "");
    setMonthlyBills(
      String(
        Object.values(stored.expenses || {}).reduce(
          (sum, value) => sum + (Number(value) || 0),
          0
        )
      )
    );
    setCurrentSavings(stored.currentSavings || "");
    setPaychecksPerMonth(stored.paychecksPerMonth || "2");
    setPurchaseLog(stored.purchaseLog || []);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStoredProfile({
      currentSavings,
      purchaseLog,
    });
  }, [currentSavings, purchaseLog, isHydrated]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const parsedIncome = Number(monthlyIncome) || 0;
  const parsedBills = Number(monthlyBills) || 0;
  const parsedSavings = Number(currentSavings) || 0;
  const parsedPaychecks = Math.max(Number(paychecksPerMonth) || 1, 1);
  const parsedPlannedPurchase = Number(plannedPurchase) || 0;

  const advice = evaluatePurchaseDecision({
    income: parsedIncome,
    monthlyBills: parsedBills,
    savings: parsedSavings,
    paychecksPerMonth: parsedPaychecks,
    purchaseAmount: parsedPlannedPurchase,
  });

  const purchaseMarkersByDate = useMemo(() => {
    return purchaseLog.reduce<Record<string, "standard" | "big">>((acc, entry) => {
      const current = acc[entry.date];
      if (!current) {
        acc[entry.date] = entry.isBig ? "big" : "standard";
        return acc;
      }
      if (entry.isBig) {
        acc[entry.date] = "big";
      }
      return acc;
    }, {});
  }, [purchaseLog]);

  const recentBigPurchases = useMemo(() => {
    return purchaseLog
      .filter((entry) => entry.isBig)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [purchaseLog]);

  const recentPurchases = useMemo(() => {
    return [...purchaseLog]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [purchaseLog]);

  const categoryTotals = useMemo(() => {
    const totals = purchaseLog.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || "other";
      acc[key] = (acc[key] || 0) + item.amount;
      return acc;
    }, {});
    const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [purchaseLog]);

  const handleDateChange: CalendarOnChange = (value) => {
    if (Array.isArray(value)) {
      const first = value[0];
      setSelectedDate(first instanceof Date ? first : null);
      return;
    }
    setSelectedDate(value instanceof Date ? value : null);
  };

  function handleAddPurchase() {
    const amount = Number(logAmount);
    if (!logDate || amount <= 0) return;

    setPurchaseLog((prev) => [
      ...prev,
      {
        id: `${logDate}-${Date.now()}`,
        date: logDate,
        amount,
        note: logNote.trim(),
        isBig: amount >= advice.bigThreshold,
        category: logCategory,
      },
    ]);
    setLogAmount("");
    setLogNote("");
    setLogCategory("shopping");
  }

  function handleDeletePurchase(id: string) {
    const confirmed = window.confirm("delete this purchase?");
    if (!confirmed) return;

    setPurchaseLog((prev) => {
      const index = prev.findIndex((entry) => entry.id === id);
      if (index < 0) return prev;
      const item = prev[index];

      setUndoDelete({ item, index });
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      undoTimerRef.current = setTimeout(() => {
        setUndoDelete(null);
      }, 5000);

      return prev.filter((entry) => entry.id !== id);
    });
  }

  function handleUndoDelete() {
    if (!undoDelete) return;
    const { item, index } = undoDelete;
    setPurchaseLog((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setUndoDelete(null);
  }

  const recoveryMonthly = advice.monthlyRecoveryTarget;
  const recoveryPerPaycheck = advice.perPaycheckRecoveryTarget;
  const emergencyGap = Math.max(advice.emergencyBufferTarget - advice.postPurchaseSavings, 0);
  const purchaseTrendPoints = (getStoredProfile()?.history || [])
    .slice(-14)
    .map((item) => ({
      label: item.date.slice(5),
      value: item.purchasesToday,
    }));

  return (
    <section className="goals-layout">
      <div className="dashboard-grid">
        <div className="section-card">
          <h2>purchase-advisor</h2>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="enter monthly income"
          />
          <input
            type="number"
            value={monthlyBills}
            onChange={(e) => setMonthlyBills(e.target.value)}
            placeholder="enter monthly bills"
          />
          <input
            type="number"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value)}
            placeholder="enter current savings"
          />
          <label className="field-label" htmlFor="purchase-paychecks">
            paychecks per month
          </label>
          <select
            id="purchase-paychecks"
            value={paychecksPerMonth}
            onChange={(e) => setPaychecksPerMonth(e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
          <input
            type="number"
            value={plannedPurchase}
            onChange={(e) => setPlannedPurchase(e.target.value)}
            placeholder="enter planned purchase cost"
          />

          {parsedPlannedPurchase > 0 ? (
            <div className="status-summary">
              <p className="status-line">
                advice:
                <span className={`dot ${advice.color}`} style={{ margin: "0 8px" }} />
                {advice.label}
              </p>
              <p className="status-line">{advice.reason}</p>
              <p className="status-line">
                big purchase threshold: ${advice.bigThreshold.toFixed(0)}
              </p>
              <p className="status-line">
                this purchase is {advice.isBigPurchase ? "big" : "standard"}.
              </p>
            </div>
          ) : (
            <p className="status-line">
              enter a planned purchase to get red/yellow/green advice.
            </p>
          )}
        </div>

        <div className="section-card">
          <h2>log-purchase</h2>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
          />
          <input
            type="number"
            value={logAmount}
            onChange={(e) => setLogAmount(e.target.value)}
            placeholder="purchase amount"
          />
          <input
            type="text"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            placeholder="what did you buy"
          />
          <select value={logCategory} onChange={(e) => setLogCategory(e.target.value)}>
            <option value="shopping">shopping</option>
            <option value="home">home</option>
            <option value="food">food</option>
            <option value="transport">transport</option>
            <option value="health">health</option>
            <option value="entertainment">entertainment</option>
            <option value="other">other</option>
          </select>
          <button className="primary" onClick={handleAddPurchase}>
            add purchase
          </button>
          <p className="status-line">
            purchases above ${advice.bigThreshold.toFixed(0)} are logged as big.
          </p>

          {recentPurchases.length > 0 ? (
            <div className="status-summary">
              <p className="status-line">recent purchases:</p>
              {recentPurchases.map((item) => (
                <div className="purchase-row" key={item.id}>
                  <p className="status-line purchase-row-text">
                    {item.date}: ${item.amount.toFixed(2)}
                    {item.category ? ` [${item.category}]` : ""}
                    {item.note ? ` (${item.note})` : ""}
                  </p>
                  <button
                    className="secondary purchase-delete-btn"
                    onClick={() => handleDeletePurchase(item.id)}
                  >
                    delete
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {undoDelete ? (
            <div className="undo-banner">
              <p className="status-line">purchase deleted.</p>
              <button className="secondary purchase-delete-btn" onClick={handleUndoDelete}>
                undo
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="section-card">
          <h2>big-purchase-calendar</h2>
          <Calendar
            value={selectedDate}
            onChange={handleDateChange}
            tileContent={({ date }) => {
              const markerType = purchaseMarkersByDate[formatKey(date)];
              if (!markerType) return null;
              return (
                <div
                  className={`calendar-purchase-dot ${markerType}`}
                  aria-hidden="true"
                />
              );
            }}
          />
          <p className="status-line">dots mark days with logged purchases.</p>
        </div>

        <div className="section-card">
          <h2>recovery-plan</h2>
          {parsedPlannedPurchase > 0 ? (
            <>
              <p className="status-line">
                monthly recovery save target: ${recoveryMonthly.toFixed(2)}
              </p>
              <p className="status-line">
                per paycheck save target: ${recoveryPerPaycheck.toFixed(2)}
              </p>
              <p className="status-line">
                months to recover purchase:
                {advice.monthsToRecover === null
                  ? " not possible with current cashflow"
                  : ` ${advice.monthsToRecover}`}
              </p>
              <p className="status-line">
                post purchase savings: ${advice.postPurchaseSavings.toFixed(2)}
              </p>
              <p className="status-line">
                emergency buffer target: ${advice.emergencyBufferTarget.toFixed(2)}
              </p>
              <p className="status-line">
                extra needed to refill buffer: ${emergencyGap.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="status-line">enter a planned purchase to generate recovery plan.</p>
          )}

          {recentBigPurchases.length > 0 ? (
            <div className="status-summary">
              <h3>recent-big-purchases</h3>
              {recentBigPurchases.map((item) => (
                <p className="status-line" key={item.id}>
                  {item.date}: ${item.amount.toFixed(2)}
                  {item.category ? ` [${item.category}]` : ""}
                  {item.note ? ` (${item.note})` : ""}
                </p>
              ))}
            </div>
          ) : (
            <p className="status-line">no big purchases logged yet.</p>
          )}
          {categoryTotals.length > 0 ? (
            <div className="status-summary spend-breakdown">
              <h3>spend-by-category</h3>
              {categoryTotals.map((item) => (
                <div className="category-bar-row" key={item.category}>
                  <p className="status-line purchase-row-text">
                    {item.category}: ${item.amount.toFixed(0)}
                  </p>
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${Math.max(item.percent, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <TrendChart title="14-day purchase trend" points={purchaseTrendPoints} color="#ef4444" />
        </div>
      </div>
    </section>
  );
}
