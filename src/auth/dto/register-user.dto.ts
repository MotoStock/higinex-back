import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LowerTrim, Trim } from 'src/common/decorators/transforms.decorator';
import { CreateCustomerDto } from './create-customer.dto';

export class RegisterUserDto {
  @IsEmail()
  @LowerTrim()
  email: string;

  @IsString()
  @MaxLength(20)
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'The password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @Trim()
  password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;
}
