import { IsEmail, IsIn, IsString } from 'class-validator';

export class DemoLoginDto {
  @IsIn(['admin', 'user'])
  type: 'admin' | 'user';

  @IsEmail()
  @IsString()
  email: string;
}
