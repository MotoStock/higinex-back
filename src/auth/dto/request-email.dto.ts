import { IsEmail } from 'class-validator';
import { LowerTrim } from 'src/common/decorators/transforms.decorator';

export class RequestEmailDto {
  @IsEmail()
  @LowerTrim()
  email: string;
}
