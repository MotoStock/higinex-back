import {
  IsArray,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DemoOrderItemDto {
  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  total: number;
}

class DemoOrderDto {
  @IsString()
  orderNumber: string;

  @IsString()
  customerName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DemoOrderItemDto)
  items: DemoOrderItemDto[];

  @IsNumber()
  subtotal: number;

  @IsNumber()
  @IsOptional()
  tax?: number;

  @IsNumber()
  total: number;

  @IsString()
  @IsOptional()
  shippingAddress?: string;
}

export class SendDemoInvoiceDto {
  @IsEmail()
  demoEmail: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DemoOrderDto)
  order: DemoOrderDto;
}
