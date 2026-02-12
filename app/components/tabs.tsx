"use client";

import { useState } from "react";
import HomeTab from "./HomeTab";
import GoalsTab from "./GoalsTab";
import PurchasesTab from "./PurchasesTab";
import ExploreTab from "./ExploreTab";

export default function Tabs() {
  const [active, setActive] = useState("home");

  return (
    <section className="tabs-layout">
      <div className="tabs">
        <button
          className={active === "home" ? "active" : ""}
          onClick={() => setActive("home")}
        >
          Home
        </button>

        <button
          className={active === "goals" ? "active" : ""}
          onClick={() => setActive("goals")}
        >
          Goals
        </button>

        <button
          className={active === "purchases" ? "active" : ""}
          onClick={() => setActive("purchases")}
        >
          Purchases
        </button>

        <button
          className={active === "explore" ? "active" : ""}
          onClick={() => setActive("explore")}
        >
          Explore
        </button>
      </div>

      <div className="tab-content">
        {active === "home" && <HomeTab />}
        {active === "goals" && <GoalsTab />}
        {active === "purchases" && <PurchasesTab />}
        {active === "explore" && <ExploreTab />}
      </div>
    </section>
  );
}
