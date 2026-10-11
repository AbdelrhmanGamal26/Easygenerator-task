import { ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard.js';

const ctx = (
  method: string,
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ method, headers, cookies }) }),
  }) as never;

describe('CsrfGuard', () => {
  const guard = new CsrfGuard({
    getOrThrow: () => 'http://localhost:5173,https://app.example.com',
  } as never);

  it('lets safe methods through', () => {
    expect(guard.canActivate(ctx('GET', { origin: 'http://evil.com' }))).toBe(
      true,
    );
  });

  it('allows unsafe requests from an allowed origin', () => {
    expect(
      guard.canActivate(
        ctx(
          'POST',
          { origin: 'https://app.example.com' },
          { access_token: 'a' },
        ),
      ),
    ).toBe(true);
  });

  it('blocks unsafe requests from an unknown origin', () => {
    expect(() =>
      guard.canActivate(ctx('POST', { origin: 'http://evil.com' })),
    ).toThrow(ForbiddenException);
  });

  it('blocks cookie-bearing unsafe requests without an origin', () => {
    expect(() =>
      guard.canActivate(ctx('POST', {}, { refresh_token: 'r' })),
    ).toThrow(ForbiddenException);
  });

  it('allows cookie-less requests without an origin (non-browser clients)', () => {
    expect(guard.canActivate(ctx('POST'))).toBe(true);
  });
});
