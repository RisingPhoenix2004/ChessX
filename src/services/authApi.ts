import { UserProfile } from '../types/chess';

const AUTH_TOKEN_KEY = 'tactix_auth_token';
const API_BASE = import.meta.env.VITE_API_URL || '';

export interface AuthResponse {
  message: string;
  user?: UserProfile;
  token?: string;
  resetLink?: string;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await requestJson<{ user: UserProfile }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.user;
  } catch {
    clearAuthToken();
    return null;
  }
}

export async function registerAccount(payload: {
  email: string;
  username: string;
  password: string;
  confirmPassword?: string;
}): Promise<AuthResponse> {
  const response = await requestJson<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.token) {
    saveAuthToken(response.token);
  }

  return response;
}

export async function loginAccount(payload: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await requestJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.token) {
    saveAuthToken(response.token);
  }

  return response;
}

export async function requestPasswordReset(payload: {
  emailOrUsername: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: {
  token: string;
  password: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logoutAccount(): Promise<void> {
  clearAuthToken();
}