export type StoredUser = {
  email: string;
  password: string;
  createdAt: string;
};

const USERS_STORAGE_KEY = "can-i-afford-this-users-v1";
const CURRENT_USER_STORAGE_KEY = "can-i-afford-this-current-user-v1";

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidGmail(email: string) {
  return /^[a-z0-9._%+-]+@gmail\.com$/i.test(normalizeEmail(email));
}

export function findUserByEmail(email: string): StoredUser | null {
  const normalized = normalizeEmail(email);
  const users = readUsers();
  return users.find((user) => user.email === normalized) ?? null;
}

export function listUsers(): StoredUser[] {
  return readUsers();
}

export function createUser(email: string, password: string): { ok: boolean; reason?: string } {
  const normalized = normalizeEmail(email);
  if (!isValidGmail(normalized)) {
    return { ok: false, reason: "please use a valid gmail address." };
  }
  if (password.length < 6) {
    return { ok: false, reason: "password must be at least 6 characters." };
  }
  const users = readUsers();
  if (users.some((user) => user.email === normalized)) {
    return { ok: false, reason: "this gmail is already registered. please sign in." };
  }

  users.push({
    email: normalized,
    password,
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
  return { ok: true };
}

export function verifyLogin(email: string, password: string): { ok: boolean; reason?: string } {
  const user = findUserByEmail(email);
  if (!user) {
    return { ok: false, reason: "no account found for this gmail. please sign up first." };
  }
  if (user.password !== password) {
    return { ok: false, reason: "incorrect password." };
  }
  return { ok: true };
}

export function setCurrentUser(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, normalizeEmail(email));
}

export function getCurrentUser() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) ?? "";
}

export function clearCurrentUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

export function changePassword(params: {
  email: string;
  currentPassword: string;
  nextPassword: string;
}): { ok: boolean; reason?: string } {
  const normalizedEmail = normalizeEmail(params.email);
  const users = readUsers();
  const index = users.findIndex((user) => user.email === normalizedEmail);
  if (index === -1) {
    return { ok: false, reason: "user account not found." };
  }
  if (users[index].password !== params.currentPassword) {
    return { ok: false, reason: "current password is incorrect." };
  }
  if (params.nextPassword.length < 6) {
    return { ok: false, reason: "new password must be at least 6 characters." };
  }

  users[index] = {
    ...users[index],
    password: params.nextPassword,
  };
  writeUsers(users);
  return { ok: true };
}
