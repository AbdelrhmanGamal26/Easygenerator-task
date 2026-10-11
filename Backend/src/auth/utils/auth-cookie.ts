import type { CookieOptions, Request } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export interface CookieSettings {
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

export const accessTokenCookieOptions = ({
  secure,
  sameSite,
}: CookieSettings): CookieOptions => ({
  httpOnly: true,
  secure,
  sameSite,
  path: '/',
});

// Scoped to /auth so the long-lived token is only sent to refresh/signout.
export const refreshTokenCookieOptions = (
  settings: CookieSettings,
): CookieOptions => ({
  ...accessTokenCookieOptions(settings),
  path: '/auth',
});

export const cookieTokenExtractor = (req: Request): string | null =>
  (req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined) ?? null;
