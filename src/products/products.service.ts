import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  GetAllProductQueryDto,
  ProductStatusParam,
} from './dto/get-all-product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private readonly prisma: PrismaService) { }

  async createProduct(createProductDto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: createProductDto,
      });
      return product;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsService.createProduct',
        defaultMessage: 'Failed to create product',
      });
    }
  }

  async getAllProducts({
    status = ProductStatusParam.PUBLISHED,
    limit = 10,
    offset = 0,
  }: GetAllProductQueryDto) {
    try {
      return await this.prisma.product.findMany({
        where: {
          deletedAt: null,
          ...(status === ProductStatusParam.ALL
            ? {}
            : {
              status:
                status === ProductStatusParam.PUBLISHED
                  ? ProductStatus.PUBLISHED
                  : ProductStatus.ARCHIVED,
            }),
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsService.getAllProducts',
        defaultMessage: 'Failed to retrieve products',
      });
    }
  }

  async setProductPublished(id: string) {
    try {
      await this.assertProductExists(id);
      await this.prisma.product.update({
        where: { id },
        data: { status: ProductStatus.PUBLISHED },
      });
      return { message: 'Product set as published successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsService.setProductPublished',
        defaultMessage: 'Failed to set product as published',
      });
    }
  }

  async setProductArchived(id: string) {
    try {
      await this.assertProductExists(id);
      await this.prisma.product.update({
        where: { id },
        data: { status: ProductStatus.ARCHIVED },
      });
      return { message: 'Product set as archived successfully ' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsService.setProductArchived',
        defaultMessage: 'Failed to set product as archived',
      });
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    try {
      await this.assertProductExists(id);
      await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
      return { message: 'Product updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsService.updateProduct',
        defaultMessage: 'Failed to update product',
      });
    }
  }

  async listProductVariants(productId: string) {
    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
        select: { id: true },
      });

      if (!product) throw new NotFoundException('Product not found');

      return await this.prisma.productVariant.findMany({
        where: { productId, deletedAt: null, isActive: true },
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
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductsService.listProductVariants',
        defaultMessage: 'Failed to list product variants',
      });
    }
  }

  private async assertProductExists(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) throw new NotFoundException('Product not found');
  }
}
