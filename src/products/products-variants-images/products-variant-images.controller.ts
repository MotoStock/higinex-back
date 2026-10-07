import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateProductVariantImageDto } from './dto/create-product-variant-image.dto';
import { UpdateProductVariantImageDto } from './dto/update-product-variant-image.dto';
import { ProductVariantImagesService } from './products-variant-images.service';

@Controller('products/variants/:variantId/images')
export class ProductVariantImagesController {
  constructor(
    private readonly productVariantImagesService: ProductVariantImagesService,
  ) { }

  @Post()
  @Auth('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  create(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateProductVariantImageDto,
  ) {
    return this.productVariantImagesService.createVariantImage(
      variantId,
      file,
      dto,
    );
  }

  @Get()
  list(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productVariantImagesService.listVariantImages(variantId);
  }

  @Get(':imageId')
  async getFile(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const image = await this.productVariantImagesService.getVariantImageFile(
      variantId,
      imageId,
    );

    res.setHeader('Content-Type', image.mimeType);
    if (image.filename) {
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(image.filename)}"`,
      );
    }

    return new StreamableFile(Buffer.from(image.data));
  }

  @Patch(':imageId')
  @Auth('ADMIN')
  update(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateProductVariantImageDto,
  ) {
    return this.productVariantImagesService.updateVariantImage(
      variantId,
      imageId,
      dto,
    );
  }

  @Delete(':imageId')
  @Auth('ADMIN')
  remove(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productVariantImagesService.deleteVariantImage(
      variantId,
      imageId,
    );
  }
  @Patch(':imageId/default')
  @Auth('ADMIN')
  setDefault(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productVariantImagesService.setVariantImageAsDefault(
      variantId,
      imageId,
    );
  }
}
