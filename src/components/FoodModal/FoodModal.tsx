import { useEffect, useRef, useState } from 'react';

import { XMarkIcon } from '../../assets/icons';
import type { FoodItem } from '../../models';
import { CustomTab } from './CustomTab';
import './FoodModal.scss';
import { GroupsTab } from './GroupsTab';
import { QuickAddTab } from './QuickAddTab';
import { RecentTab } from './RecentTab';
import { SearchTab } from './SearchTab';

type TabId = 'custom' | 'groups' | 'quick-add' | 'recent' | 'search';

interface FoodModalProps {
  dateId?: string;
  editingFood?: FoodItem;
  editingGroupFoodId?: string;
  initialAmount?: number;
  initialGroupName?: string;
  mode: 'add' | 'edit' | 'search';
  onClose: () => void;
  onSelect: (food: FoodItem, amount: number) => void;
}

export const FoodModal = ({
  dateId,
  editingFood,
  editingGroupFoodId,
  initialAmount,
  initialGroupName,
  mode,
  onClose,
  onSelect,
}: FoodModalProps) => {
  const defaultTab: TabId = initialGroupName ? 'groups' : mode === 'edit' ? 'custom' : 'search';
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  return (
    <div className="food-modal-overlay" onClick={onClose}>
      <div
        className="food-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        ref={modalRef}
      >
        <div className="food-modal-header">
          <h2>{mode === 'edit' || editingGroupFoodId ? 'Edit Food' : 'Add Food'}</h2>

          <button className="close-btn" onClick={onClose}>
            <XMarkIcon className="btn-icon" />
          </button>
        </div>

        {mode !== 'edit' && (
          <div className="food-modal-tabs">
            {!editingGroupFoodId && (
              <>
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
              </>
            )}

            <button
              className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              Groups
            </button>

            {!editingGroupFoodId && (
              <>
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
              </>
            )}
          </div>
        )}

        <div className="food-modal-body">
          {activeTab === 'search' && <SearchTab onSelect={onSelect} />}

          {activeTab === 'recent' && (
            <RecentTab dateId={dateId} onGroupAdded={onClose} onSelect={onSelect} />
          )}

          {activeTab === 'groups' && (
            <GroupsTab
              dateId={dateId}
              editingFoodId={editingGroupFoodId}
              initialGroupName={initialGroupName}
              onGroupAdded={onClose}
            />
          )}

          {activeTab === 'custom' && (
            <CustomTab
              editingFood={editingFood}
              initialAmount={initialAmount}
              onSelect={onSelect}
            />
          )}

          {activeTab === 'quick-add' && dateId && <QuickAddTab dateId={dateId} onSaved={onClose} />}
        </div>
      </div>
    </div>
  );
};
