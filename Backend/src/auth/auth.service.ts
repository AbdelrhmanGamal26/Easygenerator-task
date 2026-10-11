import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { AuthAuditService } from './audit/auth-audit.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { SignInDto } from './dto/signin.dto.js';
import { SignUpDto } from './dto/signup.dto.js';
import { hashPassword, verifyPassword } from './utils/password.js';
import {
  type IssuedRefreshToken,
  RefreshTokensService,
} from './tokens/refresh-tokens.service.js';

// Compared against when the user is unknown so response time doesn't reveal account existence.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('dummy-password'));

export interface AuthSession extends AuthResponseDto {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokensService,
    private readonly audit: AuthAuditService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    const password = await hashPassword(dto.password);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      password,
    });
    this.audit.record('signup', { userId: user.id });
    return { user: UserResponseDto.from(user) };
  }

  async signIn(dto: SignInDto): Promise<AuthSession> {
    const user = await this.users.findByEmail(dto.email);
    const valid = await verifyPassword(
      dto.password,
      user?.password ?? (await getDummyHash()),
    );
    if (!user || !valid) {
      this.audit.record('signin.failure', {
        userId: user?.id,
        reason: user ? 'wrong_password' : 'unknown_email',
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    this.audit.record('signin.success', { userId: user.id });
    return this.buildSession(user, await this.refreshTokens.issue(user.id));
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    const rotated = await this.refreshTokens.rotate(refreshToken);
    const user = await this.users.findById(rotated.userId);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    this.audit.record('refresh.success', { userId: user.id });
    return this.buildSession(user, rotated);
  }

  async signOut(refreshToken: string | undefined): Promise<void> {
    const userId =
      refreshToken && (await this.refreshTokens.revoke(refreshToken));
    if (userId) this.audit.record('signout', { userId });
  }

  async signOutAll(refreshToken: string | undefined): Promise<void> {
    const userId =
      refreshToken && (await this.refreshTokens.revokeAll(refreshToken));
    if (userId) this.audit.record('signout_all', { userId });
  }

  private async buildSession(
    user: UserDocument,
    refresh: IssuedRefreshToken,
  ): Promise<AuthSession> {
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    const { exp } = this.jwt.decode<{ exp: number }>(accessToken);
    return {
      accessToken,
      accessExpiresAt: new Date(exp * 1000),
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
      user: UserResponseDto.from(user),
    };
  }
}
