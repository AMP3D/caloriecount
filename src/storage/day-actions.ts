import { v4 as uuid } from 'uuid';

import type { DayFoodEntry, DayFoodEntryWithDetails, DaySummary } from '../models';
import { currentDayEntries, daySummaries } from '../state';
import { db } from './db';

const formatDateId = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${mm}-${dd}-${yyyy}`;
};

const getDisplayLabel = (dateId: string): string => {
  const dateTitle = new Date(dateId).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    year: 'numeric',
  });
  const isToday = new Date(dateId).toDateString() === new Date().toDateString();

  return `${isToday ? 'Today - ' : ''}${dateTitle}`;
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

export const addQuickEntry = async (
  dateId: string,
  calories: number,
  name?: string,
): Promise<void> => {
  const entry: DayFoodEntry = {
    amount: 1,
    calories: Math.round(calories),
    createdAt: new Date().toISOString(),
    dateId,
    foodId: '',
    id: uuid(),
    name: name || 'Quick Add',
  };

  await db.dayFoodEntries.add(entry);
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

export const getTodayId = (): string => formatDateId(new Date());

export const loadDayEntries = async (dateId: string): Promise<void> => {
  const entries = await db.dayFoodEntries.where('dateId').equals(dateId).toArray();
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  const detailed: DayFoodEntryWithDetails[] = entries
    .map((entry) => {
      if (entry.calories !== undefined) {
        return {
          ...entry,
          brand: entry.brand ?? 'Quick Add',
          calories: entry.calories,
          carbs: entry.carbs ?? 0,
          fat: entry.fat ?? 0,
          name: entry.name ?? 'Quick Add',
          protein: entry.protein ?? 0,
          servingSize: 1,
        };
      }

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

export const loadDaySummaries = async (): Promise<void> => {
  const entries = await db.dayFoodEntries.toArray();
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  const dateMap = new Map<string, number>();

  for (const entry of entries) {
    const cals = entry.calories !== undefined
      ? entry.calories
      : (() => {
          const food = foodMap.get(entry.foodId);

          return food ? Math.round((entry.amount / food.servingSize) * food.caloriesPerServing) : 0;
        })();

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

export const updateDayFoodEntry = async (
  entryId: string,
  dateId: string,
  amount: number,
): Promise<void> => {
  await db.dayFoodEntries.update(entryId, { amount });
  await loadDayEntries(dateId);
  await loadDaySummaries();
};
