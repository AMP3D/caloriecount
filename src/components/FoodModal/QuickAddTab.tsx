import { useState } from 'react';

import { addQuickEntry } from '../../storage/actions';
import './QuickAddTab.scss';

interface QuickAddTabProps {
  dateId: string;
  onSaved: () => void;
}

export const QuickAddTab = ({ dateId, onSaved }: QuickAddTabProps) => {
  const [calories, setCalories] = useState('');
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (Number(calories) <= 0) {
      return;
    }

    await addQuickEntry(dateId, Number(calories), name.trim() || undefined);
    onSaved();
  };

  return (
    <div className="quick-add-form">
      <label htmlFor="name">Name (optional)</label>
      <textarea id="quick-add-name" onChange={(e) => setName(e.target.value)} value={name} />

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
        Add
      </button>
    </div>
  );
};
