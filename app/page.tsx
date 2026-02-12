"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);
    setTimeout(() => {
      router.push("/welcome");
    }, 800);
  }

  return (
    <main>
      <div className="card">
        <h1>Can I Afford This</h1>
        <p>Sign in to continue</p>

        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />

        <button className="primary" onClick={handleLogin}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button className="secondary">Sign Up</button>
      </div>
    </main>
  );
}
