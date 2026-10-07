import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { UserRoleGuard } from '../guards/user-role.guard';
import { Roles } from './roles.decorator';

export function Auth(...roles: Role[]) {
  const decorators = [UseGuards(AuthGuard(), UserRoleGuard)];
  if (roles.length > 0) decorators.unshift(Roles(roles));
  return applyDecorators(...decorators);
}
