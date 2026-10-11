import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  type CookieSettings,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from './utils/auth-cookie.js';
import { AuthService, type AuthSession } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { SignInDto } from './dto/signin.dto.js';
import { SignUpDto } from './dto/signup.dto.js';
import { RefreshToken } from './decorators/refresh-token.decorator.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  private readonly cookieSettings: CookieSettings;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    const sameSite =
      config.getOrThrow<CookieSettings['sameSite']>('COOKIE_SAME_SITE');
    this.cookieSettings = {
      sameSite,
      // Browsers reject SameSite=None cookies that aren't Secure.
      secure: config.get('NODE_ENV') === 'production' || sameSite === 'none',
    };
  }

  @Post('signup')
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email already registered' })
  signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.auth.signUp(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  // Stricter than the controller default to slow down password guessing.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Sets the httpOnly access and refresh token cookies',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.startSession(res, await this.auth.signIn(dto));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  // Looser than the controller default: every tab refreshes silently on page load.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Rotates the refresh token and issues a new access token',
  })
  @ApiUnauthorizedResponse({ description: 'Missing, expired or reused token' })
  async refresh(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.startSession(res, await this.auth.refresh(refreshToken));
  }

  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Revokes the refresh token and clears the cookies',
  })
  async signOut(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.signOut(refreshToken);
    this.clearCookies(res);
  }

  @Post('signout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiNoContentResponse({
    description:
      'Revokes every refresh token of the user and clears the cookies',
  })
  async signOutAll(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.signOutAll(refreshToken);
    this.clearCookies(res);
  }

  private clearCookies(res: Response): void {
    res.clearCookie(
      ACCESS_TOKEN_COOKIE,
      accessTokenCookieOptions(this.cookieSettings),
    );
    res.clearCookie(
      REFRESH_TOKEN_COOKIE,
      refreshTokenCookieOptions(this.cookieSettings),
    );
  }

  private startSession(res: Response, session: AuthSession): AuthResponseDto {
    res.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
      ...accessTokenCookieOptions(this.cookieSettings),
      expires: session.accessExpiresAt,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
      ...refreshTokenCookieOptions(this.cookieSettings),
      expires: session.refreshExpiresAt,
    });
    return { user: session.user };
  }
}
