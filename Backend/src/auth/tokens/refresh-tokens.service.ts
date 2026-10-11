import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { Model } from 'mongoose';
import {
  JWT_ISSUER,
  JWT_ALGORITHM,
  JWT_REFRESH_AUDIENCE,
} from './jwt.constants.js';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { AuthAuditService } from '../audit/auth-audit.service.js';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

// Caps concurrent sessions per user; also bounds leftovers from tokens that expired unused.
const MAX_SESSIONS = 10;
const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/**
 * Refresh tokens are signed JWTs carrying the user id and expiry. Only the SHA-256 of
 * each live token is kept in the user's `refreshTokens` array; used or revoked hashes are removed.
 */
@Injectable()
export class RefreshTokensService {
  private readonly ttlSeconds: number;

  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
    private readonly jwt: JwtService,
    private readonly audit: AuthAuditService,
    config: ConfigService,
  ) {
    this.ttlSeconds =
      config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS') * 86_400;
  }

  async issue(userId: string): Promise<IssuedRefreshToken> {
    const token = await this.jwt.signAsync(
      {},
      {
        subject: userId,
        jwtid: randomUUID(),
        audience: JWT_REFRESH_AUDIENCE,
        expiresIn: this.ttlSeconds,
      },
    );
    const { exp } = this.jwt.decode<{ exp: number }>(token);
    await this.model
      .updateOne(
        { _id: userId },
        {
          $push: {
            refreshTokens: { $each: [hash(token)], $slice: -MAX_SESSIONS },
          },
        },
      )
      .exec();
    return { token, expiresAt: new Date(exp * 1000) };
  }

  /** Consumes a refresh token and issues its replacement. */
  async rotate(
    token: string,
  ): Promise<IssuedRefreshToken & { userId: string }> {
    const userId = await this.verify(token);
    const tokenHash = hash(token);
    const result = await this.model
      .updateOne(
        { _id: userId, refreshTokens: tokenHash },
        { $pull: { refreshTokens: tokenHash } },
      )
      .exec();

    if (result.modifiedCount !== 1) {
      // A validly signed token that is no longer stored was already used: treat as theft.
      await this.invalidateAll(userId);
      this.audit.alert('refresh.reuse_detected', { userId });
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { userId, ...(await this.issue(userId)) };
  }

  /** Returns the id of the token's owner, or null when the token was invalid. */
  async revoke(token: string): Promise<string | null> {
    const userId = await this.ownerOf(token);
    if (userId) {
      await this.model
        .updateOne({ _id: userId }, { $pull: { refreshTokens: hash(token) } })
        .exec();
    }
    return userId;
  }

  /** Revokes every refresh token of the token's owner; returns that user id or null. */
  async revokeAll(token: string): Promise<string | null> {
    const userId = await this.ownerOf(token);
    if (userId) await this.invalidateAll(userId);
    return userId;
  }

  private async invalidateAll(userId: string): Promise<void> {
    await this.model
      .updateOne({ _id: userId }, { $set: { refreshTokens: [] } })
      .exec();
  }

  // Sign-out must succeed even for expired or invalid tokens, so failures yield null.
  private async ownerOf(token: string): Promise<string | null> {
    try {
      return await this.verify(token, true);
    } catch {
      return null;
    }
  }

  private async verify(
    token: string,
    ignoreExpiration = false,
  ): Promise<string> {
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(token, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        audience: JWT_REFRESH_AUDIENCE,
        ignoreExpiration,
      });
      return sub;
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        // Drop the stale hash so expired tokens don't accumulate.
        await this.revoke(token);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
