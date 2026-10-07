import { IsEmail, IsString } from 'class-validator';

export class NotifyDemoStatusDto {
  @IsEmail()
  demoEmail: string;

  @IsString()
  orderNumber: string;

  @IsString()
  oldStatus: string;

  @IsString()
  newStatus: string;
}
