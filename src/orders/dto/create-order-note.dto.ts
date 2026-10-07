import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';

export class CreateOrderNoteDto {
  @IsOptional()
  @IsIn(['INTERNAL', 'CUSTOMER'])
  visibility?: string = 'INTERNAL';

  @IsString()
  @Trim()
  @MaxLength(2000)
  message: string;
}
