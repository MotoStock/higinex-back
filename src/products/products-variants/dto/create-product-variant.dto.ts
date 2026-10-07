import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Trim()
  sku: string;

  @IsOptional()
  @IsString()
  @Trim()
  gtin?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Trim()
  name: string;

  @IsOptional()
  @IsObject()
  attributesJson?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialOnHand?: number;
}
