import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export type AuthEvent =
  | 'signup'
  | 'signin.success'
  | 'signin.failure'
  | 'refresh.success'
  | 'refresh.reuse_detected'
  | 'signout'
  | 'signout_all';

interface AuditFields {
  userId?: string;
  reason?: string;
}

// Structured security events; the request id and IP come from the request-bound logger.
@Injectable()
export class AuthAuditService {
  constructor(
    @InjectPinoLogger('AuthAudit') private readonly logger: PinoLogger,
  ) {}

  record(event: AuthEvent, fields: AuditFields = {}): void {
    this.logger.info({ audit: true, event, ...fields }, event);
  }

  alert(event: AuthEvent, fields: AuditFields = {}): void {
    this.logger.warn({ audit: true, event, ...fields }, event);
  }
}
