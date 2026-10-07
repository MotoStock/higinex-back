import { PartialType } from '@nestjs/mapped-types';
import { OrderStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetOrdersQueryDto extends PartialType(PaginationQueryDto) {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(50)
  orderNumber?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(10)
  includeCount?: string;
}
