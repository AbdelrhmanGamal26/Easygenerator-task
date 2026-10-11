import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { hashPassword, verifyPassword } from './utils/password.js';
import { RefreshTokensService } from './tokens/refresh-tokens.service.js';
import { AuthAuditService } from './audit/auth-audit.service.js';

const makeUser = (password = 'hash') => ({
  id: 'user-id',
  email: 'jane@example.com',
  name: 'Jane Doe',
  password,
});

describe('AuthService', () => {
  let service: AuthService;
  const users = { create: vi.fn(), findByEmail: vi.fn(), findById: vi.fn() };
  const refreshExpiresAt = new Date(2_000_000_000 * 1000);
  const refreshTokens = {
    issue: vi
      .fn()
      .mockResolvedValue({ token: 'refresh-1', expiresAt: refreshExpiresAt }),
    rotate: vi.fn(),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
  };
  const audit = { record: vi.fn(), alert: vi.fn() };
  const jwt = {
    signAsync: vi.fn().mockResolvedValue('signed-token'),
    decode: vi.fn().mockReturnValue({ exp: 2_000_000_000 }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
        { provide: RefreshTokensService, useValue: refreshTokens },
        { provide: AuthAuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('signs up: hashes the password and returns only the user', async () => {
    users.create.mockImplementation(async (data) => ({
      ...makeUser(),
      ...data,
    }));

    const result = await service.signUp({
      email: 'jane@example.com',
      name: 'Jane Doe',
      password: 'Passw0rd!',
    });

    const arg = users.create.mock.calls[0][0];
    expect(arg.password).not.toBe('Passw0rd!');
    expect(await verifyPassword('Passw0rd!', arg.password)).toBe(true);
    expect(result).not.toHaveProperty('accessToken');
    expect(result.user).toEqual({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it('propagates conflicts on duplicate email', async () => {
    users.create.mockRejectedValue(new ConflictException());
    await expect(
      service.signUp({
        email: 'jane@example.com',
        name: 'Jane Doe',
        password: 'Passw0rd!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('signs in with valid credentials', async () => {
    users.findByEmail.mockResolvedValue(
      makeUser(await hashPassword('Passw0rd!')),
    );
    const result = await service.signIn({
      email: 'jane@example.com',
      password: 'Passw0rd!',
    });
    expect(result.accessToken).toBe('signed-token');
    expect(result.accessExpiresAt).toEqual(new Date(2_000_000_000 * 1000));
    expect(result.refreshToken).toBe('refresh-1');
    expect(result.refreshExpiresAt).toBe(refreshExpiresAt);
  });

  it('does not truncate passwords at 72 bytes', async () => {
    const long = 'Pa1!' + 'é'.repeat(68);
    const hash = await hashPassword(long);
    expect(await verifyPassword(long, hash)).toBe(true);
    expect(await verifyPassword(long.slice(0, -1) + 'x', hash)).toBe(false);
  });

  it('refreshes: rotates the token and issues a new access token', async () => {
    refreshTokens.rotate.mockResolvedValue({
      userId: 'user-id',
      token: 'refresh-2',
      expiresAt: refreshExpiresAt,
    });
    users.findById.mockResolvedValue(makeUser());
    const result = await service.refresh('refresh-1');
    expect(refreshTokens.rotate).toHaveBeenCalledWith('refresh-1');
    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('refresh-2');
  });

  it('rejects refresh without a token or for a deleted user', async () => {
    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    refreshTokens.rotate.mockResolvedValue({
      userId: 'gone',
      token: 'x',
      expiresAt: refreshExpiresAt,
    });
    users.findById.mockResolvedValue(null);
    await expect(service.refresh('refresh-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes the refresh token on sign out', async () => {
    await service.signOut('refresh-1');
    expect(refreshTokens.revoke).toHaveBeenCalledWith('refresh-1');
  });

  it('revokes all refresh tokens on sign out of all sessions', async () => {
    await service.signOutAll('refresh-1');
    expect(refreshTokens.revokeAll).toHaveBeenCalledWith('refresh-1');
  });

  it('rejects a wrong password', async () => {
    users.findByEmail.mockResolvedValue(
      makeUser(await bcrypt.hash('Passw0rd!', 4)),
    );
    await expect(
      service.signIn({ email: 'jane@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unknown email', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(
      service.signIn({ email: 'nobody@example.com', password: 'Passw0rd!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
