import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { UpdateCustomerAdminDto } from 'src/customers/dto/update-customer-admin.dto';

export class UpdateUserDto {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateCustomerAdminDto)
    customer?: UpdateCustomerAdminDto;
}
