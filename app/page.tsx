"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  async function handleLogin(): Promise<void> {
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST"
    });

    const data: { success: boolean } = await res.json();

    if (data.success) {
      router.push("/welcome");
    } else {
      setLoading(false);
    }
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
