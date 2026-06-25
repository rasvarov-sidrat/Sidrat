import type { User } from '@/types';
import { setCurrentUser } from '@/lib/mvp';
import { setAuthToken } from '@/lib/api';

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
