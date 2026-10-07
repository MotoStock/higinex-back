import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  InventoryAvailability,
  InventoryItemInput,
  InventoryOperationOptions,
  InventoryOperationResult,
  LockedBalance,
} from './dto/inventory.interface';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(variantIds: string[]) {
    try {
      if (!Array.isArray(variantIds) || variantIds.length === 0) {
        throw new BadRequestException('Variant ids are required');
      }

      const uniqueIds = Array.from(
        new Set(variantIds.filter((id) => typeof id === 'string' && id.trim())),
      );

      if (uniqueIds.length === 0) {
        throw new BadRequestException('Variant ids are required');
      }

      const balances = await this.prisma.inventoryBalance.findMany({
        where: { variantId: { in: uniqueIds } },
        select: {
          variantId: true,
          onHand: true,
          reserved: true,
        },
      });

      const byId = new Map(
        balances.map((balance) => [balance.variantId, balance]),
      );
      const missing = uniqueIds.filter((id) => !byId.has(id));

      if (missing.length > 0) {
        throw new NotFoundException(
          `Inventory not found for variants: ${missing.join(', ')}`,
        );
      }

      return uniqueIds.map((variantId) => {
        const balance = byId.get(variantId)!;
        return {
          variantId,
          onHand: balance.onHand,
          reserved: balance.reserved,
          available: balance.onHand - balance.reserved,
        } satisfies InventoryAvailability;
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.getAvailability',
        defaultMessage: 'Failed to get inventory availability',
      });
    }
  }

  async getSummary() {
    try {
      const aggregate = await this.prisma.inventoryBalance.aggregate({
        _sum: { onHand: true, reserved: true },
      });

      const totalOnHand = aggregate._sum.onHand ?? 0;
      const totalReserved = aggregate._sum.reserved ?? 0;

      return {
        totalOnHand,
        totalReserved,
        totalAvailable: totalOnHand - totalReserved,
      };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.getSummary',
        defaultMessage: 'Failed to get inventory summary',
      });
    }
  }

  async listBalances({
    limit = 10,
    offset = 0,
    q,
  }: {
    limit?: number;
    offset?: number;
    q?: string;
  }) {
    try {
      const query = q?.trim();
      const where: Prisma.InventoryBalanceWhereInput = {
        variant: {
          deletedAt: null,
          product: { deletedAt: null },
          ...(query
            ? {
                OR: [
                  { sku: { contains: query, mode: 'insensitive' } },
                  { gtin: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                  {
                    product: {
                      name: { contains: query, mode: 'insensitive' },
                    },
                  },
                  {
                    product: {
                      slug: { contains: query, mode: 'insensitive' },
                    },
                  },
                ],
              }
            : {}),
        },
      };

      const balances = await this.prisma.inventoryBalance.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        select: {
          variantId: true,
          onHand: true,
          reserved: true,
          updatedAt: true,
          variant: {
            select: {
              id: true,
              sku: true,
              gtin: true,
              name: true,
              isActive: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      return balances.map((balance) => ({
        variantId: balance.variantId,
        onHand: balance.onHand,
        reserved: balance.reserved,
        available: balance.onHand - balance.reserved,
        updatedAt: balance.updatedAt,
        variant: balance.variant,
      }));
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.listBalances',
        defaultMessage: 'Failed to list inventory balances',
      });
    }
  }

  async listMovements({
    limit = 10,
    offset = 0,
    variantId,
    orderId,
    type,
    dateFrom,
    dateTo,
  }: {
    limit?: number;
    offset?: number;
    variantId?: string;
    orderId?: string;
    type?: InventoryMovementType;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      const occurredAt: Prisma.DateTimeFilter = {};
      if (dateFrom) {
        occurredAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        occurredAt.lte = new Date(dateTo);
      }

      const where: Prisma.InventoryMovementWhereInput = {
        ...(variantId ? { variantId } : {}),
        ...(orderId ? { orderId } : {}),
        ...(type ? { type } : {}),
        ...(Object.keys(occurredAt).length > 0 ? { occurredAt } : {}),
      };

      return await this.prisma.inventoryMovement.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { occurredAt: 'desc' },
        select: {
          id: true,
          variantId: true,
          type: true,
          quantity: true,
          reason: true,
          notes: true,
          orderId: true,
          occurredAt: true,
          createdByUserId: true,
          createdBy: { select: { id: true, email: true } },
          variant: {
            select: {
              id: true,
              sku: true,
              gtin: true,
              name: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.listMovements',
        defaultMessage: 'Failed to list inventory movements',
      });
    }
  }

  async adjustStock(
    userId: string,
    {
      variantId,
      quantity,
      reason,
      notes,
    }: { variantId: string; quantity: number; reason?: string; notes?: string },
  ) {
    try {
      if (!Number.isInteger(quantity) || quantity === 0) {
        throw new BadRequestException('Quantity must be a non-zero integer');
      }

      return await this.prisma.$transaction(async (tx) => {
        const balance = await this.lockBalance(tx, variantId);
        const onHandAfter = balance.onHand + quantity;

        if (onHandAfter < 0) {
          throw new ConflictException('Insufficient stock for adjustment');
        }

        await tx.inventoryBalance.update({
          where: { variantId },
          data: { onHand: { increment: quantity } },
        });

        const movementType =
          quantity > 0 ? InventoryMovementType.IN : InventoryMovementType.OUT;

        await tx.inventoryMovement.create({
          data: {
            variantId,
            type: movementType,
            quantity: Math.abs(quantity),
            reason,
            notes,
            createdByUserId: userId,
          },
        });

        return {
          variantId,
          quantity,
          onHandBefore: balance.onHand,
          onHandAfter,
          reserved: balance.reserved,
          availableBefore: balance.onHand - balance.reserved,
          availableAfter: onHandAfter - balance.reserved,
        };
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.adjustStock',
        defaultMessage: 'Failed to adjust inventory',
      });
    }
  }

  async reserveStock(
    items: InventoryItemInput[],
    options: InventoryOperationOptions = {},
  ) {
    try {
      const normalized = this.normalizeItems(items);

      return await this.prisma.$transaction((tx) =>
        this.reserveStockInTransaction(tx, normalized, options),
      );
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.reserveStock',
        defaultMessage: 'Failed to reserve stock',
      });
    }
  }

  async reserveStockWithTransaction(
    tx: Prisma.TransactionClient,
    items: InventoryItemInput[],
    options: InventoryOperationOptions = {},
  ) {
    try {
      const normalized = this.normalizeItems(items);
      return await this.reserveStockInTransaction(tx, normalized, options);
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.reserveStockWithTransaction',
        defaultMessage: 'Failed to reserve stock',
      });
    }
  }

  async releaseStock(
    items: InventoryItemInput[],
    options: InventoryOperationOptions = {},
  ) {
    try {
      const normalized = this.normalizeItems(items);

      return await this.prisma.$transaction((tx) =>
        this.releaseStockInTransaction(tx, normalized, options),
      );
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.releaseStock',
        defaultMessage: 'Failed to release reserved stock',
      });
    }
  }

  async releaseStockWithTransaction(
    tx: Prisma.TransactionClient,
    items: InventoryItemInput[],
    options: InventoryOperationOptions = {},
  ) {
    try {
      const normalized = this.normalizeItems(items);
      return await this.releaseStockInTransaction(tx, normalized, options);
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.releaseStockWithTransaction',
        defaultMessage: 'Failed to release reserved stock',
      });
    }
  }

  async commitStock(
    items: InventoryItemInput[],
    options: InventoryOperationOptions = {},
  ) {
    try {
      const normalized = this.normalizeItems(items);

      return await this.prisma.$transaction((tx) =>
        this.commitStockInTransaction(tx, normalized, options),
      );
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.commitStock',
        defaultMessage: 'Failed to commit stock',
      });
    }
  }

  async commitStockWithTransaction(
    tx: Prisma.TransactionClient,
    items: InventoryItemInput[],
    options: InventoryOperationOptions = {},
  ) {
    try {
      const normalized = this.normalizeItems(items);
      return await this.commitStockInTransaction(tx, normalized, options);
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'InventoryService.commitStockWithTransaction',
        defaultMessage: 'Failed to commit stock',
      });
    }
  }

  private async reserveStockInTransaction(
    tx: Prisma.TransactionClient,
    items: InventoryItemInput[],
    options: InventoryOperationOptions,
  ) {
    const results: InventoryOperationResult['items'] = [];
    const movements: Prisma.InventoryMovementCreateManyInput[] = [];

    for (const item of items) {
      const balance = await this.lockBalance(tx, item.variantId);
      const availableBefore = balance.onHand - balance.reserved;

      if (availableBefore < item.quantity) {
        throw new ConflictException(
          `Insufficient stock for variant ${item.variantId}`,
        );
      }

      const reservedAfter = balance.reserved + item.quantity;

      await tx.inventoryBalance.update({
        where: { variantId: item.variantId },
        data: { reserved: { increment: item.quantity } },
      });

      results.push({
        variantId: item.variantId,
        quantity: item.quantity,
        onHandBefore: balance.onHand,
        onHandAfter: balance.onHand,
        reservedBefore: balance.reserved,
        reservedAfter,
        availableBefore,
        availableAfter: balance.onHand - reservedAfter,
      });

      movements.push({
        variantId: item.variantId,
        type: InventoryMovementType.RESERVED,
        quantity: item.quantity,
        reason: options.reason ?? 'RESERVE',
        notes: options.notes,
        orderId: options.orderId,
      });
    }

    if (movements.length > 0) {
      await tx.inventoryMovement.createMany({ data: movements });
    }

    return { items: results } satisfies InventoryOperationResult;
  }

  private async releaseStockInTransaction(
    tx: Prisma.TransactionClient,
    items: InventoryItemInput[],
    options: InventoryOperationOptions,
  ) {
    const results: InventoryOperationResult['items'] = [];
    const movements: Prisma.InventoryMovementCreateManyInput[] = [];

    for (const item of items) {
      const balance = await this.lockBalance(tx, item.variantId);

      if (balance.reserved < item.quantity) {
        throw new ConflictException(
          `Reserved stock is lower than requested release for variant ${item.variantId}`,
        );
      }

      const reservedAfter = balance.reserved - item.quantity;

      await tx.inventoryBalance.update({
        where: { variantId: item.variantId },
        data: { reserved: { decrement: item.quantity } },
      });

      results.push({
        variantId: item.variantId,
        quantity: item.quantity,
        onHandBefore: balance.onHand,
        onHandAfter: balance.onHand,
        reservedBefore: balance.reserved,
        reservedAfter,
        availableBefore: balance.onHand - balance.reserved,
        availableAfter: balance.onHand - reservedAfter,
      });

      movements.push({
        variantId: item.variantId,
        type: InventoryMovementType.UNRESERVED,
        quantity: item.quantity,
        reason: options.reason ?? 'RELEASE',
        notes: options.notes,
        orderId: options.orderId,
      });
    }

    if (movements.length > 0) {
      await tx.inventoryMovement.createMany({ data: movements });
    }

    return { items: results } satisfies InventoryOperationResult;
  }

  private async commitStockInTransaction(
    tx: Prisma.TransactionClient,
    items: InventoryItemInput[],
    options: InventoryOperationOptions,
  ) {
    const results: InventoryOperationResult['items'] = [];
    const movements: Prisma.InventoryMovementCreateManyInput[] = [];

    for (const item of items) {
      const balance = await this.lockBalance(tx, item.variantId);

      if (balance.reserved < item.quantity) {
        throw new ConflictException(
          `Reserved stock is lower than requested commit for variant ${item.variantId}`,
        );
      }

      if (balance.onHand < item.quantity) {
        throw new ConflictException(
          `On hand stock is lower than requested commit for variant ${item.variantId}`,
        );
      }

      const reservedAfter = balance.reserved - item.quantity;
      const onHandAfter = balance.onHand - item.quantity;

      await tx.inventoryBalance.update({
        where: { variantId: item.variantId },
        data: {
          reserved: { decrement: item.quantity },
          onHand: { decrement: item.quantity },
        },
      });

      results.push({
        variantId: item.variantId,
        quantity: item.quantity,
        onHandBefore: balance.onHand,
        onHandAfter,
        reservedBefore: balance.reserved,
        reservedAfter,
        availableBefore: balance.onHand - balance.reserved,
        availableAfter: onHandAfter - reservedAfter,
      });

      movements.push({
        variantId: item.variantId,
        type: InventoryMovementType.SOLD,
        quantity: item.quantity,
        reason: options.reason ?? 'COMMIT',
        notes: options.notes,
        orderId: options.orderId,
      });
    }

    if (movements.length > 0) {
      await tx.inventoryMovement.createMany({ data: movements });
    }

    return { items: results } satisfies InventoryOperationResult;
  }
  private normalizeItems(items: InventoryItemInput[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items are required');
    }

    const totals = new Map<string, number>();

    for (const item of items) {
      if (
        !item ||
        typeof item.variantId !== 'string' ||
        !item.variantId.trim()
      ) {
        throw new BadRequestException('Invalid variant id');
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Quantity must be a positive integer');
      }

      const current = totals.get(item.variantId) ?? 0;
      totals.set(item.variantId, current + item.quantity);
    }

    return Array.from(totals.entries())
      .map(([variantId, quantity]) => ({ variantId, quantity }))
      .sort((a, b) => a.variantId.localeCompare(b.variantId));
  }

  private async lockBalance(
    tx: Prisma.TransactionClient,
    variantId: string,
  ): Promise<LockedBalance> {
    const rows = await tx.$queryRaw<LockedBalance[]>`
      SELECT "variantId", "onHand", "reserved"
      FROM "InventoryBalance"
      WHERE "variantId" = ${variantId}
      FOR UPDATE
    `;
    const balance = rows[0];

    if (!balance) {
      throw new NotFoundException(
        `Inventory balance not found for variant ${variantId}`,
      );
    }

    return balance;
  }
}
