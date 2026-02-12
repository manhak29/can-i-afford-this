import { getCurrentUser, normalizeEmail } from "./auth";

export type ExpenseFields = {
  rent: string;
  utilities: string;
  food: string;
  transport: string;
  insurance: string;
  other: string;
};

export type LoggedPurchase = {
  id: string;
  date: string;
  amount: number;
  note: string;
  isBig: boolean;
  category?: string;
};

export type StoredProfile = {
  createdAt: string;
  monthlyIncome: string;
  monthlyGoal: string;
  paychecksPerMonth: string;
  expenses: ExpenseFields;
  currentSavings: string;
  purchaseLog: LoggedPurchase[];
  coupleModeEnabled: boolean;
  partnerEmail: string;
  history: DailySnapshot[];
  completedActions: string[];
};

export type DailySnapshot = {
  date: string;
  monthlyIncome: number;
  monthlyBills: number;
  monthlyGoal: number;
  currentSavings: number;
  purchasesToday: number;
};

const PROFILE_STORAGE_KEY_PREFIX = "can-i-afford-this-profile-v1";

export const DEFAULT_EXPENSES: ExpenseFields = {
  rent: "",
  utilities: "",
  food: "",
  transport: "",
  insurance: "",
  other: "",
};

function getProfileStorageKey(): string | null {
  if (typeof window === "undefined") return null;
  const currentUser = normalizeEmail(getCurrentUser());
  if (!currentUser) return null;
  return `${PROFILE_STORAGE_KEY_PREFIX}:${currentUser}`;
}

function getProfileStorageKeyForEmail(email: string): string {
  return `${PROFILE_STORAGE_KEY_PREFIX}:${normalizeEmail(email)}`;
}

export function getStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  const storageKey = getProfileStorageKey();
  if (!storageKey) return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export function getStoredProfileByEmail(email: string): StoredProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getProfileStorageKeyForEmail(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export function saveStoredProfile(partial: Partial<StoredProfile>) {
  if (typeof window === "undefined") return;
  const storageKey = getProfileStorageKey();
  if (!storageKey) return;
  const existing = getStoredProfile();
  const profile: StoredProfile = {
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    monthlyIncome: existing?.monthlyIncome ?? "",
    monthlyGoal: existing?.monthlyGoal ?? "",
    paychecksPerMonth: existing?.paychecksPerMonth ?? "2",
    expenses: existing?.expenses ?? DEFAULT_EXPENSES,
    currentSavings: existing?.currentSavings ?? "",
    purchaseLog: existing?.purchaseLog ?? [],
    coupleModeEnabled: existing?.coupleModeEnabled ?? false,
    partnerEmail: existing?.partnerEmail ?? "",
    history: existing?.history ?? [],
    completedActions: existing?.completedActions ?? [],
    ...partial,
  };

  const today = new Date().toISOString().split("T")[0];
  const monthlyBills = Object.values(profile.expenses || {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
  const purchasesToday = (profile.purchaseLog || []).reduce((sum, purchase) => {
    return purchase.date === today ? sum + (Number(purchase.amount) || 0) : sum;
  }, 0);
  const todaySnapshot: DailySnapshot = {
    date: today,
    monthlyIncome: Number(profile.monthlyIncome) || 0,
    monthlyBills,
    monthlyGoal: Number(profile.monthlyGoal) || 0,
    currentSavings: Number(profile.currentSavings) || 0,
    purchasesToday,
  };
  const existingHistory = profile.history || [];
  const snapshotIndex = existingHistory.findIndex((item) => item.date === today);
  const nextHistory =
    snapshotIndex >= 0
      ? existingHistory.map((item, idx) => (idx === snapshotIndex ? todaySnapshot : item))
      : [...existingHistory, todaySnapshot];
  profile.history = nextHistory.sort((a, b) => a.date.localeCompare(b.date)).slice(-60);

  window.localStorage.setItem(storageKey, JSON.stringify(profile));
  window.dispatchEvent(new Event("profile-updated"));
}
