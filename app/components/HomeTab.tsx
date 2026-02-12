"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusRing from "./StatusRing";
import TrendChart from "./TrendChart";
import { evaluateMonthlyHealth } from "../utils/finance";
import {
  getStoredProfile,
  getStoredProfileByEmail,
  saveStoredProfile,
  type DailySnapshot,
  type LoggedPurchase,
  type StoredProfile,
} from "../utils/profile";

type ActivePanel = "pace" | "bills" | "purchases";

type ActionItem = {
  id: string;
  label: string;
  detail: string;
  severity: "green" | "yellow" | "red";
};

function mergeHistory(primary: DailySnapshot[], partner: DailySnapshot[]) {
  const map = new Map<string, DailySnapshot>();

  const upsert = (snapshot: DailySnapshot) => {
    const existing = map.get(snapshot.date);
    if (!existing) {
      map.set(snapshot.date, { ...snapshot });
      return;
    }
    map.set(snapshot.date, {
      date: snapshot.date,
      monthlyIncome: existing.monthlyIncome + snapshot.monthlyIncome,
      monthlyBills: existing.monthlyBills + snapshot.monthlyBills,
      monthlyGoal: existing.monthlyGoal + snapshot.monthlyGoal,
      currentSavings: existing.currentSavings + snapshot.currentSavings,
      purchasesToday: existing.purchasesToday + snapshot.purchasesToday,
    });
  };

  primary.forEach(upsert);
  partner.forEach(upsert);

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
}

function getMonthlyPurchaseTotal(purchases: LoggedPurchase[]) {
  const now = new Date();
  return purchases.reduce((sum, purchase) => {
    const purchaseDate = new Date(purchase.date);
    if (
      purchaseDate.getMonth() === now.getMonth() &&
      purchaseDate.getFullYear() === now.getFullYear()
    ) {
      return sum + purchase.amount;
    }
    return sum;
  }, 0);
}

function getPurchaseCategoryLeader(purchases: LoggedPurchase[]) {
  const now = new Date();
  const totals = purchases.reduce<Record<string, number>>((acc, purchase) => {
    const purchaseDate = new Date(purchase.date);
    if (
      purchaseDate.getMonth() !== now.getMonth() ||
      purchaseDate.getFullYear() !== now.getFullYear()
    ) {
      return acc;
    }
    const key = purchase.category || "other";
    acc[key] = (acc[key] || 0) + purchase.amount;
    return acc;
  }, {});
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return entries.length > 0 ? entries[0] : null;
}

function getConsistencyStreak(history: DailySnapshot[], threshold: number) {
  if (history.length === 0) return 0;
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].purchasesToday <= threshold) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

export default function HomeTab() {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("pace");

  const refreshProfile = useCallback(() => {
    setProfile(getStoredProfile());
  }, []);

  useEffect(() => {
    refreshProfile();
    window.addEventListener("profile-updated", refreshProfile);
    window.addEventListener("focus", refreshProfile);
    return () => {
      window.removeEventListener("profile-updated", refreshProfile);
      window.removeEventListener("focus", refreshProfile);
    };
  }, [refreshProfile]);

  const insights = useMemo(() => {
    if (!profile) return null;

    const partnerProfile =
      profile.coupleModeEnabled && profile.partnerEmail
        ? getStoredProfileByEmail(profile.partnerEmail)
        : null;

    const monthlyIncomePrimary = Number(profile.monthlyIncome) || 0;
    const monthlyGoalPrimary = Number(profile.monthlyGoal) || 0;
    const currentSavingsPrimary = Number(profile.currentSavings) || 0;
    const monthlyBillsPrimary = Object.values(profile.expenses || {}).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );

    const monthlyIncomePartner = Number(partnerProfile?.monthlyIncome || 0);
    const monthlyGoalPartner = Number(partnerProfile?.monthlyGoal || 0);
    const currentSavingsPartner = Number(partnerProfile?.currentSavings || 0);
    const monthlyBillsPartner = Object.values(partnerProfile?.expenses || {}).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );

    const monthlyIncome = monthlyIncomePrimary + monthlyIncomePartner;
    const monthlyGoal = monthlyGoalPrimary + monthlyGoalPartner;
    const currentSavings = currentSavingsPrimary + currentSavingsPartner;
    const monthlyBills = monthlyBillsPrimary + monthlyBillsPartner;
    const purchasesMerged = [
      ...(profile.purchaseLog || []),
      ...(partnerProfile?.purchaseLog || []),
    ];

    const joinedAt = new Date(profile.createdAt);
    const msInDay = 24 * 60 * 60 * 1000;
    const daysSinceJoined = Math.max(
      1,
      Math.floor((Date.now() - joinedAt.getTime()) / msInDay) + 1
    );

    const purchasesThisMonth = getMonthlyPurchaseTotal(purchasesMerged);

    const monthlyDisposable = Math.max(monthlyIncome - monthlyBills, 0);
    const expectedSavingsByNow =
      monthlyGoal > 0 ? Math.min(monthlyGoal, (monthlyGoal / 30) * daysSinceJoined) : 0;
    const projectedSavingsFromCashflow = Math.max(
      (monthlyDisposable / 30) * daysSinceJoined - purchasesThisMonth,
      0
    );
    const actualSavingsNow = currentSavings > 0 ? currentSavings : projectedSavingsFromCashflow;

    const goalPacePercent =
      expectedSavingsByNow > 0 ? (actualSavingsNow / expectedSavingsByNow) * 100 : 0;
    const goalCompletionPercent = monthlyGoal > 0 ? (actualSavingsNow / monthlyGoal) * 100 : 0;
    const billLoadPercent = monthlyIncome > 0 ? (monthlyBills / monthlyIncome) * 100 : 100;

    const health = evaluateMonthlyHealth(
      monthlyIncome,
      monthlyBills,
      purchasesThisMonth,
      monthlyGoal
    );

    const mergedHistory = mergeHistory(profile.history || [], partnerProfile?.history || []);
    const dailySpendCap = Math.max(monthlyDisposable / 30, 0) * 0.55;
    const consistencyStreak = getConsistencyStreak(mergedHistory, dailySpendCap);
    const categoryLeader = getPurchaseCategoryLeader(purchasesMerged);

    const scorePoints = Math.round(
      Math.max(0, Math.min(100, goalCompletionPercent)) * 0.45 +
        Math.max(0, 100 - billLoadPercent) * 0.35 +
        Math.max(0, Math.min(100, health.score)) * 0.2
    );
    const level = Math.max(1, Math.floor(scorePoints / 20) + 1);

    const actions: ActionItem[] = [];
    if (goalPacePercent < 100) {
      actions.push({
        id: "raise-savings",
        label: "boost monthly savings pace",
        detail: `you are at ${goalPacePercent.toFixed(0)}% of target pace.`,
        severity: goalPacePercent < 75 ? "red" : "yellow",
      });
    } else {
      actions.push({
        id: "protect-progress",
        label: "protect current savings momentum",
        detail: "you are on pace, keep spending disciplined this week.",
        severity: "green",
      });
    }

    if (billLoadPercent > 80) {
      actions.push({
        id: "trim-bills",
        label: "reduce fixed monthly bills",
        detail: "bill load is high. cut at least one recurring cost.",
        severity: "red",
      });
    } else if (billLoadPercent > 60) {
      actions.push({
        id: "watch-bills",
        label: "watch recurring expenses",
        detail: "bills are manageable but close to stress range.",
        severity: "yellow",
      });
    } else {
      actions.push({
        id: "steady-bills",
        label: "keep bill health steady",
        detail: "your fixed-expense ratio is currently healthy.",
        severity: "green",
      });
    }

    if (purchasesThisMonth > monthlyDisposable * 0.7) {
      actions.push({
        id: "cool-spending",
        label: "cool spending for 7 days",
        detail: "purchase volume is elevated versus your disposable cash.",
        severity: "red",
      });
    } else {
      actions.push({
        id: "planned-buying",
        label: "keep planned buying rhythm",
        detail: "purchase volume is within current budget limits.",
        severity: "green",
      });
    }

    return {
      monthlyIncome,
      monthlyGoal,
      monthlyBills,
      daysSinceJoined,
      purchasesThisMonth,
      expectedSavingsByNow,
      actualSavingsNow,
      goalPacePercent,
      goalCompletionPercent,
      billLoadPercent,
      joinedAt,
      health,
      coupleModeActive: Boolean(profile.coupleModeEnabled && partnerProfile),
      partnerEmail: profile.partnerEmail || "",
      history: mergedHistory,
      consistencyStreak,
      scorePoints,
      level,
      categoryLeader,
      actions,
      completedActions: profile.completedActions || [],
    };
  }, [profile]);

  const panelContent = useMemo(() => {
    if (!insights) return null;
    if (activePanel === "pace") {
      return (
        <div className="status-summary">
          <p className="status-line">
            monthly target: ${insights.monthlyGoal.toFixed(0)} | expected by now: $
            {insights.expectedSavingsByNow.toFixed(0)}
          </p>
          <p className="status-line">
            current savings progress: ${insights.actualSavingsNow.toFixed(0)} (
            {insights.goalPacePercent.toFixed(0)}% of pace)
          </p>
        </div>
      );
    }

    if (activePanel === "bills") {
      return (
        <div className="status-summary">
          <p className="status-line">bills this month: ${insights.monthlyBills.toFixed(0)}</p>
          <p className="status-line">
            bill load: {insights.billLoadPercent.toFixed(0)}% of income.
          </p>
        </div>
      );
    }

    return (
      <div className="status-summary">
        <p className="status-line">
          logged purchases this month: ${insights.purchasesThisMonth.toFixed(0)}
        </p>
        <p className="status-line">
          projected post-bills cashflow: ${(insights.monthlyIncome - insights.monthlyBills).toFixed(0)}
        </p>
      </div>
    );
  }, [activePanel, insights]);

  const trendPoints = useMemo(() => {
    if (!insights) return [];
    return insights.history.map((item) => ({
      label: item.date.slice(5),
      value:
        activePanel === "pace"
          ? item.currentSavings
          : activePanel === "bills"
            ? item.monthlyBills
            : item.purchasesToday,
    }));
  }, [activePanel, insights]);

  function toggleAction(actionId: string) {
    if (!insights) return;
    const next = insights.completedActions.includes(actionId)
      ? insights.completedActions.filter((id) => id !== actionId)
      : [...insights.completedActions, actionId];
    saveStoredProfile({ completedActions: next });
    refreshProfile();
  }

  return (
    <section className="goals-layout">
      <div className="dashboard-grid">
        <div className="section-card">
          <h2>monthly-status</h2>
          <div className="status-summary-row">
            <StatusRing
              score={insights ? insights.health.score : 0}
              severity={insights ? insights.health.decisionSeverity : "high"}
            />
            {insights ? (
              <div className="status-summary">
                <p className="status-line">status: {insights.health.status}</p>
                <p className="status-line">
                  goal completion: {insights.goalCompletionPercent.toFixed(0)}%
                </p>
                <p className="status-line">
                  savings now: ${insights.actualSavingsNow.toFixed(0)}
                </p>
                <p className="status-line">
                  bills this month: ${insights.monthlyBills.toFixed(0)}
                </p>
              </div>
            ) : (
              <div className="status-summary">
                <p className="status-line">
                  no journey data yet. set your income, bills, and savings goal in goals tab.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="section-card">
          <h2>journey-feedback</h2>
          {insights ? (
            <div className="status-summary">
              <p className="status-line">
                joined: {insights.joinedAt.toLocaleDateString()} ({insights.daysSinceJoined} days
                ago)
              </p>
              {insights.coupleModeActive ? (
                <p className="status-line">couple mode active with {insights.partnerEmail}.</p>
              ) : null}
              <div className="insight-switcher">
                <button
                  className={activePanel === "pace" ? "active" : ""}
                  onClick={() => setActivePanel("pace")}
                >
                  pace
                </button>
                <button
                  className={activePanel === "bills" ? "active" : ""}
                  onClick={() => setActivePanel("bills")}
                >
                  bills
                </button>
                <button
                  className={activePanel === "purchases" ? "active" : ""}
                  onClick={() => setActivePanel("purchases")}
                >
                  purchases
                </button>
              </div>
              {panelContent}
              <TrendChart
                title={`14-day ${activePanel} trend`}
                points={trendPoints.slice(-14)}
                color={
                  activePanel === "purchases"
                    ? "#ef4444"
                    : activePanel === "bills"
                      ? "#eab308"
                      : "#3b82f6"
                }
              />
            </div>
          ) : (
            <p className="status-line">
              after you set a goal and add bills, this page will show your journey and pace.
            </p>
          )}
        </div>
      </div>

      {insights ? (
        <div className="dashboard-grid">
          <div className="section-card">
            <h2>achievement-hub</h2>
            <div className="achievement-grid">
              <div className="achievement-card">
                <p className="status-line">streak</p>
                <strong>{insights.consistencyStreak} days</strong>
              </div>
              <div className="achievement-card">
                <p className="status-line">money level</p>
                <strong>lvl {insights.level}</strong>
              </div>
              <div className="achievement-card">
                <p className="status-line">engagement score</p>
                <strong>{insights.scorePoints}</strong>
              </div>
              <div className="achievement-card">
                <p className="status-line">top spend category</p>
                <strong>{insights.categoryLeader?.[0] || "n/a"}</strong>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h2>action-center</h2>
            <p className="status-line">
              completed: {insights.completedActions.length}/{insights.actions.length}
            </p>
            <div className="action-list">
              {insights.actions.map((action) => {
                const done = insights.completedActions.includes(action.id);
                return (
                  <button
                    key={action.id}
                    className={`action-item ${done ? "done" : ""}`}
                    onClick={() => toggleAction(action.id)}
                  >
                    <span className={`action-dot ${action.severity}`} />
                    <span>
                      <strong>{action.label}</strong>
                      <small>{action.detail}</small>
                    </span>
                    <span className="action-state">{done ? "done" : "mark"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
