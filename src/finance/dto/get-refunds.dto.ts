import { RefundMethod, RefundStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetFinanceRefundsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsEnum(RefundMethod)
  method?: RefundMethod;

  @IsOptional()
  orderId?: string;

  @IsOptional()
  customerId?: string;
}
