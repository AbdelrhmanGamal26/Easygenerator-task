import type { Request } from 'express';
import type { UserDocument } from '../users/schemas/user.schema.js';

export interface JwtPayload {
  sub: string;
}

export type AuthenticatedRequest = Request & { user: UserDocument };
