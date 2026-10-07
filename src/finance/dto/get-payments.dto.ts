import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetFinancePaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  orderId?: string;

  @IsOptional()
  customerId?: string;
}
