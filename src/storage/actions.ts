import { v4 as uuid } from 'uuid';

import type { DayFoodEntry, DayFoodEntryWithDetails, DaySummary, FoodItem } from '../models';
import { currentDayEntries, daySummaries, foodDatabase, recentFoods } from '../state';
import { db } from './db';

const formatDateId = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${mm}-${dd}-${yyyy}`;
};

const getDisplayLabel = (dateId: string): string => {
  const isToday = new Date(dateId).toDateString() === new Date().toDateString();
  const dateTitle = new Date(dateId).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `${isToday ? 'Today - ' : ''}${dateTitle}`;
};

export const getTodayId = (): string => formatDateId(new Date());

export const loadDaySummaries = async (): Promise<void> => {
  const entries = await db.dayFoodEntries.toArray();
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  const dateMap = new Map<string, number>();

  for (const entry of entries) {
    const food = foodMap.get(entry.foodId);
    const cals = food ? Math.round((entry.amount / food.servingSize) * food.caloriesPerServing) : 0;
    dateMap.set(entry.dateId, (dateMap.get(entry.dateId) ?? 0) + cals);
  }

  const summaries: DaySummary[] = Array.from(dateMap.entries())
    .map(([dateId, calories]) => ({
      calories,
      dateId,
      displayLabel: getDisplayLabel(dateId),
    }))
    .sort((a, b) => {
      const [am, ad, ay] = a.dateId.split('-').map(Number);
      const [bm, bd, by] = b.dateId.split('-').map(Number);

      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
    });

  daySummaries.value = summaries;
};

export const loadDayEntries = async (dateId: string): Promise<void> => {
  const entries = await db.dayFoodEntries.where('dateId').equals(dateId).toArray();
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  const detailed: DayFoodEntryWithDetails[] = entries
    .map((entry) => {
      const food = foodMap.get(entry.foodId);

      return {
        ...entry,
        brand: food?.brand ?? '',
        calories: food
          ? Math.round((entry.amount / food.servingSize) * food.caloriesPerServing)
          : 0,
        carbs: food ? Math.round((entry.amount / food.servingSize) * food.carbsPerServing) : 0,
        fat: food ? Math.round((entry.amount / food.servingSize) * food.fatPerServing) : 0,
        name: food?.name ?? 'Unknown',
        protein: food ? Math.round((entry.amount / food.servingSize) * food.proteinPerServing) : 0,
        servingSize: food?.servingSize ?? 1,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  currentDayEntries.value = detailed;
};

export const loadFoodDatabase = async (): Promise<void> => {
  const items = await db.foodItems.toArray();

  foodDatabase.value = items.sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  );
};

export const loadRecentFoods = async (): Promise<void> => {
  const entries = await db.dayFoodEntries.toArray();
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  const lastUsedMap = new Map<string, string>();

  for (const entry of entries) {
    const food = foodMap.get(entry.foodId);

    if (!food || food.brand === 'Quick Add') {
      continue;
    }

    const key = `${food.brand}::${food.name}`;
    const existing = lastUsedMap.get(key);

    if (!existing || entry.createdAt > existing) {
      lastUsedMap.set(key, entry.createdAt);
    }
  }

  const seenKeys = new Set<string>();
  const uniqueFoods: { food: FoodItem; lastUsed: string }[] = [];

  for (const entry of entries) {
    const food = foodMap.get(entry.foodId);

    if (!food || food.brand === 'Quick Add') {
      continue;
    }

    const key = `${food.brand}::${food.name}`;

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    uniqueFoods.push({ food, lastUsed: lastUsedMap.get(key) ?? '' });
  }

  uniqueFoods.sort((a, b) => b.lastUsed.localeCompare(a.lastUsed));
  recentFoods.value = uniqueFoods.map((item) => item.food);
};

export const addFoodItem = async (food: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
  const newItem: FoodItem = { ...food, id: uuid() };

  await db.foodItems.add(newItem);
  await loadFoodDatabase();

  return newItem;
};

export const updateFoodItem = async (food: FoodItem): Promise<void> => {
  await db.foodItems.put(food);
  await loadFoodDatabase();
};

export const addDayFoodEntry = async (
  dateId: string,
  foodId: string,
  amount: number,
): Promise<void> => {
  const entry: DayFoodEntry = {
    amount,
    createdAt: new Date().toISOString(),
    dateId,
    foodId,
    id: uuid(),
  };

  await db.dayFoodEntries.add(entry);
  await loadDayEntries(dateId);
  await loadDaySummaries();
};

export const updateDayFoodEntry = async (
  entryId: string,
  dateId: string,
  amount: number,
): Promise<void> => {
  await db.dayFoodEntries.update(entryId, { amount });
  await loadDayEntries(dateId);
  await loadDaySummaries();
};

export const deleteDayFoodEntries = async (ids: string[], dateId: string): Promise<void> => {
  await db.dayFoodEntries.bulkDelete(ids);
  await loadDayEntries(dateId);
  await loadDaySummaries();
};

export const deleteDaySummaries = async (dateIds: string[]): Promise<void> => {
  for (const dateId of dateIds) {
    await db.dayFoodEntries.where('dateId').equals(dateId).delete();
  }

  await loadDaySummaries();
};

export const exportDatabase = async (): Promise<void> => {
  const dayFoodEntries = await db.dayFoodEntries.toArray();
  const foodItems = await db.foodItems.toArray();

  const payload = JSON.stringify({ dayFoodEntries, foodItems }, null, 2);
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
    foodItems?: FoodItem[];
  };

  if (data.foodItems?.length) {
    await db.foodItems.bulkPut(data.foodItems);
  }

  if (data.dayFoodEntries?.length) {
    await db.dayFoodEntries.bulkPut(data.dayFoodEntries);
  }

  await loadDaySummaries();
  await loadFoodDatabase();
};
