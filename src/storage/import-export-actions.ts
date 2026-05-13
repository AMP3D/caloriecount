import type { DayFoodEntry, FoodGroup, FoodItem } from '../models';
import { db } from './db';
import { loadDaySummaries } from './day-actions';
import { loadFoodDatabase } from './food-actions';
import { loadFoodGroups } from './group-actions';

export const exportDatabase = async (): Promise<void> => {
  const dayFoodEntries = await db.dayFoodEntries.toArray();
  const foodGroups = await db.foodGroups.toArray();
  const foodItems = await db.foodItems.toArray();

  const payload = JSON.stringify({ dayFoodEntries, foodGroups, foodItems }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.download = `calorie-counter-${new Date().toISOString().slice(0, 19)}.json`;
  anchor.href = url;
  anchor.click();

  URL.revokeObjectURL(url);
};

export const importDatabase = async (file: File): Promise<void> => {
  const text = await file.text();
  const data = JSON.parse(text) as {
    dayFoodEntries?: DayFoodEntry[];
    foodGroups?: FoodGroup[];
    foodItems?: FoodItem[];
  };

  if (data.foodItems?.length) {
    await db.foodItems.bulkPut(data.foodItems);
  }

  if (data.dayFoodEntries?.length) {
    await db.dayFoodEntries.bulkPut(data.dayFoodEntries);
  }

  if (data.foodGroups?.length) {
    await db.foodGroups.bulkPut(data.foodGroups);
  }

  await loadDaySummaries();
  await loadFoodDatabase();
  await loadFoodGroups();
};
