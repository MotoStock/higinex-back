import { IsDateString, IsOptional } from 'class-validator';

export class CreateContractDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
