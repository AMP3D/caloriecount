export interface FoodItem {
  barcode?: string;
  brand: string;
  caloriesPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  id: string;
  name: string;
  proteinPerServing: number;
  servingSize: number;
  servingUnit?: string;
}

export interface DayFoodEntry {
  amount: number;
  createdAt: string;
  dateId: string;
  foodId: string;
  id: string;
}

export interface DayFoodEntryWithDetails extends DayFoodEntry {
  brand: string;
  calories: number;
  carbs: number;
  fat: number;
  name: string;
  protein: number;
  servingSize: number;
}
