"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  changePassword,
  clearCurrentUser,
  getCurrentUser,
  isValidGmail,
  listUsers,
  normalizeEmail,
  setCurrentUser,
  verifyLogin,
} from "../utils/auth";
import { getStoredProfile, saveStoredProfile } from "../utils/profile";

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUserEmail] = useState("");
  const [message, setMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");

  const [coupleModeEnabled, setCoupleModeEnabled] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPassword, setPartnerPassword] = useState("");

  useEffect(() => {
    const email = getCurrentUser();
    if (!email) {
      router.replace("/");
      return;
    }
    setCurrentUserEmail(email);

    const profile = getStoredProfile();
    if (profile) {
      setCoupleModeEnabled(Boolean(profile.coupleModeEnabled));
      setPartnerEmail(profile.partnerEmail || "");
    }
  }, [router]);

  const otherUsers = useMemo(() => {
    return listUsers().filter((user) => user.email !== currentUser);
  }, [currentUser]);

  function saveCoupleSettings(next: { enabled: boolean; partner: string }) {
    saveStoredProfile({
      coupleModeEnabled: next.enabled,
      partnerEmail: normalizeEmail(next.partner),
    });
    setCoupleModeEnabled(next.enabled);
    setPartnerEmail(normalizeEmail(next.partner));
  }

  function handlePasswordChange() {
    setMessage("");
    if (newPassword !== confirmNewPassword) {
      setMessage("new passwords do not match.");
      return;
    }

    const result = changePassword({
      email: currentUser,
      currentPassword,
      nextPassword: newPassword,
    });
    if (!result.ok) {
      setMessage(result.reason || "unable to change password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setMessage("password updated.");
  }

  function handleSwitchProfile() {
    setMessage("");
    const normalized = normalizeEmail(switchEmail);
    if (!isValidGmail(normalized)) {
      setMessage("enter a valid gmail for profile switch.");
      return;
    }
    const result = verifyLogin(normalized, switchPassword);
    if (!result.ok) {
      setMessage(result.reason || "unable to switch profile.");
      return;
    }

    setCurrentUser(normalized);
    router.push("/welcome");
  }

  function handleQuickSwitch(email: string) {
    setSwitchEmail(email);
  }

  function handleLinkPartner() {
    setMessage("");
    const normalizedPartner = normalizeEmail(partnerEmail);
    if (!isValidGmail(normalizedPartner)) {
      setMessage("partner must be a valid gmail account.");
      return;
    }
    if (normalizedPartner === currentUser) {
      setMessage("you cannot link your own account as partner.");
      return;
    }

    const partnerCheck = verifyLogin(normalizedPartner, partnerPassword);
    if (!partnerCheck.ok) {
      setMessage("partner verification failed. check partner email/password.");
      return;
    }

    saveCoupleSettings({ enabled: coupleModeEnabled, partner: normalizedPartner });
    setPartnerPassword("");
    setMessage("partner profile linked.");
  }

  function handleToggleCoupleMode() {
    if (!partnerEmail) {
      setMessage("link a partner profile first.");
      return;
    }
    saveCoupleSettings({ enabled: !coupleModeEnabled, partner: partnerEmail });
    setMessage(!coupleModeEnabled ? "couple mode enabled." : "couple mode disabled.");
  }

  function handleLogout() {
    const confirmed = window.confirm("log out of this account?");
    if (!confirmed) return;
    clearCurrentUser();
    router.push("/");
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1 className="site-title">settings</h1>
        <button className="secondary settings-back-btn" onClick={() => router.push("/welcome")}>
          back
        </button>
      </header>

      <section className="goals-layout">
        <div className="section-card">
          <h2>account-security</h2>
          <p className="status-line">signed in as: {currentUser || "unknown user"}</p>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="current password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="new password"
          />
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="confirm new password"
          />
          <button className="primary" onClick={handlePasswordChange}>
            update password
          </button>
        </div>

        <div className="section-card">
          <h2>switch-profile</h2>
          <input
            type="email"
            value={switchEmail}
            onChange={(e) => setSwitchEmail(e.target.value)}
            placeholder="profile gmail"
          />
          <input
            type="password"
            value={switchPassword}
            onChange={(e) => setSwitchPassword(e.target.value)}
            placeholder="profile password"
          />
          <button className="primary" onClick={handleSwitchProfile}>
            switch profile
          </button>

          {otherUsers.length > 0 ? (
            <div className="quick-switch-list">
              <p className="status-line">quick pick:</p>
              {otherUsers.map((user) => (
                <button
                  key={user.email}
                  className="secondary quick-switch-btn"
                  onClick={() => handleQuickSwitch(user.email)}
                >
                  {user.email}
                </button>
              ))}
            </div>
          ) : (
            <p className="status-line">no other profiles found on this device yet.</p>
          )}
        </div>

        <div className="section-card">
          <h2>couple-mode</h2>
          <p className="status-line">
            linked partner: {partnerEmail || "none"} | mode:{" "}
            {coupleModeEnabled ? "enabled" : "disabled"}
          </p>
          <input
            type="email"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            placeholder="partner gmail"
          />
          <input
            type="password"
            value={partnerPassword}
            onChange={(e) => setPartnerPassword(e.target.value)}
            placeholder="partner password for verification"
          />
          <button className="primary" onClick={handleLinkPartner}>
            link partner profile
          </button>
          <button className="secondary" onClick={handleToggleCoupleMode}>
            {coupleModeEnabled ? "disable couple mode" : "enable couple mode"}
          </button>
          <button
            className="secondary"
            onClick={() => {
              const confirmed = window.confirm("remove linked partner profile?");
              if (!confirmed) return;
              saveCoupleSettings({ enabled: false, partner: "" });
              setMessage("partner link removed.");
            }}
          >
            remove partner link
          </button>
        </div>

        <div className="section-card">
          <h2>session</h2>
          <button className="secondary" onClick={handleLogout}>
            log out
          </button>
          {message ? <p className="auth-message">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
