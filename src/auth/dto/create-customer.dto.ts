import { DocumentType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LowerTrim, Trim } from 'src/common/decorators/transforms.decorator';

export class CreateCustomerDto {
  @IsEmail()
  @LowerTrim()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @LowerTrim()
  name: string;

  @IsString()
  @Matches(/^\+?\d{7,15}$/, {
    message:
      'phone must be a valid phone number (e.g., 3001234567 or +573001234567)',
  })
  @Trim()
  phone: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @Matches(/^\d+(-\d+)?$/, {
    message: 'documentNumber must contain only numbers',
  })
  @MinLength(5)
  @MaxLength(20)
  @Trim()
  documentNumber: string;
}
