import type { DayFoodEntry, FoodGroup, FoodItem } from '../models';
import { loadDaySummaries } from './day-actions';
import { db } from './db';
import { loadFoodDatabase, loadRecentFoods } from './food-actions';
import { loadFoodGroups } from './group-actions';

export const exportDatabase = async (): Promise<void> => {
  const dayFoodEntries = await db.dayFoodEntries.toArray();
  const groups = await db.foodGroups.toArray();
  const foodItems = await db.foodItems.toArray();

  const payload = JSON.stringify({ dayFoodEntries, foodGroups: groups, foodItems }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.download = `caloriecounter${new Date()
    .toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\D/g, '')
    .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}).*/, '$1$2$3T$4$5$6')}.json`;
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

  await db.foodItems.clear();
  await db.dayFoodEntries.clear();
  await db.foodGroups.clear();

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
  await loadRecentFoods();
};
