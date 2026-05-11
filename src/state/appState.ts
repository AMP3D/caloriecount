import { signal } from '@preact/signals-react';

import type { DayFoodEntryWithDetails, DaySummary, FoodItem } from '../models';

export const currentDayEntries = signal<DayFoodEntryWithDetails[]>([]);
export const daySummaries = signal<DaySummary[]>([]);
export const foodDatabase = signal<FoodItem[]>([]);
export const isLoading = signal<boolean>(false);
export const recentFoods = signal<FoodItem[]>([]);
