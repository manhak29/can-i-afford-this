"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Tabs from "../components/Tabs";
import { getCurrentUser } from "../utils/auth";

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/");
    }
  }, [router]);

  function goToSettings() {
    router.push("/settings");
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1 className="site-title">can-i-afford-this</h1>
        <button className="profile-icon" aria-label="settings" onClick={goToSettings}>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="profile-icon-svg"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20a8 8 0 0 1 16 0" />
          </svg>
        </button>
      </header>

      <section className="welcome-page">
        <h2>Welcome</h2>
        <p className="welcome-subtitle">
          track your money, purchases, and savings goals with a cleaner dashboard built for quick decisions.
        </p>
        <Tabs />
      </section>
    </main>
  );
}
