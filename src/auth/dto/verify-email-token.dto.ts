import { IsString, MinLength } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class VerifyEmailTokenDto {
  @IsString()
  @MinLength(20)
  @Trim()
  token: string;
}
