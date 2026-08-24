import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: bigint;
  email: string;
  name: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();

    return request.user;
  },
);
