import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) { }

  async listUsers({
    limit = 10,
    offset = 0,
    q,
    role,
    isActive,
    hasCustomer,
  }: GetUsersQueryDto) {
    try {
      const query = q?.trim();
      const roleFilter = this.parseRole(role);
      const isActiveFilter = this.parseBoolean(isActive);
      const hasCustomerFilter = this.parseBoolean(hasCustomer);

      const where: Prisma.UserWhereInput = {
        deletedAt: null,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
        ...(hasCustomerFilter !== undefined
          ? {
            customer: hasCustomerFilter
              ? { isNot: null }
              : { is: null },
          }
          : {}),
        ...(query
          ? {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              {
                customer: {
                  is: {
                    name: { contains: query, mode: 'insensitive' },
                  },
                },
              },
              {
                customer: {
                  is: {
                    phone: { contains: query, mode: 'insensitive' },
                  },
                },
              },
              {
                customer: {
                  is: {
                    documentNumber: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
          : {}),
      };

      const users = await this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              documentType: true,
              documentNumber: true,
              createdAt: true,
            },
          },
        },
      });

      return users;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'UsersService.listUsers',
        defaultMessage: 'Failed to list users',
      });
    }
  }

  async getUser(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              documentType: true,
              documentNumber: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) throw new NotFoundException('User not found');

      return user;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'UsersService.getUser',
        defaultMessage: 'Failed to get user',
      });
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });

      if (!user) throw new NotFoundException('User not found');

      await this.prisma.$transaction(async (tx) => {
        if (
          updateUserDto.role !== undefined ||
          updateUserDto.isActive !== undefined
        ) {
          await tx.user.update({
            where: { id: userId },
            data: {
              role: updateUserDto.role,
              isActive: updateUserDto.isActive,
            },
          });
        }

        if (updateUserDto.customer) {
          await tx.customer.updateMany({
            where: { userId },
            data: updateUserDto.customer,
          });
        }
      });

      return { message: 'User updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'UsersService.updateUser',
        defaultMessage: 'Failed to update user',
      });
    }
  }

  async setUserActive(userId: string, isActive: boolean) {
    try {
      const updated = await this.prisma.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: { isActive },
      });

      if (updated.count === 0) throw new NotFoundException('User not found');

      return {
        message: isActive
          ? 'User activated successfully'
          : 'User deactivated successfully',
      };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'UsersService.setUserActive',
        defaultMessage: 'Failed to update user status',
      });
    }
  }

  async deleteUser(userId: string) {
    try {
      const updated = await this.prisma.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: { deletedAt: new Date(), isActive: false },
      });

      if (updated.count === 0) throw new NotFoundException('User not found');

      return { message: 'User deleted successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'UsersService.deleteUser',
        defaultMessage: 'Failed to delete user',
      });
    }
  }

  private parseRole(value?: string) {
    if (!value) return undefined;
    const normalized = value.trim().toUpperCase();
    return Object.values(Role).includes(normalized as Role)
      ? (normalized as Role)
      : undefined;
  }

  private parseBoolean(value?: string) {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return undefined;
  }
}
