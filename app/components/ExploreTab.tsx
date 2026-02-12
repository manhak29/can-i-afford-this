"use client";

import { useMemo, useState } from "react";
import TrendChart from "./TrendChart";

type Scenario = {
  id: string;
  title: string;
  detail: string;
  apply: (base: Inputs) => Inputs;
};

type Inputs = {
  income: number;
  bills: number;
  savings: number;
  goal: number;
};

const SCENARIOS: Scenario[] = [
  {
    id: "side-income",
    title: "add side income",
    detail: "simulate an extra $300/month income stream.",
    apply: (base) => ({ ...base, income: base.income + 300 }),
  },
  {
    id: "bill-trim",
    title: "trim subscriptions",
    detail: "cut monthly bills by 12%.",
    apply: (base) => ({ ...base, bills: Math.max(base.bills * 0.88, 0) }),
  },
  {
    id: "save-boost",
    title: "savings sprint",
    detail: "pretend you save +$250 this month.",
    apply: (base) => ({ ...base, savings: base.savings + 250 }),
  },
  {
    id: "big-purchase",
    title: "buy something big",
    detail: "simulate a $900 purchase impact on savings.",
    apply: (base) => ({ ...base, savings: Math.max(base.savings - 900, 0) }),
  },
];

const EXPLORE_QUESTS = [
  { id: "quest1", label: "no-spend week", reward: "+40 score" },
  { id: "quest2", label: "review all subscriptions", reward: "+20 score" },
  { id: "quest3", label: "track 5 purchases in a row", reward: "+25 score" },
  { id: "quest4", label: "hit savings target 3 days straight", reward: "+50 score" },
];

function monthsToGoal(inputs: Inputs) {
  const monthlyFreeCash = Math.max(inputs.income - inputs.bills, 0);
  const remaining = Math.max(inputs.goal - inputs.savings, 0);
  if (remaining <= 0) return 0;
  if (monthlyFreeCash <= 0) return null;
  return Math.ceil(remaining / monthlyFreeCash);
}

export default function ExploreTab() {
  const [income, setIncome] = useState("4200");
  const [bills, setBills] = useState("2400");
  const [savings, setSavings] = useState("1800");
  const [goal, setGoal] = useState("5000");
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0].id);
  const [questDone, setQuestDone] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState(
    "try the bill trim scenario and compare goal timelines."
  );

  const baseInputs: Inputs = {
    income: Number(income) || 0,
    bills: Number(bills) || 0,
    savings: Number(savings) || 0,
    goal: Number(goal) || 0,
  };

  const scenario = SCENARIOS.find((item) => item.id === activeScenario) || SCENARIOS[0];
  const projectedInputs = scenario.apply(baseInputs);

  const baseMonths = monthsToGoal(baseInputs);
  const projectedMonths = monthsToGoal(projectedInputs);

  const deltaMonths =
    baseMonths !== null && projectedMonths !== null ? projectedMonths - baseMonths : null;
  const forecastPointsBase = useMemo(() => {
    const freeCash = Math.max(baseInputs.income - baseInputs.bills, 0);
    return Array.from({ length: 6 }, (_, index) => ({
      label: `m${index + 1}`,
      value: baseInputs.savings + freeCash * (index + 1),
    }));
  }, [baseInputs.bills, baseInputs.income, baseInputs.savings]);

  const forecastPointsScenario = useMemo(() => {
    const freeCash = Math.max(projectedInputs.income - projectedInputs.bills, 0);
    return Array.from({ length: 6 }, (_, index) => ({
      label: `m${index + 1}`,
      value: projectedInputs.savings + freeCash * (index + 1),
    }));
  }, [projectedInputs.bills, projectedInputs.income, projectedInputs.savings]);

  const questScore = questDone.length * 30;

  function toggleQuest(id: string) {
    setQuestDone((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function generateSuggestion() {
    const freeCash = Math.max(baseInputs.income - baseInputs.bills, 0);
    if (freeCash < 300) {
      setSuggestion("focus on bill reduction first, then re-run side income scenario.");
      return;
    }
    if (baseMonths === null) {
      setSuggestion("your monthly bills are too high right now. test the bill trim scenario.");
      return;
    }
    if (baseMonths > 8) {
      setSuggestion("combine side income + savings sprint to cut your timeline fast.");
      return;
    }
    setSuggestion("you are close. run a no-spend challenge to reach your goal sooner.");
  }

  return (
    <section className="goals-layout">
      <div className="dashboard-grid">
        <div className="section-card">
          <h2>what-if-lab</h2>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="monthly income"
          />
          <input
            type="number"
            value={bills}
            onChange={(e) => setBills(e.target.value)}
            placeholder="monthly bills"
          />
          <input
            type="number"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            placeholder="current savings"
          />
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="savings goal"
          />

          <div className="scenario-grid">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                className={`scenario-btn ${activeScenario === item.id ? "active" : ""}`}
                onClick={() => setActiveScenario(item.id)}
              >
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h2>scenario-impact</h2>
          <p className="status-line">
            baseline timeline: {baseMonths === null ? "not reachable" : `${baseMonths} months`}
          </p>
          <p className="status-line">
            with "{scenario.title}": {projectedMonths === null ? "not reachable" : `${projectedMonths} months`}
          </p>
          <p className="status-line">
            timeline delta:{" "}
            {deltaMonths === null
              ? "n/a"
              : deltaMonths < 0
                ? `${Math.abs(deltaMonths)} months faster`
                : deltaMonths > 0
                  ? `${deltaMonths} months slower`
                  : "no change"}
          </p>
          <TrendChart title="baseline forecast (6 months)" points={forecastPointsBase} color="#9ca3af" />
          <TrendChart title="scenario forecast (6 months)" points={forecastPointsScenario} color="#10a37f" />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="section-card">
          <h2>money-quests</h2>
          <p className="status-line">quest score: {questScore}</p>
          <div className="action-list">
            {EXPLORE_QUESTS.map((quest) => {
              const done = questDone.includes(quest.id);
              return (
                <button
                  key={quest.id}
                  className={`action-item ${done ? "done" : ""}`}
                  onClick={() => toggleQuest(quest.id)}
                >
                  <span className={`action-dot ${done ? "green" : "yellow"}`} />
                  <span>
                    <strong>{quest.label}</strong>
                    <small>reward: {quest.reward}</small>
                  </span>
                  <span className="action-state">{done ? "done" : "start"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="section-card">
          <h2>discovery-feed</h2>
          <p className="status-line">{suggestion}</p>
          <button className="primary" onClick={generateSuggestion}>
            generate next move
          </button>
          <p className="status-line">
            click scenarios and quests to explore your financial path like a game.
          </p>
        </div>
      </div>
    </section>
  );
}
