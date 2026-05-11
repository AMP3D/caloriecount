import { useState } from 'react';

import type { FoodItem } from '../../models';
import { addFoodItem, updateFoodItem } from '../../storage/actions';

interface QuickAddTabProps {
  editingFood?: FoodItem;
  onSelect: (food: FoodItem, amount: number) => void;
}

export const QuickAddTab = ({ editingFood, onSelect }: QuickAddTabProps) => {
  const [calories, setCalories] = useState('');

  const handleSave = () => {
    if (Number(calories) <= 0) {
      return;
    }

    const foodData = {
      brand: 'Quick Add',
      caloriesPerServing: Number(calories),
      carbsPerServing: 0,
      fatPerServing: 0,
      name: 'Quick Add',
      proteinPerServing: 0,
      servingSize: 1,
    };

    if (editingFood) {
      const updated = { ...editingFood, ...foodData };
      updateFoodItem(updated);
      onSelect(updated, 1);
    } else {
      addFoodItem(foodData).then((newFood) => {
        onSelect(newFood, 1);
      });
    }
  };

  return (
    <div className="quick-add-form">
      <label htmlFor="quick-add-calories">Calories</label>
      <input
        id="quick-add-calories"
        onChange={(e) => setCalories(e.target.value)}
        required={calories.trim() === ''}
        step="0.01"
        type="number"
        value={calories}
      />

      <button
        id="quick-add-save-btn"
        className={`save-btn ${Number(calories) <= 0 ? 'disabled' : ''}`}
        disabled={Number(calories) <= 0}
        onClick={handleSave}
      >
        Save
      </button>
    </div>
  );
};
