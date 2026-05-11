import { useState } from 'react';

import { XMarkIcon } from '../../assets/icons';
import type { FoodItem } from '../../models';
import { CustomTab } from './CustomTab';
import './FoodModal.scss';
import { QuickAddTab } from './QuickAddTab';
import { RecentTab } from './RecentTab';
import { SearchTab } from './SearchTab';

type TabId = 'custom' | 'quick-add' | 'recent' | 'search';

interface FoodModalProps {
  editingFood?: FoodItem;
  initialAmount?: number;
  mode: 'add' | 'edit' | 'search';
  onClose: () => void;
  onSelect: (food: FoodItem, amount: number) => void;
}

export const FoodModal = ({
  editingFood,
  initialAmount,
  mode,
  onClose,
  onSelect,
}: FoodModalProps) => {
  const [activeTab, setActiveTab] = useState<TabId>(mode === 'edit' ? 'custom' : 'search');

  return (
    <div className="food-modal-overlay" onClick={onClose}>
      <div className="food-modal" onClick={(e) => e.stopPropagation()}>
        <div className="food-modal-header">
          <h2>{mode === 'edit' ? 'Edit Food' : 'Add Food'}</h2>

          <button className="close-btn" onClick={onClose}>
            <XMarkIcon className="btn-icon" />
          </button>
        </div>

        {mode !== 'edit' && (
          <div className="food-modal-tabs">
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Search
            </button>

            <button
              className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              Recent
            </button>

            <button
              className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              Custom
            </button>

            <button
              className={`tab ${activeTab === 'quick-add' ? 'active' : ''}`}
              onClick={() => setActiveTab('quick-add')}
            >
              Quick Add
            </button>
          </div>
        )}

        <div className="food-modal-body">
          {activeTab === 'search' && <SearchTab onSelect={onSelect} />}

          {activeTab === 'recent' && <RecentTab onSelect={onSelect} />}

          {activeTab === 'custom' && (
            <CustomTab
              editingFood={editingFood}
              initialAmount={initialAmount}
              onSelect={onSelect}
            />
          )}

          {activeTab === 'quick-add' && (
            <QuickAddTab editingFood={editingFood} onSelect={onSelect} />
          )}
        </div>
      </div>
    </div>
  );
};
