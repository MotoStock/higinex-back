import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { LowerTrim } from 'src/common/decorators/transforms.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ProductStatusParam } from 'src/products/dto/get-all-product-query.dto';

export enum VariantStatusParam {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
}

export class GetAllProductVariantsQueryDto extends PartialType(
  PaginationQueryDto,
) {
  @IsOptional()
  @LowerTrim()
  @IsEnum(VariantStatusParam)
  status?: VariantStatusParam = VariantStatusParam.ACTIVE;

  @IsOptional()
  @LowerTrim()
  @IsEnum(ProductStatusParam)
  productStatus?: ProductStatusParam = ProductStatusParam.PUBLISHED;
}
