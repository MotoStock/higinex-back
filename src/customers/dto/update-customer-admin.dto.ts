import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class UpdateCustomerAdminDto {
    @IsOptional()
    @IsString()
    @Trim()
    name?: string;

    @IsOptional()
    @IsString()
    @Trim()
    email?: string;

    @IsOptional()
    @IsString()
    @Trim()
    phone?: string;

    @IsOptional()
    @IsEnum(DocumentType)
    documentType?: DocumentType;

    @IsOptional()
    @IsString()
    @Trim()
    documentNumber?: string;
}
