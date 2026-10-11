import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { User } from '../../users/schemas/user.schema.js';
import { RefreshTokensService } from './refresh-tokens.service.js';
import { AuthAuditService } from '../audit/auth-audit.service.js';
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_REFRESH_AUDIENCE,
} from './jwt.constants.js';

const exec = <T>(value: T) => ({ exec: vi.fn().mockResolvedValue(value) });
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const SECRET = 'test-secret-test-secret-test-secret';

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let jwt: JwtService;
  const model = { updateOne: vi.fn() };
  const audit = { record: vi.fn(), alert: vi.fn() };
  const config: Record<string, unknown> = {
    REFRESH_TOKEN_TTL_DAYS: 7,
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    model.updateOne.mockReturnValue(exec({ modifiedCount: 1 }));
    jwt = new JwtService({
      secret: SECRET,
      signOptions: { algorithm: 'HS256', issuer: JWT_ISSUER },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        RefreshTokensService,
        { provide: getModelToken(User.name), useValue: model },
        { provide: JwtService, useValue: jwt },
        { provide: AuthAuditService, useValue: audit },
        {
          provide: ConfigService,
          useValue: { getOrThrow: (k: string) => config[k] },
        },
      ],
    }).compile();
    service = moduleRef.get(RefreshTokensService);
  });

  const pushedHash = () =>
    model.updateOne.mock.calls.find((c) => c[1].$push)![1].$push.refreshTokens
      .$each[0];

  it('stores only the hash of the issued token', async () => {
    const { token, expiresAt } = await service.issue('user-1');
    expect(pushedHash()).toBe(sha(token));
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rotates a stored token, removing its hash and storing the next', async () => {
    const { token } = await service.issue('user-1');
    model.updateOne.mockClear();
    const next = await service.rotate(token);
    expect(next.userId).toBe('user-1');
    expect(model.updateOne.mock.calls[0]).toEqual([
      { _id: 'user-1', refreshTokens: sha(token) },
      { $pull: { refreshTokens: sha(token) } },
    ]);
    expect(pushedHash()).toBe(sha(next.token));
  });

  it('clears all stored tokens when an already-used token is replayed', async () => {
    const { token } = await service.issue('user-1');
    model.updateOne.mockClear();
    model.updateOne.mockReturnValueOnce(exec({ modifiedCount: 0 }));
    await expect(service.rotate(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(model.updateOne).toHaveBeenLastCalledWith(
      { _id: 'user-1' },
      { $set: { refreshTokens: [] } },
    );
    expect(audit.alert).toHaveBeenCalledWith('refresh.reuse_detected', {
      userId: 'user-1',
    });
  });

  it('rejects tokens that are not validly signed refresh tokens', async () => {
    await expect(service.rotate('garbage')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    const access = await jwt.signAsync(
      {},
      { subject: 'u', audience: JWT_AUDIENCE },
    );
    await expect(service.rotate(access)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('removes the hash of an expired token when it is presented', async () => {
    const expired = await jwt.signAsync(
      {},
      { subject: 'user-1', audience: JWT_REFRESH_AUDIENCE, expiresIn: -10 },
    );
    await expect(service.rotate(expired)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $pull: { refreshTokens: sha(expired) } },
    );
  });

  it('clears every stored hash on revokeAll', async () => {
    const { token } = await service.issue('user-1');
    model.updateOne.mockClear();
    await service.revokeAll(token);
    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $set: { refreshTokens: [] } },
    );
  });

  it('removes the hash on revoke', async () => {
    const { token } = await service.issue('user-1');
    model.updateOne.mockClear();
    await service.revoke(token);
    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $pull: { refreshTokens: sha(token) } },
    );
  });
});
