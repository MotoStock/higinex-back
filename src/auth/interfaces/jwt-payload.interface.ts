import type { Role } from '@prisma/client';

export interface UserJwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface RefreshJwtPayload {
  sub: string;
  tokenType: 'refresh';
  jti: string;
}
