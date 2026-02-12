"use client";

import { useState } from "react";
import HomeTab from "./HomeTab";

export default function Tabs() {
  const [active, setActive] = useState("home");

  return (
    <>
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
      </div>

      {active === "home" && <HomeTab />}
      {active !== "home" && <p>Coming soon</p>}
    </>
  );
}
