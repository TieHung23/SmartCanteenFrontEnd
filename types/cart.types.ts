export interface CartItemData {
  dishId: string;
  quantity: number;
}

export interface CartData {
  mealId: string;
  mealTemplateId: string;
  items: CartItemData[];
}

export interface CartResponse {
  id: string | null;
  data: CartData;
  version: number;
  updatedAtUtc: string | null;
}

export interface UpdateCartCommand {
  data: CartData;
  expectedVersion: number;
}
