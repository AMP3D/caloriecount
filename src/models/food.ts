import type { FoodGroupItem } from './food-group';

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
  brand?: string;
  calories?: number;
  carbs?: number;
  createdAt: string;
  dateId: string;
  fat?: number;
  foodId: string;
  groupId?: string;
  groupItems?: FoodGroupItem[];
  id: string;
  name?: string;
  protein?: number;
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
