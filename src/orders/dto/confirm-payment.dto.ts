import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class ConfirmPaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  reference?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  notes?: string;
}
