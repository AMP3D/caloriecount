import { useEffect, useState } from 'react';

import type { FoodItem } from '../../models';
import { foodDatabase } from '../../state';
import { loadFoodDatabase } from '../../storage/actions';

interface SearchTabProps {
  onSelect: (food: FoodItem, amount: number) => void;
}

export const SearchTab = ({ onSelect }: SearchTabProps) => {
  const [amount, setAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    loadFoodDatabase();
  }, []);

  const filteredFoods = foodDatabase.value.filter((f) => {
    const query = searchQuery.toLowerCase();

    return f.name.toLowerCase().includes(query) || f.brand.toLowerCase().includes(query);
  });

  const handleConfirmSelection = () => {
    if (selectedFood && parseFloat(amount) > 0) {
      onSelect(selectedFood, parseFloat(amount));
    }
  };

  return (
    <>
      <input
        className="search-input"
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by brand or name..."
        type="text"
        value={searchQuery}
      />

      <div className="food-list">
        {filteredFoods.map((food) => (
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

        {filteredFoods.length === 0 && (
          <p className="no-results">No foods found. Try adding a custom food.</p>
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
