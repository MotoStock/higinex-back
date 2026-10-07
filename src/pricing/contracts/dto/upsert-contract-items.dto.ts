import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ContractItemInputDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(0)
  unitPriceCop: number;
}

export class UpsertContractItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ContractItemInputDto)
  items: ContractItemInputDto[];
}
