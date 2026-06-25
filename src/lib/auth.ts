import type { User } from '@/types';
import { demoUsers, setCurrentUser } from '@/lib/mvp';
import { IS_OFFLINE_DEMO, setAuthToken } from '@/lib/api';

const DEMO_CREDENTIALS = [
  { email: 'buyer@example.com', password: 'buyer-demo-password', userId: 'buyer-demo' },
  { email: 'seller@example.com', password: 'seller-demo-password', userId: 'seller-demo' },
  { email: 'admin@example.com', password: 'admin-demo-password', userId: 'admin-demo' },
] as const;

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
  const match = DEMO_CREDENTIALS.find(
    (item) => item.email === normalizedEmail && item.password === password,
  );
  if (!match) return null;
  return demoUsers.find((user) => user.id === match.userId) ?? null;
}
