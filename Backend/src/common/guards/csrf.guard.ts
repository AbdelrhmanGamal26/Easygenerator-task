import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../auth/utils/auth-cookie.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie auth: state-changing requests must come from an allowed Origin.
 * Browsers always send Origin on such requests, so a cookie-bearing request without one is rejected.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor(config: ConfigService) {
    this.allowedOrigins = config.getOrThrow<string>('CORS_ORIGIN').split(',');
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const origin = req.headers.origin;
    const usesCookies = Boolean(
      req.cookies?.[ACCESS_TOKEN_COOKIE] || req.cookies?.[REFRESH_TOKEN_COOKIE],
    );
    const allowed = origin
      ? this.allowedOrigins.includes(origin)
      : !usesCookies;
    if (!allowed) throw new ForbiddenException('Cross-site request blocked');
    return true;
  }
}
