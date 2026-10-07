import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class GetFinanceSummaryQueryDto {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    from?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    to?: Date;
}
