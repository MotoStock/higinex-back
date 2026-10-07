import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LowerTrim, Trim } from 'src/common/decorators/transforms.decorator';

export class ResetPasswordDto {
  @IsEmail()
  @LowerTrim()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'The code must be a 6-digit number',
  })
  @Trim()
  code: string;

  @IsString()
  @MaxLength(20)
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'The password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @Trim()
  newPassword: string;
}
