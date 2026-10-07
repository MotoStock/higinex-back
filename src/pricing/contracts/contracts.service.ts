import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { UpsertContractItemsDto } from './dto/upsert-contract-items.dto';
import { UpdateContractItemDto } from './dto/update-contract-item.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createContract(
    customerId: string,
    createContractDto: CreateContractDto,
  ) {
    try {
      const now = new Date();
      const startsAt = createContractDto.startsAt
        ? new Date(createContractDto.startsAt)
        : now;
      const endsAt = createContractDto.endsAt
        ? new Date(createContractDto.endsAt)
        : undefined;

      if (endsAt && endsAt.getTime() < startsAt.getTime())
        throw new BadRequestException('endsAt must be after startsAt');

      return await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findFirst({
          where: { id: customerId, deletedAt: null },
          select: { id: true },
        });

        if (!customer) throw new NotFoundException('Customer not found');

        await tx.contract.updateMany({
          where: { customerId, isActive: true, deletedAt: null },
          data: { isActive: false, endsAt: now },
        });

        return await tx.contract.create({
          data: {
            customerId,
            isActive: true,
            startsAt,
            ...(endsAt ? { endsAt } : {}),
          },
          include: { items: true },
        });
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.createContract',
        defaultMessage: 'Failed to create contract',
      });
    }
  }

  async upsertContractItems(
    contractId: string,
    upsertContractItemsDto: UpsertContractItemsDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const contract = await tx.contract.findFirst({
          where: { id: contractId, deletedAt: null },
          select: { id: true },
        });
        if (!contract) throw new NotFoundException('Contract not found');

        const requestedVariantIds = Array.from(
          new Set(upsertContractItemsDto.items.map((i) => i.variantId)),
        );

        const existingVariants = await tx.productVariant.findMany({
          where: {
            id: { in: requestedVariantIds },
            deletedAt: null,
          },
          select: { id: true },
        });

        if (existingVariants.length !== requestedVariantIds.length)
          throw new BadRequestException(
            'One or more variants do not exist or are deleted',
          );

        for (const item of upsertContractItemsDto.items) {
          await tx.contractItem.upsert({
            where: {
              contractId_variantId: { contractId, variantId: item.variantId },
            },
            create: {
              contractId,
              variantId: item.variantId,
              unitPriceCop: item.unitPriceCop,
            },
            update: { unitPriceCop: item.unitPriceCop },
          });
        }

        return await tx.contractItem.findMany({
          where: { contractId },
          orderBy: { updatedAt: 'desc' },
        });
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.upsertContractItems',
        defaultMessage: 'Failed to upsert contract items',
      });
    }
  }

  async listContractItems(contractId: string) {
    try {
      const contract = await this.prisma.contract.findFirst({
        where: { id: contractId, deletedAt: null },
        select: { id: true },
      });

      if (!contract) throw new NotFoundException('Contract not found');

      return await this.prisma.contractItem.findMany({
        where: { contractId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          variantId: true,
          unitPriceCop: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.listContractItems',
        defaultMessage: 'Failed to list contract items',
      });
    }
  }

  async updateContractItem(
    contractId: string,
    variantId: string,
    dto: UpdateContractItemDto,
  ) {
    try {
      const contract = await this.prisma.contract.findFirst({
        where: { id: contractId, deletedAt: null },
        select: { id: true },
      });

      if (!contract) throw new NotFoundException('Contract not found');

      const updated = await this.prisma.contractItem.updateMany({
        where: { contractId, variantId },
        data: { unitPriceCop: dto.unitPriceCop },
      });

      if (updated.count === 0)
        throw new NotFoundException('Contract item not found');

      return { message: 'Contract item updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.updateContractItem',
        defaultMessage: 'Failed to update contract item',
      });
    }
  }

  async deleteContractItem(contractId: string, variantId: string) {
    try {
      const contract = await this.prisma.contract.findFirst({
        where: { id: contractId, deletedAt: null },
        select: { id: true },
      });

      if (!contract) throw new NotFoundException('Contract not found');

      const deleted = await this.prisma.contractItem.deleteMany({
        where: { contractId, variantId },
      });

      if (deleted.count === 0)
        throw new NotFoundException('Contract item not found');

      return { message: 'Contract item deleted successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.deleteContractItem',
        defaultMessage: 'Failed to delete contract item',
      });
    }
  }

  async getContract(contractId: string) {
    try {
      const contract = await this.prisma.contract.findFirst({
        where: { id: contractId, deletedAt: null },
        select: {
          id: true,
          customerId: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              documentType: true,
              documentNumber: true,
            },
          },
          _count: { select: { items: true } },
        },
      });

      if (!contract) throw new NotFoundException('Contract not found');

      return contract;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.getContract',
        defaultMessage: 'Failed to get contract',
      });
    }
  }

  async updateContract(contractId: string, dto: UpdateContractDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const contract = await tx.contract.findFirst({
          where: { id: contractId, deletedAt: null },
          select: {
            id: true,
            customerId: true,
            startsAt: true,
            endsAt: true,
            isActive: true,
          },
        });

        if (!contract) throw new NotFoundException('Contract not found');

        const now = new Date();
        const nextStartsAt = dto.startsAt
          ? new Date(dto.startsAt)
          : contract.startsAt;
        let nextEndsAt = dto.endsAt
          ? new Date(dto.endsAt)
          : (contract.endsAt ?? undefined);

        if (nextEndsAt && nextEndsAt.getTime() < nextStartsAt.getTime()) {
          throw new BadRequestException('endsAt must be after startsAt');
        }

        if (dto.isActive === false && !nextEndsAt) {
          nextEndsAt = now;
        }

        if (dto.isActive === true) {
          await tx.contract.updateMany({
            where: {
              customerId: contract.customerId,
              isActive: true,
              deletedAt: null,
              id: { not: contract.id },
            },
            data: { isActive: false, endsAt: now },
          });
        }

        const updated = await tx.contract.update({
          where: { id: contract.id },
          data: {
            ...(dto.startsAt ? { startsAt: nextStartsAt } : {}),
            ...(dto.endsAt || (dto.isActive === false && nextEndsAt)
              ? { endsAt: nextEndsAt }
              : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          },
          include: { items: true },
        });

        return updated;
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.updateContract',
        defaultMessage: 'Failed to update contract',
      });
    }
  }

  async deleteContract(contractId: string) {
    try {
      const contract = await this.prisma.contract.findFirst({
        where: { id: contractId, deletedAt: null },
        select: { id: true, endsAt: true },
      });

      if (!contract) throw new NotFoundException('Contract not found');

      const now = new Date();
      const updated = await this.prisma.contract.updateMany({
        where: { id: contractId, deletedAt: null },
        data: {
          deletedAt: now,
          isActive: false,
          ...(contract.endsAt ? {} : { endsAt: now }),
        },
      });

      if (updated.count === 0)
        throw new NotFoundException('Contract not found');

      return { message: 'Contract deleted successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ContractsService.deleteContract',
        defaultMessage: 'Failed to delete contract',
      });
    }
  }
}
