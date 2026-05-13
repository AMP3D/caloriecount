import { useEffect, useState } from 'react';

import { PencilSquareIcon, TrashIcon } from '../../assets/icons';
import type { FoodItem } from '../../models';
import { foodDatabase } from '../../state';
import { deleteFoodItem, loadFoodDatabase } from '../../storage/actions';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';

interface SearchTabProps {
  onEdit: (food: FoodItem) => void;
  onSelect: (food: FoodItem, amount: number) => void;
}

export const SearchTab = ({ onEdit, onSelect }: SearchTabProps) => {
  const [amount, setAmount] = useState('');
  const [deletingFood, setDeletingFood] = useState<FoodItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    loadFoodDatabase();
  }, []);

  const filteredFoods = foodDatabase.value.filter((f) => {
    const query = searchQuery.toLowerCase();

    return f.name.toLowerCase().includes(query) || f.brand.toLowerCase().includes(query);
  });

  const handleConfirmDelete = async () => {
    if (!deletingFood) {
      return;
    }

    await deleteFoodItem(deletingFood.id);

    if (selectedFood?.id === deletingFood.id) {
      setSelectedFood(null);
    }

    setDeletingFood(null);
  };

  const handleConfirmSelection = () => {
    if (!selectedFood) {
      return;
    }

    const parsedAmount = parseFloat(amount);
    const finalAmount = parsedAmount > 0 ? parsedAmount : selectedFood.servingSize;

    onSelect(selectedFood, finalAmount);
  };

  const handleDeleteClick = (e: React.MouseEvent, food: FoodItem) => {
    e.stopPropagation();
    setDeletingFood(food);
  };

  const handleEditClick = (e: React.MouseEvent, food: FoodItem) => {
    e.stopPropagation();
    onEdit(food);
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
              <span>
                {Math.round(food.caloriesPerServing)} cal / {food.servingSize}g
              </span>

              <button className="food-edit-btn" onClick={(e) => handleEditClick(e, food)}>
                <PencilSquareIcon className="btn-icon" />
              </button>

              <button className="food-delete-btn" onClick={(e) => handleDeleteClick(e, food)}>
                <TrashIcon className="btn-icon" />
              </button>
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
            placeholder={`Amount (g) — default: ${selectedFood.servingSize}g`}
            type="number"
            value={amount}
          />

          <button className="add-btn" onClick={handleConfirmSelection}>
            Add
          </button>
        </div>
      )}

      {deletingFood && (
        <ConfirmDialog
          message={`Delete "${deletingFood.name}" from the database? This cannot be undone.`}
          onCancel={() => setDeletingFood(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};
