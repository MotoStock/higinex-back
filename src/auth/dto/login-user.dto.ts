import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LowerTrim, Trim } from 'src/common/decorators/transforms.decorator';

export class LoginUserDto {
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
}
