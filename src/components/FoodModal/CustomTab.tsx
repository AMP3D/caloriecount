import { useMemo, useState } from 'react';

import type { FoodItem } from '../../models';
import { addFoodItem, updateFoodItem } from '../../storage/actions';

interface CustomTabProps {
  editingFood?: FoodItem;
  initialAmount?: number;
  onSelect: (food: FoodItem, amount: number) => void;
}

export const CustomTab = ({ editingFood, initialAmount, onSelect }: CustomTabProps) => {
  const [amount, setAmount] = useState(initialAmount?.toString() ?? '');
  const [brand, setBrand] = useState(editingFood?.brand ?? '');
  const [caloriesPerServing, setCaloriesPerServing] = useState(
    editingFood?.caloriesPerServing?.toString() ?? '',
  );
  const [carbsPerServing, setCarbsPerServing] = useState(
    editingFood?.carbsPerServing?.toString() ?? '',
  );
  const [fatPerServing, setFatPerServing] = useState(editingFood?.fatPerServing?.toString() ?? '');
  const [name, setName] = useState(editingFood?.name ?? '');
  const [proteinPerServing, setProteinPerServing] = useState(
    editingFood?.proteinPerServing?.toString() ?? '',
  );
  const [servingSize, setServingSize] = useState(editingFood?.servingSize?.toString() ?? '');

  const canSave = useMemo(() => {
    return name?.trim() && parseFloat(caloriesPerServing) > -1 && parseFloat(servingSize) > -1;
  }, [name, caloriesPerServing, servingSize]);

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const foodData = {
      brand,
      caloriesPerServing: parseFloat(caloriesPerServing) || 0,
      carbsPerServing: parseFloat(carbsPerServing) || 0,
      fatPerServing: parseFloat(fatPerServing) || 0,
      name,
      proteinPerServing: parseFloat(proteinPerServing) || 0,
      servingSize: parseFloat(servingSize) || 1,
    };

    if (editingFood) {
      const updated = { ...editingFood, ...foodData };
      updateFoodItem(updated);
      onSelect(updated, parseFloat(amount) || 0);
    } else {
      addFoodItem(foodData).then((newFood) => {
        onSelect(newFood, parseFloat(amount) || 0);
      });
    }
  };

  return (
    <div className="custom-form">
      <label htmlFor="brand">Brand</label>
      <textarea
        id="brand"
        onChange={(e) => setBrand(e.target.value)}
        required={brand.trim() === ''}
        value={brand}
      />

      <label htmlFor="name">Name</label>
      <textarea
        id="name"
        onChange={(e) => setName(e.target.value)}
        required={name.trim() === ''}
        value={name}
      />

      <div className="custom-form-row">
        <label htmlFor="servingSize">Serving Size (g)</label>
        <input
          id="servingSize"
          onChange={(e) => setServingSize(e.target.value)}
          required={servingSize.trim() === ''}
          step="0.01"
          type="number"
          value={servingSize}
        />
      </div>

      <div className="custom-form-row">
        <label htmlFor="caloriesPerServing">Calories</label>
        <input
          id="caloriesPerServing"
          onChange={(e) => setCaloriesPerServing(e.target.value)}
          required={caloriesPerServing.trim() === ''}
          step="0.01"
          type="number"
          value={caloriesPerServing}
        />
      </div>

      <div className="custom-form-row">
        <label htmlFor="fatPerServing">Fat</label>
        <input
          id="fatPerServing"
          onChange={(e) => setFatPerServing(e.target.value)}
          step="0.01"
          type="number"
          value={fatPerServing}
        />
      </div>

      <div className="custom-form-row">
        <label htmlFor="carbsPerServing">Carbs</label>
        <input
          id="carbsPerServing"
          onChange={(e) => setCarbsPerServing(e.target.value)}
          step="0.01"
          type="number"
          value={carbsPerServing}
        />
      </div>

      <div className="custom-form-row">
        <label htmlFor="proteinPerServing">Protein</label>
        <input
          id="proteinPerServing"
          onChange={(e) => setProteinPerServing(e.target.value)}
          step="0.01"
          type="number"
          value={proteinPerServing}
        />
      </div>

      <div className="custom-form-row">
        <label htmlFor="amount">Amount to log (g)</label>
        <input
          id="amount"
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          value={amount}
        />
      </div>

      <button
        id="save-btn"
        className={`save-btn ${!canSave ? 'disabled' : ''}`}
        disabled={!canSave}
        onClick={handleSave}
      >
        {editingFood ? 'Update & Save' : 'Save & Add'}
      </button>
    </div>
  );
};
