import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';

export enum ReportType {
  PAYMENTS = 'payments',
  REFUNDS = 'refunds',
  SUMMARY = 'summary',
}

export enum ReportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export class GetFinanceReportQueryDto {
  @IsNotEmpty()
  @IsEnum(ReportType)
  type: ReportType;

  @IsNotEmpty()
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  to: Date;
}
