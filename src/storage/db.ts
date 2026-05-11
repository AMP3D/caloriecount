import Dexie, { type Table } from 'dexie';

import type { DayFoodEntry, FoodItem } from '../models';

class CalorieDatabase extends Dexie {
  dayFoodEntries!: Table<DayFoodEntry>;
  foodItems!: Table<FoodItem>;

  constructor() {
    super('CalorieCounterDB');

    this.version(1).stores({
      dayFoodEntries: 'id, dateId, foodId',
      foodItems: 'id, brand, name, barcode',
    });

    this.version(2)
      .stores({
        dayFoodEntries: 'id, dateId, foodId',
        foodItems: 'id, brand, name, barcode',
      })
      .upgrade((tx) =>
        tx
          .table('foodItems')
          .toCollection()
          .modify((food) => {
            food.caloriesPerServing = food.caloriesPerGram ?? 0;
            food.carbsPerServing = food.carbsPerGram ?? 0;
            food.fatPerServing = food.fatPerGram ?? 0;
            food.proteinPerServing = food.proteinPerGram ?? 0;
            food.servingSize = 1;
            delete food.caloriesPerGram;
            delete food.carbsPerGram;
            delete food.fatPerGram;
            delete food.proteinPerGram;
          }),
      );

    this.version(3)
      .stores({
        dayFoodEntries: 'id, dateId, foodId',
        foodItems: 'id, brand, name, barcode',
      })
      .upgrade((tx) =>
        tx
          .table('dayFoodEntries')
          .toCollection()
          .modify((entry) => {
            entry.amount = entry.grams ?? 0;
            delete entry.grams;
          }),
      );

    this.version(4)
      .stores({
        dayFoodEntries: 'id, dateId, foodId',
        foodItems: 'id, brand, name, barcode',
      })
      .upgrade((tx) =>
        tx
          .table('dayFoodEntries')
          .toCollection()
          .modify((entry) => {
            entry.createdAt = entry.createdAt ?? new Date().toISOString();
          }),
      );
  }
}

export const db = new CalorieDatabase();
