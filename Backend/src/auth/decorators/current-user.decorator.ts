import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserDocument } from '../../users/schemas/user.schema.js';
import type { AuthenticatedRequest } from '../auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
