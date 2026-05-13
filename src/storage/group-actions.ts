import { v4 as uuid } from 'uuid';

import type { DayFoodEntry, FoodGroup, FoodGroupItem } from '../models';
import { foodGroups } from '../state';
import { db } from './db';
import { loadDayEntries, loadDaySummaries } from './day-actions';

export const addFoodGroup = async (name: string): Promise<FoodGroup> => {
  const group: FoodGroup = { id: uuid(), items: [], name };

  await db.foodGroups.add(group);
  await loadFoodGroups();

  return group;
};

export const addGroupToDay = async (dateId: string, group: FoodGroup): Promise<void> => {
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  let totalCalories = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalProtein = 0;

  for (const item of group.items) {
    const food = foodMap.get(item.foodId);

    if (!food) {
      continue;
    }

    const ratio = item.amount / food.servingSize;

    totalCalories += food.caloriesPerServing * ratio;
    totalCarbs += food.carbsPerServing * ratio;
    totalFat += food.fatPerServing * ratio;
    totalProtein += food.proteinPerServing * ratio;
  }

  const entry: DayFoodEntry = {
    amount: 1,
    brand: 'Group',
    calories: Math.round(totalCalories),
    carbs: Math.round(totalCarbs),
    createdAt: new Date().toISOString(),
    dateId,
    fat: Math.round(totalFat),
    foodId: '',
    groupId: group.id,
    id: uuid(),
    name: group.name,
    protein: Math.round(totalProtein),
  };

  await db.dayFoodEntries.add(entry);
  await loadDayEntries(dateId);
  await loadDaySummaries();
};

export const addItemToGroup = async (
  groupId: string,
  item: Omit<FoodGroupItem, 'id'>,
): Promise<void> => {
  const group = await db.foodGroups.get(groupId);

  if (!group) {
    return;
  }

  group.items.push({ ...item, id: uuid() });
  await db.foodGroups.put(group);
  await loadFoodGroups();
};

export const deleteFoodGroup = async (groupId: string): Promise<void> => {
  await db.foodGroups.delete(groupId);
  await loadFoodGroups();
};

export const loadFoodGroups = async (): Promise<void> => {
  const groups = await db.foodGroups.toArray();

  foodGroups.value = groups.sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  );
};

export const removeItemFromGroup = async (groupId: string, itemId: string): Promise<void> => {
  const group = await db.foodGroups.get(groupId);

  if (!group) {
    return;
  }

  group.items = group.items.filter((item) => item.id !== itemId);
  await db.foodGroups.put(group);
  await loadFoodGroups();
};

export const updateFoodGroup = async (group: FoodGroup): Promise<void> => {
  await db.foodGroups.put(group);
  await loadFoodGroups();
};

export const updateGroupForDay = async (
  dateId: string,
  entryId: string,
  group: FoodGroup,
): Promise<void> => {
  const foodItems = await db.foodItems.toArray();
  const foodMap = new Map(foodItems.map((f) => [f.id, f]));

  let totalCalories = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalProtein = 0;

  for (const item of group.items) {
    const food = foodMap.get(item.foodId);

    if (!food) {
      continue;
    }

    const ratio = item.amount / food.servingSize;

    totalCalories += food.caloriesPerServing * ratio;
    totalCarbs += food.carbsPerServing * ratio;
    totalFat += food.fatPerServing * ratio;
    totalProtein += food.proteinPerServing * ratio;
  }

  await db.dayFoodEntries.update(entryId, {
    calories: Math.round(totalCalories),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
    name: group.name,
    protein: Math.round(totalProtein),
  });

  await loadDayEntries(dateId);
  await loadDaySummaries();
};

export const updateItemInGroup = async (
  groupId: string,
  itemId: string,
  amount: number,
): Promise<void> => {
  const group = await db.foodGroups.get(groupId);

  if (!group) {
    return;
  }

  const item = group.items.find((i) => i.id === itemId);

  if (!item) {
    return;
  }

  item.amount = amount;
  await db.foodGroups.put(group);
  await loadFoodGroups();
};
