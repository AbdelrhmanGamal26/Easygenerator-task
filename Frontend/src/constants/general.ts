export const SESSION_STORAGE_KEY = 'auth.session';

export const RESPONSE_STATUSES = {
  UNAUTHORIZED: 401,
} as const;

export const BACKEND_RESOURCES = {
  AUTH: '/auth',
  USERS: '/users',
} as const;
