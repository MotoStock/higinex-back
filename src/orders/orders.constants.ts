import { OrderStatus } from '@prisma/client';

export const PENDING_RESERVATION_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.CANCELED]: [],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

export const INVENTORY_REASONS = {
  RESERVE: 'RESERVE',
  RELEASE: 'RELEASE',
  COMMIT: 'COMMIT',
  EXPIRE: 'EXPIRE',
} as const;
