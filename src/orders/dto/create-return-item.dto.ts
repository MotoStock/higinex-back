import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateReturnItemDto {
  @IsUUID()
  orderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsBoolean()
  restock?: boolean;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(120)
  restockCondition?: string;
}
