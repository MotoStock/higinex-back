export type EmailPayload<Context = Record<string, unknown>> = {
  to: string | string[];
  subject: string;
  template: string;
  context: Context;
};

export type OrderEmailPayload = {
  to: string | string[];
  subject: string;
  template: string;
  input: OrderNotificationInput;
};

export type OrderItemSummary = {
  displayName: string;
  quantity: number;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  lineTotalValue: number;
};

export type OrderSummary = {
  createdAtLabel: string;
  statusLabel: string;
  items: OrderItemSummary[];
  subtotalFormatted: string;
  taxesFormatted: string;
  shippingFormatted: string;
  discountFormatted: string;
  totalFormatted: string;
};

export type OrderEmailContext = Omit<OrderNotificationInput, 'items'> &
  OrderSummary & {
    customerName: string;
  };

export type EmailVerificationLinkInput = {
  email: string;
  link: string;
  expiresInMinutes: number;
};

export type AuthCodeEmailInput = {
  email: string;
  code: string;
  expiresInMinutes: number;
};

export type OrderNotificationItem = {
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
};

export type OrderNotificationCustomer = {
  name: string;
  email: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
};

export type OrderNotificationInput = {
  orderNumber: string;
  createdAt: Date;
  status?: string;
  currency?: string;
  subtotalAmount?: number | string;
  taxesAmount?: number | string;
  shippingAmount?: number | string;
  discountAmount?: number | string;
  totalAmount: number | string;
  customer: OrderNotificationCustomer;
  items: OrderNotificationItem[];
  customerNotes?: string;
};
