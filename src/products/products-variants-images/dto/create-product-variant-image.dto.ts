import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateProductVariantImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Trim()
  altText?: string;


}
