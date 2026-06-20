export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  categoryId: string;
  imgUrl: string | null;
  categoryName?: string;
}

export interface DishListPayload {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  image?: File | null;
}

export interface DishUpdatePayload extends DishListPayload {
  isActive?: boolean;
}
