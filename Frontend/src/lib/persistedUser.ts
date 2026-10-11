import { SESSION_STORAGE_KEY } from '@/constants/general';
import type { User } from '@/@types/authTypes';

/** Reads the profile saved by `savePersistedUser`, or `null` if absent or corrupt. */
export const loadPersistedUser = (): User | null => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null',
    ) as { user?: User } | null;

    return saved?.user ?? null;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);

    return null;
  }
};

/** Persists only the displayed profile fields (never tokens); `null` clears it. */
export const savePersistedUser = (user: User | null) => {
  if (user) {
    const { email, name } = user;
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { email, name } }),
    );
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};
