import {
    IsString,
    Matches,
    MaxLength,
    MinLength
} from 'class-validator';
import { Trim } from 'src/common/decorators/transforms.decorator';


export class ChangePasswordDto {
    @IsString()
    @MaxLength(20)
    @MinLength(8)
    @Trim()
    currentPassword: string;

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
