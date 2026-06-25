import type { User } from '@/types';
import { demoUsers, findUserByReferralCode, loadUsers, saveUsers, setCurrentUser } from '@/lib/mvp';
import { IS_OFFLINE_DEMO, setAuthToken } from '@/lib/api';

const DEMO_AUTH_KEY = 'sidrat_demo_auth';

const DEMO_CREDENTIALS = [
  { email: 'buyer@example.com', password: 'buyer-demo-password', userId: 'buyer-demo' },
  { email: 'seller@example.com', password: 'seller-demo-password', userId: 'seller-demo' },
  { email: 'admin@example.com', password: 'admin-demo-password', userId: 'admin-demo' },
] as const;

type DemoAuthEntry = {
  password: string;
  userId: string;
};

function readDemoAuth(): Record<string, DemoAuthEntry> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_AUTH_KEY) || '{}') as Record<string, DemoAuthEntry>;
  } catch {
    return {};
  }
}

function writeDemoAuth(map: Record<string, DemoAuthEntry>) {
  localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(map));
}

function makeReferralCode(name: string) {
  const base = name.replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'USER';
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function setAuthSession(user: User, token: string) {
  setAuthToken(token);
  setCurrentUser(user);
}

export function clearAuthSession() {
  setAuthToken(null);
  setCurrentUser(null);
}

export function isVerifiedUser(user: User | null | undefined) {
  return Boolean(user?.emailVerifiedAt);
}

export function canCreateGb(user: User | null | undefined) {
  return isVerifiedUser(user) && (user?.role === 'seller' || user?.role === 'admin');
}

export function loginWithDemoCredentials(email: string, password: string): User | null {
  if (!IS_OFFLINE_DEMO) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const preset = DEMO_CREDENTIALS.find(
    (item) => item.email === normalizedEmail && item.password === password,
  );
  if (preset) {
    return demoUsers.find((user) => user.id === preset.userId) ?? null;
  }

  const stored = readDemoAuth()[normalizedEmail];
  if (!stored || stored.password !== password) return null;
  return loadUsers().find((user) => user.id === stored.userId) ?? null;
}

export function registerDemoUser(input: {
  name: string;
  email: string;
  password: string;
  referralCode?: string | null;
}): User {
  if (!IS_OFFLINE_DEMO) {
    throw new Error('Demo registration is only available without backend.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) {
    throw new Error('Введите корректный email');
  }

  const users = loadUsers();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Пользователь с таким email уже существует');
  }

  const referrer = input.referralCode ? findUserByReferralCode(input.referralCode) : null;
  const user: User = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    name: input.name.trim() || normalizedEmail.split('@')[0],
    role: 'buyer',
    emailVerifiedAt: new Date().toISOString(),
    walletBalance: 0,
    referralCode: makeReferralCode(input.name.trim() || normalizedEmail),
    referredBy: referrer?.referralCode,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  const auth = readDemoAuth();
  auth[normalizedEmail] = { password: input.password, userId: user.id };
  writeDemoAuth(auth);
  return user;
}
