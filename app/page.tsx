"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { findUserByEmail, isValidGmail, setCurrentUser, verifyLogin } from "./utils/auth";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showSignupHint, setShowSignupHint] = useState(false);

  function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    setMessage("");
    setShowSignupHint(false);

    if (!isValidGmail(normalizedEmail)) {
      setMessage("please enter a valid gmail address.");
      return;
    }

    const existingUser = findUserByEmail(normalizedEmail);
    if (!existingUser) {
      setMessage("we couldn't find your account yet.");
      setShowSignupHint(true);
      return;
    }

    const result = verifyLogin(normalizedEmail, password);
    if (!result.ok) {
      setMessage(result.reason || "login failed.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setCurrentUser(normalizedEmail);
      router.push("/welcome");
    }, 800);
  }

  return (
    <main className="auth-main">
      <div className="card">
        <h1>can-i-afford-this</h1>
        <p className="input-heading">Sign in to continue</p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="enter your gmail address"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="enter your password"
        />

        <button className="primary" onClick={handleLogin}>
          {loading ? "logging in..." : "login"}
        </button>

        <button className="secondary" onClick={() => router.push("/signup")}>
          sign up
        </button>
        {message ? <p className="auth-message">{message}</p> : null}
        {showSignupHint ? (
          <p className="auth-message">
            this looks like a new user. create an account on the sign up page.
          </p>
        ) : null}
      </div>
    </main>
  );
}
