export interface FoodGroupItem {
  amount: number;
  foodId: string;
  id: string;
}

export interface FoodGroup {
  id: string;
  items: FoodGroupItem[];
  name: string;
}
