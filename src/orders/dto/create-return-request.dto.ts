import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ReturnReason } from '@prisma/client';
import { Trim } from 'src/common/decorators/transforms.decorator';
import { CreateReturnItemDto } from './create-return-item.dto';

export class CreateReturnRequestDto {
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(1000)
  customerNotes?: string;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(1000)
  internalNotes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];
}
