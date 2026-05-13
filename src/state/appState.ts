import { signal } from '@preact/signals-react';

import type { DayFoodEntryWithDetails, DaySummary, FoodGroup, FoodItem } from '../models';

export const currentDayEntries = signal<DayFoodEntryWithDetails[]>([]);
export const daySummaries = signal<DaySummary[]>([]);
export const foodDatabase = signal<FoodItem[]>([]);
export const foodGroups = signal<FoodGroup[]>([]);
export const isLoading = signal<boolean>(false);
export const recentFoods = signal<FoodItem[]>([]);
export const recentGroupIds = signal<string[]>([]);
