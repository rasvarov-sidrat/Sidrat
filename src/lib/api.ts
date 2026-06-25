export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8006';
export const AUTH_TOKEN_KEY = 'sidrat_auth_token';

const USER_ID_MAP: Record<string, string> = {
  'buyer-demo': '11111111-1111-1111-1111-111111111111',
  'seller-demo': '22222222-2222-2222-2222-222222222222',
  'admin-demo': '33333333-3333-3333-3333-333333333333',
};

export function resolveBackendUserId(userId: string | null | undefined) {
  if (!userId) return null;
  return USER_ID_MAP[userId] ?? userId;
}

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (!token) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } else {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // ignore storage failures
  }
}

function getCurrentUserId() {
  try {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { id?: string } | null;
    return resolveBackendUserId(parsed?.id ?? null);
  } catch {
    return null;
  }
}

function formatApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const record = body as { detail?: unknown; message?: unknown };
  const detail = record.detail ?? record.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg);
        }
        return JSON.stringify(item);
      })
      .join('; ');
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return fallback;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authToken = getAuthToken();
  const currentUserId = getCurrentUserId();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(!authToken && currentUserId ? { 'X-User-Id': currentUserId } : {}),
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте, что backend запущен.');
  }

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = await response.json();
      message = formatApiError(body, message);
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
