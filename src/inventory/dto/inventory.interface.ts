export type InventoryItemInput = {
  variantId: string;
  quantity: number;
};

export type InventoryOperationOptions = {
  orderId?: string;
  reason?: string;
  notes?: string;
};

export type InventoryAvailability = {
  variantId: string;
  onHand: number;
  reserved: number;
  available: number;
};

export type InventoryOperationResult = {
  items: Array<{
    variantId: string;
    quantity: number;
    onHandBefore: number;
    onHandAfter: number;
    reservedBefore: number;
    reservedAfter: number;
    availableBefore: number;
    availableAfter: number;
  }>;
};

export type LockedBalance = {
  variantId: string;
  onHand: number;
  reserved: number;
};
