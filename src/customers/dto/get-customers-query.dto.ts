import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { LowerTrim } from 'src/common/decorators/transforms.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetCustomersQueryDto extends PartialType(PaginationQueryDto) {
  @IsOptional()
  @IsString()
  @LowerTrim({ emptyToUndefined: true })
  q?: string;
}
