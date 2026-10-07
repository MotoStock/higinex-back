import { Prisma } from '@prisma/client';

export type NormalizedOrderItem = {
  variantId: string;
  quantity: number;
};

export type VariantSnapshot = {
  id: string;
  sku: string;
  gtin: string | null;
  name: string;
  product: { name: string };
};

export type OrderItemSnapshot = {
  variantId: string;
  skuSnapshot: string | null;
  gtinSnapshot: string | null;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitPriceAmount: Prisma.Decimal;
  quantity: number;
  lineTotalAmount: Prisma.Decimal;
};

export type OrderCreateInputWithoutNumber = Omit<
  Prisma.OrderCreateInput,
  'orderNumber'
>;
