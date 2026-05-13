import { v4 as uuid } from 'uuid';

import type { FoodItem } from '../models';
import { foodDatabase, recentFoods, recentGroupIds } from '../state';
import { db } from './db';

export const addFoodItem = async (food: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
  const newItem: FoodItem = { ...food, id: uuid() };

  await db.foodItems.add(newItem);
  await loadFoodDatabase();

  return newItem;
};

export const deleteFoodItem = async (foodId: string): Promise<void> => {
  await db.foodItems.delete(foodId);
  await loadFoodDatabase();
};

export const loadFoodDatabase = async (): Promise<void> => {
  const items = await db.foodItems.toArray();

  foodDatabase.value = items
    .filter((f) => f.brand !== 'Group' && f.brand !== 'Quick Add')
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
};

export const loadRecentFoods = async (): Promise<void> => {
  const entries = await db.dayFoodEntries.toArray();
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  const groupLastUsedMap = new Map<string, string>();
  const lastUsedMap = new Map<string, string>();

  for (const entry of entries) {
    if (entry.brand === 'Group' && entry.groupId) {
      const existing = groupLastUsedMap.get(entry.groupId);

      if (!existing || entry.createdAt > existing) {
        groupLastUsedMap.set(entry.groupId, entry.createdAt);
      }

      continue;
    }

    if (entry.brand === 'Quick Add' || entry.calories !== undefined) {
      continue;
    }

    const food = foodMap.get(entry.foodId);

    if (!food || food.brand === 'Group' || food.brand === 'Quick Add') {
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
    if (entry.brand === 'Group' || entry.brand === 'Quick Add' || entry.calories !== undefined) {
      continue;
    }

    const food = foodMap.get(entry.foodId);

    if (!food || food.brand === 'Group' || food.brand === 'Quick Add') {
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

  const sortedGroupIds = Array.from(groupLastUsedMap.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([id]) => id);

  recentGroupIds.value = sortedGroupIds;
};

export const updateFoodItem = async (food: FoodItem): Promise<void> => {
  await db.foodItems.put(food);
  await loadFoodDatabase();
};
