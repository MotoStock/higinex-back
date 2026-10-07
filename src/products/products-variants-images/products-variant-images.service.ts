import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductVariantImageDto } from './dto/create-product-variant-image.dto';
import { UpdateProductVariantImageDto } from './dto/update-product-variant-image.dto';

@Injectable()
export class ProductVariantImagesService {
  private readonly logger = new Logger(ProductVariantImagesService.name);
  constructor(private readonly prisma: PrismaService) { }

  async createVariantImage(
    variantId: string,
    file: Express.Multer.File | undefined,
    dto: CreateProductVariantImageDto,
  ) {
    try {
      if (!file) throw new BadRequestException('Missing file');
      if (!file.mimetype?.startsWith('image/'))
        throw new BadRequestException('Only image uploads are allowed');

      const bytes = Uint8Array.from(file.buffer);

      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, deletedAt: null },
        select: { id: true },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      const count = await this.prisma.productImage.count({
        where: { variantId },
      });

      return await this.prisma.productImage.create({
        data: {
          variantId,
          data: bytes,
          mimeType: file.mimetype,
          altText: dto.altText,
          isDefault: count === 0,
        },
        select: {
          id: true,
          altText: true,
          isDefault: true,
          createdAt: true,
          mimeType: true,
          filename: true,
          variantId: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductVariantImagesService.createVariantImage',
        defaultMessage: 'Failed to create variant image',
      });
    }
  }

  async listVariantImages(variantId: string) {
    try {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, deletedAt: null },
        select: { id: true },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      return await this.prisma.productImage.findMany({
        where: { variantId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          altText: true,
          isDefault: true,
          createdAt: true,
          mimeType: true,
          filename: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductVariantImagesService.listVariantImages',
        defaultMessage: 'Failed to list variant images',
      });
    }
  }

  async getVariantImageFile(variantId: string, imageId: string) {
    try {
      const image = await this.prisma.productImage.findFirst({
        where: { id: imageId, variantId },
        select: { data: true, mimeType: true, filename: true },
      });
      if (!image) throw new NotFoundException('Image not found');
      return image;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductVariantImagesService.getVariantImageFile',
        defaultMessage: 'Failed to get variant image',
      });
    }
  }

  async updateVariantImage(
    variantId: string,
    imageId: string,
    dto: UpdateProductVariantImageDto,
  ) {
    try {
      const updated = await this.prisma.productImage.updateMany({
        where: { id: imageId, variantId },
        data: {
          ...(typeof dto.altText === 'string' ? { altText: dto.altText } : {}),
        },
      });

      if (updated.count === 0) throw new NotFoundException('Image not found');

      return { message: 'Variant image updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductVariantImagesService.updateVariantImage',
        defaultMessage: 'Failed to update variant image',
      });
    }
  }

  async deleteVariantImage(variantId: string, imageId: string) {
    try {
      const deleted = await this.prisma.productImage.deleteMany({
        where: { id: imageId, variantId },
      });

      if (deleted.count === 0) throw new NotFoundException('Image not found');

      return { message: 'Variant image deleted successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductVariantImagesService.deleteVariantImage',
        defaultMessage: 'Failed to delete variant image',
      });
    }
  }

  async setVariantImageAsDefault(variantId: string, imageId: string) {
    try {
      // Verify image exists and belongs to variant
      const image = await this.prisma.productImage.findFirst({
        where: { id: imageId, variantId },
      });

      if (!image) throw new NotFoundException('Image not found');

      // Transaction to unset current default and set new default
      await this.prisma.$transaction([
        this.prisma.productImage.updateMany({
          where: { variantId, isDefault: true },
          data: { isDefault: false },
        }),
        this.prisma.productImage.update({
          where: { id: imageId },
          data: { isDefault: true },
        }),
      ]);

      return { message: 'Variant image set as default successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'ProductVariantImagesService.setVariantImageAsDefault',
        defaultMessage: 'Failed to set variant image as default',
      });
    }
  }
}
