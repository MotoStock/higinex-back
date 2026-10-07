import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  NotEquals,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class AdjustInventoryDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @NotEquals(0)
  quantity: number;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(200)
  reason?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(1000)
  notes?: string;
}
