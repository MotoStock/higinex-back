import { ShipmentStatus } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateShipmentDto {
  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(120)
  carrierName?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(120)
  trackingNumber?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  trackingUrl?: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingCostAmount?: number;
}
