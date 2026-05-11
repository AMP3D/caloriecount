import { useEffect, useState } from 'react';

import type { FoodItem } from '../../models';
import { recentFoods } from '../../state';
import { loadRecentFoods } from '../../storage/actions';

interface RecentTabProps {
  onSelect: (food: FoodItem, amount: number) => void;
}

export const RecentTab = ({ onSelect }: RecentTabProps) => {
  const [amount, setAmount] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const handleConfirmSelection = () => {
    if (selectedFood && parseFloat(amount) > 0) {
      onSelect(selectedFood, parseFloat(amount));
    }
  };

  const foods = recentFoods.value;

  return (
    <>
      <div className="food-list">
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
              {food.caloriesPerServing} cal / {food.servingSize} g
            </div>
          </div>
        ))}

        {foods.length === 0 && (
          <p className="no-results">No recent foods. Add some food entries first.</p>
        )}
      </div>

      {selectedFood && (
        <div className="amount-row">
          <input
            className="amount-input"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (g)"
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
