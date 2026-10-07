import { IsDateString } from 'class-validator';

export class GetReportQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
