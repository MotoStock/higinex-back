import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PricingService } from 'src/pricing/pricing.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductStatusParam } from '../dto/get-all-product-query.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import {
  GetAllProductVariantsQueryDto,
  VariantStatusParam,
} from './dto/get-all-product-variants-query.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductsVariantsService {
  private readonly logger = new Logger(ProductsVariantsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) { }

  async createProductVariant(
    productId: string,
    createProductVariantDto: CreateProductVariantDto,
  ) {
    try {
      const { sku, gtin, name, attributesJson, initialOnHand } =
        createProductVariantDto;

      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findFirst({
          where: { id: productId, deletedAt: null },
          select: { id: true },
        });

        if (!product) throw new NotFoundException('Product not found');

        const variant = await tx.productVariant.create({
          data: {
            productId,
            sku,
            gtin,
            name,
            attributesJson,
          },
        });

        await tx.inventoryBalance.create({
          data: {
            variantId: variant.id,
            onHand: 0,
          },
        });

        if (typeof initialOnHand === 'number' && initialOnHand > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: 'IN',
              quantity: initialOnHand,
              reason: 'Initial stock',
            },
          });

          await tx.inventoryBalance.update({
            where: { variantId: variant.id },
            data: {
              onHand: { increment: initialOnHand },
            },
          });
        }

        return await tx.productVariant.findUnique({
          where: { id: variant.id },
          include: { inventory: true },
        });
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsVariantsService.createProductVariant',
        defaultMessage: 'Failed to create product variant',
      });
    }
  }

  async getProductVariant(userId: string, variantId: string) {
    try {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, deletedAt: null },
        select: {
          id: true,
          productId: true,
          sku: true,
          gtin: true,
          name: true,
          attributesJson: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          images: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              altText: true,
              isDefault: true,
              createdAt: true,
              mimeType: true,
              filename: true,
            },
          },
          inventory: {
            select: { onHand: true, reserved: true, updatedAt: true },
          },
        },
      });

      if (!variant) throw new NotFoundException('Variant not found');

      const priceByVariant =
        await this.pricingService.getVariantPricesForUserOrNull(userId, [
          variantId,
        ]);

      return {
        ...variant,
        unitPriceCop: priceByVariant.get(variantId) ?? null,
      };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsVariantsService.getProductVariant',
        defaultMessage: 'Failed to get product variant',
      });
    }
  }

  async listAllVariants(
    userId: string,
    {
      status = VariantStatusParam.ACTIVE,
      productStatus = ProductStatusParam.PUBLISHED,
      limit = 10,
      offset = 0,
    }: GetAllProductVariantsQueryDto,
  ) {
    try {
      const variants = await this.prisma.productVariant.findMany({
        where: {
          deletedAt: null,
          ...(status === VariantStatusParam.ALL
            ? {}
            : { isActive: status === VariantStatusParam.ACTIVE }),
          product: {
            deletedAt: null,
            ...(productStatus === ProductStatusParam.ALL
              ? {}
              : {
                status:
                  productStatus === ProductStatusParam.PUBLISHED
                    ? ProductStatus.PUBLISHED
                    : ProductStatus.ARCHIVED,
              }),
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          productId: true,
          sku: true,
          gtin: true,
          name: true,
          attributesJson: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
          images: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              altText: true,
              isDefault: true,
              createdAt: true,
              mimeType: true,
              filename: true,
            },
          },
          inventory: {
            select: { onHand: true, reserved: true, updatedAt: true },
          },
        },
      });

      if (variants.length === 0) return variants;

      const priceByVariant =
        await this.pricingService.getVariantPricesForUserOrNull(
          userId,
          variants.map((variant) => variant.id),
        );

      return variants.map((variant) => ({
        ...variant,
        unitPriceCop: priceByVariant.get(variant.id) ?? null,
      }));
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsVariantsService.listAllVariants',
        defaultMessage: 'Failed to list product variants',
      });
    }
  }

  async updateProductVariant(variantId: string, dto: UpdateProductVariantDto) {
    try {
      const updated = await this.prisma.productVariant.updateMany({
        where: { id: variantId, deletedAt: null },
        data: dto,
      });

      if (updated.count === 0) throw new NotFoundException('Variant not found');

      return { message: 'Variant updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsVariantsService.updateProductVariant',
        defaultMessage: 'Failed to update product variant',
      });
    }
  }

  async setVariantActive(variantId: string, isActive: boolean) {
    try {
      const updated = await this.prisma.productVariant.updateMany({
        where: { id: variantId, deletedAt: null },
        data: { isActive },
      });

      if (updated.count === 0) throw new NotFoundException('Variant not found');

      return {
        message: isActive
          ? 'Variant activated successfully'
          : 'Variant deactivated successfully',
      };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsVariantsService.setVariantActive',
        defaultMessage: 'Failed to update variant status',
      });
    }
  }

  async deleteProductVariant(variantId: string) {
    try {
      const updated = await this.prisma.productVariant.updateMany({
        where: { id: variantId, deletedAt: null },
        data: { deletedAt: new Date(), isActive: false },
      });

      if (updated.count === 0) throw new NotFoundException('Variant not found');

      return { message: 'Variant deleted successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsVariantsService.deleteProductVariant',
        defaultMessage: 'Failed to delete product variant',
      });
    }
  }
}
