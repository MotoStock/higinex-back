import { PartialType } from '@nestjs/mapped-types';
import { CreateProductVariantImageDto } from './create-product-variant-image.dto';

export class UpdateProductVariantImageDto extends PartialType(
  CreateProductVariantImageDto,
) {}
