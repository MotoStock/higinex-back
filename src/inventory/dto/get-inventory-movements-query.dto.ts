import { PartialType } from '@nestjs/mapped-types';
import { InventoryMovementType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetInventoryMovementsQueryDto extends PartialType(
  PaginationQueryDto,
) {
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
