import { useEffect, useMemo, useState } from 'react';

import type { FoodItem } from '../../models';
import { foodGroups, recentFoods, recentGroupIds } from '../../state';
import { addGroupToDay, loadRecentFoods } from '../../storage/actions';

interface RecentTabProps {
  dateId?: string;
  onGroupAdded?: () => void;
  onSelect: (food: FoodItem, amount: number) => void;
}

export const RecentTab = ({ dateId, onGroupAdded, onSelect }: RecentTabProps) => {
  const [amount, setAmount] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const handleAddGroup = async (groupId: string) => {
    if (!dateId) {
      return;
    }

    const group = foodGroups.value.find((g) => g.id === groupId);

    if (!group || group.items.length === 0) {
      return;
    }

    await addGroupToDay(dateId, group);
    onGroupAdded?.();
  };

  const handleConfirmSelection = () => {
    if (!selectedFood) {
      return;
    }

    const parsedAmount = parseFloat(amount);
    const finalAmount = parsedAmount > 0 ? parsedAmount : selectedFood.servingSize;

    onSelect(selectedFood, finalAmount);
  };

  const foods = recentFoods.value;

  const recentGroups = useMemo(() => {
    return recentGroupIds.value
      .map((id) => foodGroups.value.find((g) => g.id === id))
      .filter((g) => g !== undefined);
  }, [recentGroupIds.value, foodGroups.value]);

  return (
    <>
      <div className="food-list">
        {recentGroups.map((group) => (
          <div
            className="food-list-item"
            key={group.id}
            onClick={() => handleAddGroup(group.id)}
          >
            <div className="food-info">
              <div className="food-brand">Group</div>
              <div className="food-name">{group.name}</div>
            </div>

            <div className="food-cals">
              {group.items.length} item(s)
            </div>
          </div>
        ))}

        {foods.map((food) => (
          <div
            className={`food-list-item ${selectedFood?.id === food.id ? 'selected' : ''}`}
            key={food.id}
            onClick={() => setSelectedFood(food)}
          >
            <div className="food-info">
              <div className="food-brand">{food.brand}</div>
              <div className="food-name">{food.name}</div>
            </div>

            <div className="food-cals">
              {Math.round(food.caloriesPerServing)} cal / {food.servingSize}g
            </div>
          </div>
        ))}

        {foods.length === 0 && recentGroups.length === 0 && (
          <p className="no-results">No recent foods. Add some food entries first.</p>
        )}
      </div>

      {selectedFood && (
        <div className="amount-row">
          <input
            className="amount-input"
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount (g) — default: ${selectedFood.servingSize}g`}
            type="number"
            value={amount}
          />

          <button className="add-btn" onClick={handleConfirmSelection}>
            Add
          </button>
        </div>
      )}
    </>
  );
};
