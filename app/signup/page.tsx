"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUser, isValidGmail, setCurrentUser } from "../utils/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSignUp() {
    const normalizedEmail = email.trim().toLowerCase();
    setMessage("");

    if (!isValidGmail(normalizedEmail)) {
      setMessage("please use a valid gmail address.");
      return;
    }
    if (password.length < 6) {
      setMessage("password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("passwords do not match.");
      return;
    }

    const result = createUser(normalizedEmail, password);
    if (!result.ok) {
      setMessage(result.reason || "unable to create account.");
      return;
    }

    setLoading(true);
    setCurrentUser(normalizedEmail);
    setTimeout(() => {
      router.push("/welcome");
    }, 700);
  }

  return (
    <main className="auth-main">
      <div className="card">
        <h1>create-account</h1>
        <p className="input-heading">sign up with gmail to start tracking</p>

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
          placeholder="create password"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="confirm password"
        />

        <button className="primary" onClick={handleSignUp}>
          {loading ? "creating account..." : "sign up"}
        </button>
        <button className="secondary" onClick={() => router.push("/")}>
          back to login
        </button>

        {message ? <p className="auth-message">{message}</p> : null}
      </div>
    </main>
  );
}
