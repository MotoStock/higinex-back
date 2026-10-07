import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ValidatedUserPayload } from '../interfaces/validated-user-payload.interface';

export const CurrentUser = createParamDecorator(
  <K extends keyof ValidatedUserPayload>(
    prop: K | undefined,
    ctx: ExecutionContext,
  ): ValidatedUserPayload | ValidatedUserPayload[K] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as ValidatedUserPayload | undefined;

    if (!user) throw new UnauthorizedException('User not found in request');

    return prop ? user[prop] : user;
  },
);
