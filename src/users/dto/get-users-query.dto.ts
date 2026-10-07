import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetUsersQueryDto extends PartialType(PaginationQueryDto) {
  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(20)
  role?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(10)
  isActive?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(10)
  hasCustomer?: string;
}
