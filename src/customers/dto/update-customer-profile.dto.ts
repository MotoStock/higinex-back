import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class UpdateCustomerProfileDto {
    @IsOptional()
    @IsEmail()
    @Trim()
    email?: string;

    @IsOptional()
    @IsString()
    @Trim()
    phone?: string;
}
