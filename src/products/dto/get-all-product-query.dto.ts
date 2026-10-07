import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { LowerTrim } from 'src/common/decorators/transforms.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export enum ProductStatusParam {
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  ALL = 'all',
}

export class GetAllProductQueryDto extends PartialType(PaginationQueryDto) {
  @IsOptional()
  @LowerTrim()
  @IsEnum(ProductStatusParam)
  status?: ProductStatusParam = ProductStatusParam.PUBLISHED;
}
