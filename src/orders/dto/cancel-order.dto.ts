import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(500)
  comment?: string;
}
