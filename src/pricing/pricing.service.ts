import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getVariantPriceForUser(userId: string, variantId: string) {
    try {
      const [price] = await this.getVariantPricesForUserWithTransaction(
        this.prisma,
        userId,
        [variantId],
      );

      if (!price) throw new NotFoundException('Price not found for variant');

      return price;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'PricingService.getVariantPriceForUser',
        defaultMessage: 'Failed to get variant price',
      });
    }
  }

  async getVariantPricesForUser(
    userId: string,
    variantIds: string[],
  ): Promise<Array<{ variantId: string; unitPriceCop: number }>> {
    try {
      return await this.getVariantPricesForUserWithTransaction(
        this.prisma,
        userId,
        variantIds,
      );
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'PricingService.getVariantPricesForUser',
        defaultMessage: 'Failed to get variant prices',
      });
    }
  }

  async getVariantPricesForUserOrNull(
    userId: string,
    variantIds: string[],
  ): Promise<Map<string, number | null>> {
    try {
      const uniqueIds = Array.from(
        new Set(variantIds.filter((id) => typeof id === 'string' && id.trim())),
      );

      if (uniqueIds.length === 0) return new Map();

      const customer = await this.prisma.customer.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true },
      });

      if (!customer) {
        return new Map(uniqueIds.map((variantId) => [variantId, null]));
      }

      const now = new Date();
      const contract = await this.prisma.contract.findFirst({
        where: {
          customerId: customer.id,
          isActive: true,
          deletedAt: null,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (!contract) {
        return new Map(uniqueIds.map((variantId) => [variantId, null]));
      }

      const items = await this.prisma.contractItem.findMany({
        where: {
          contractId: contract.id,
          variantId: { in: uniqueIds },
        },
        select: { variantId: true, unitPriceCop: true },
      });

      const byVariantId = new Map(
        items.map((item) => [item.variantId, item.unitPriceCop]),
      );

      return new Map(
        uniqueIds.map((variantId) => [
          variantId,
          byVariantId.get(variantId) ?? null,
        ]),
      );
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'PricingService.getVariantPricesForUserOrNull',
        defaultMessage: 'Failed to get variant prices',
      });
    }
  }

  async getVariantPricesForUserWithTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    variantIds: string[],
  ): Promise<Array<{ variantId: string; unitPriceCop: number }>> {
    const customer = await tx.customer.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Customer profile not found for user');
    }

    return await this.getVariantPricesForCustomerWithTransaction(
      tx,
      customer.id,
      variantIds,
    );
  }

  async getVariantPricesForCustomerWithTransaction(
    tx: Prisma.TransactionClient,
    customerId: string,
    variantIds: string[],
  ): Promise<Array<{ variantId: string; unitPriceCop: number }>> {
    const uniqueIds = Array.from(
      new Set(variantIds.filter((id) => typeof id === 'string' && id.trim())),
    );

    if (uniqueIds.length === 0) {
      throw new BadRequestException('Variant ids are required');
    }

    const now = new Date();
    const contract = await tx.contract.findFirst({
      where: {
        customerId,
        isActive: true,
        deletedAt: null,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!contract) throw new NotFoundException('Active contract not found');

    const items = await tx.contractItem.findMany({
      where: {
        contractId: contract.id,
        variantId: { in: uniqueIds },
      },
      select: { variantId: true, unitPriceCop: true },
    });

    const byVariantId = new Map(
      items.map((item) => [item.variantId, item.unitPriceCop]),
    );
    const missing = uniqueIds.filter((id) => !byVariantId.has(id));

    if (missing.length > 0) {
      throw new NotFoundException(
        `Price not found for variants: ${missing.join(', ')}`,
      );
    }

    return uniqueIds.map((variantId) => ({
      variantId,
      unitPriceCop: byVariantId.get(variantId)!,
    }));
  }
}
