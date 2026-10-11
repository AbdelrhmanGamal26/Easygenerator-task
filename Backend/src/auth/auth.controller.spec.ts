import { AuthController } from './auth.controller.js';

const session = {
  accessToken: 'access',
  accessExpiresAt: new Date(2_000_000_000 * 1000),
  refreshToken: 'refresh',
  refreshExpiresAt: new Date(2_100_000_000 * 1000),
  user: { email: 'jane@example.com', name: 'Jane Doe' },
};

const makeController = (env: Record<string, string>) => {
  const auth = {
    signUp: vi.fn(),
    signIn: vi.fn().mockResolvedValue(session),
    refresh: vi.fn().mockResolvedValue(session),
    signOut: vi.fn().mockResolvedValue(undefined),
    signOutAll: vi.fn().mockResolvedValue(undefined),
  };
  const config = {
    getOrThrow: (k: string) => env[k],
    get: (k: string) => env[k],
  };
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  return {
    auth,
    res,
    controller: new AuthController(auth as never, config as never),
  };
};

describe('AuthController', () => {
  const dev = { COOKIE_SAME_SITE: 'lax', NODE_ENV: 'development' };

  it('signs in: sets both cookies and returns only the user', async () => {
    const { controller, res } = makeController(dev);
    const body = await controller.signIn(
      { email: 'jane@example.com', password: 'x' },
      res as never,
    );
    expect(body).toEqual({ user: session.user });
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'access',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        expires: session.accessExpiresAt,
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      expect.objectContaining({
        path: '/auth',
        expires: session.refreshExpiresAt,
      }),
    );
  });

  it('marks cookies Secure in production and for SameSite=None', async () => {
    for (const env of [
      { COOKIE_SAME_SITE: 'lax', NODE_ENV: 'production' },
      { COOKIE_SAME_SITE: 'none', NODE_ENV: 'development' },
    ]) {
      const { controller, res } = makeController(env);
      await controller.signOut(undefined, res as never);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({ secure: true }),
      );
    }
  });

  it('refreshes with the cookie token and rotates both cookies', async () => {
    const { controller, auth, res } = makeController(dev);
    await controller.refresh('old-refresh', res as never);
    expect(auth.refresh).toHaveBeenCalledWith('old-refresh');
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });

  it('signs out: revokes the token and clears both cookies', async () => {
    const { controller, auth, res } = makeController(dev);
    await controller.signOut('r', res as never);
    expect(auth.signOut).toHaveBeenCalledWith('r');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('signs out of all sessions and clears both cookies', async () => {
    const { controller, auth, res } = makeController(dev);
    await controller.signOutAll('r', res as never);
    expect(auth.signOutAll).toHaveBeenCalledWith('r');
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/auth' }),
    );
  });
});
