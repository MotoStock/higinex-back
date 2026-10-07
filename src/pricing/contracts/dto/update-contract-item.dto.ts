import { IsInt, Min } from 'class-validator';

export class UpdateContractItemDto {
  @IsInt()
  @Min(0)
  unitPriceCop: number;
}
