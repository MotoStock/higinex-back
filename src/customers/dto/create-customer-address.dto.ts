import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(100)
  label?: string;

  @IsString()
  @Trim()
  @MaxLength(200)
  line1: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(200)
  line2?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(100)
  neighborhood?: string;

  @IsString()
  @Trim()
  @MaxLength(100)
  city: string;

  @IsString()
  @Trim()
  @MaxLength(100)
  state: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
