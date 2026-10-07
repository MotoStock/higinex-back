import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetInventoryBalancesQueryDto extends PartialType(
  PaginationQueryDto,
) {
  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(120)
  q?: string;
}
