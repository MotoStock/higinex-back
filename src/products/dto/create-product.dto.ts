import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { LowerTrim, Trim } from 'src/common/decorators/transforms.decorator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @LowerTrim()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase and contain only letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @Trim()
  @MaxLength(2000)
  @IsNotEmpty()
  description?: string;
}
