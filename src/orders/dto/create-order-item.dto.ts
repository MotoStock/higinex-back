import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
