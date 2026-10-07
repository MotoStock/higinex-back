import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Roles } from '../decorators/roles.decorator';
import { ValidatedUserPayload } from '../interfaces/validated-user-payload.interface';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!validRoles || validRoles.length === 0) return true;
    const req: Request = context.switchToHttp().getRequest();
    const user = req.user as ValidatedUserPayload;
    if (!user) throw new UnauthorizedException('User not found');
    if (!validRoles.includes(user.role))
      throw new ForbiddenException(
        `Access denied - Requires one of the following roles: ${validRoles.join(', ')}`,
      );
    return true;
  }
}
