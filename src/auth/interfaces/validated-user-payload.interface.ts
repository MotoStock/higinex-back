import type { Role } from '@prisma/client';

export interface ValidatedUserPayload {
  id: string;
  email: string;
  isActive: boolean;
  role: Role;
  customer?: object;
}
