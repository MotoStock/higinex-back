import { ReturnStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class UpdateReturnRequestDto {
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @IsString()
  @Trim({ emptyToUndefined: true })
  @MaxLength(1000)
  internalNotes?: string;
}
