import { RefundMethod, RefundStatus } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateRefundDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsEnum(RefundMethod)
  method: RefundMethod;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(1000)
  notes?: string;
}
