import { Collection, Puzzle } from '../types/chess';
import { getAuthToken } from './authApi';

interface LibraryPayload {
  collections: Collection[];
  puzzles: Puzzle[];
}

const API_BASE = import.meta.env.VITE_API_URL || '';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getLibrary(): Promise<LibraryPayload> {
  return requestJson<LibraryPayload>('/api/library');
}

export async function saveLibrary(payload: LibraryPayload): Promise<void> {
  await requestJson('/api/library', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}