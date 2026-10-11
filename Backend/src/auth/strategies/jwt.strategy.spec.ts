import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const config = { getOrThrow: () => 'x'.repeat(32) };
  const users = { findById: vi.fn() };
  const strategy = new JwtStrategy(config as never, users as never);

  beforeEach(() => vi.resetAllMocks());

  it('returns the user when it exists', async () => {
    const user = { id: 'u1' };
    users.findById.mockResolvedValue(user);
    expect(await strategy.validate({ sub: 'u1' })).toBe(user);
  });

  it('rejects tokens of deleted users', async () => {
    users.findById.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'u1' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
