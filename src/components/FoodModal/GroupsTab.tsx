import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  XMarkIcon,
} from '../../assets/icons';
import type { FoodGroup, FoodItem } from '../../models';
import { foodDatabase, foodGroups, recentFoods } from '../../state';
import {
  addFoodGroup,
  addGroupToDay,
  addItemToGroup,
  deleteFoodGroup,
  loadFoodDatabase,
  loadFoodGroups,
  loadRecentFoods,
  removeItemFromGroup,
  reorderItemInGroup,
  updateFoodGroup,
  updateGroupForDay,
  updateItemInGroup,
} from '../../storage/actions';
import './GroupsTab.scss';

interface GroupsTabProps {
  dateId?: string;
  editingFoodId?: string;
  initialGroupName?: string;
  onGroupAdded?: () => void;
}

export const GroupsTab = ({
  dateId,
  editingFoodId,
  initialGroupName,
  onGroupAdded,
}: GroupsTabProps) => {
  const [editingGroup, setEditingGroup] = useState<FoodGroup | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemAmountOverrides, setItemAmountOverrides] = useState<Record<string, string>>({});
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const groupNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFoodDatabase();
    loadFoodGroups();
    loadRecentFoods();

    // Focus on group name input when component mounts
    if (groupNameInputRef.current) {
      groupNameInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!initialGroupName || foodGroups.value.length === 0) {
      return;
    }

    const match = foodGroups.value.find(
      (g) => g.name.toLowerCase() === initialGroupName.toLowerCase(),
    );

    if (match) {
      setEditingGroup(match);
      setEditingGroupName(match.name);
    }
  }, [initialGroupName, foodGroups.value]);

  const filteredFoods = useMemo(() => {
    if (!itemSearchQuery.trim()) {
      return [];
    }

    const query = itemSearchQuery.toLowerCase();

    return foodDatabase.value.filter(
      (f) => f.name.toLowerCase().includes(query) || f.brand.toLowerCase().includes(query),
    );
  }, [foodDatabase.value, itemSearchQuery]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return foodGroups.value.filter((g) => g.name.toLowerCase().includes(query));
  }, [foodGroups.value, searchQuery]);

  const groupItemDetails = useMemo(() => {
    if (!editingGroup) {
      return [];
    }

    const foodMap = new Map(foodDatabase.value.map((f) => [f.id, f]));

    return editingGroup.items.map((item) => {
      const food = foodMap.get(item.foodId);

      return {
        amount: item.amount,
        calories: food ? Math.round((item.amount / food.servingSize) * food.caloriesPerServing) : 0,
        food,
        id: item.id,
        name: food?.name ?? 'Unknown',
      };
    });
  }, [editingGroup, foodDatabase.value]);

  const groupTotalCalories = useMemo(() => {
    return groupItemDetails.reduce((sum, item) => sum + item.calories, 0);
  }, [groupItemDetails]);

  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      return;
    }

    const group = await addFoodGroup(groupName.trim());

    setEditingGroup(group);
    setEditingGroupName(group.name);
    setGroupName('');
    setShowCreateForm(false);
  };

  const handleCloneGroup = async (group: FoodGroup) => {
    const clonedGroup = await addFoodGroup(`(Copy) ${group.name}`);

    for (const item of group.items) {
      await addItemToGroup(clonedGroup.id, {
        amount: item.amount,
        foodId: item.foodId,
      });
    }

    const updated = foodGroups.value.find((g) => g.id === clonedGroup.id);

    if (updated) {
      setEditingGroup(updated);
      setEditingGroupName(updated.name);
    }
  };

  const handleAddItemToGroup = async () => {
    if (!editingGroup || !selectedFood) {
      return;
    }

    const parsedAmount = parseFloat(itemAmount);
    const amount = parsedAmount > 0 ? parsedAmount : selectedFood.servingSize;

    await addItemToGroup(editingGroup.id, {
      amount,
      foodId: selectedFood.id,
    });

    const updated = foodGroups.value.find((g) => g.id === editingGroup.id);

    if (updated) {
      setEditingGroup(updated);
    }

    setItemAmount('');
    setItemSearchQuery('');
    setSelectedFood(null);
  };

  const handleAddRecentToGroup = (food: FoodItem) => {
    setSelectedFood(food);
    setItemSearchQuery(food.name);
  };

  const handleAddToDay = async (group: FoodGroup, overrideName?: string) => {
    if (!dateId || group.items.length === 0) {
      return;
    }

    const toAdd = overrideName ? { ...group, name: overrideName } : group;

    await addGroupToDay(dateId, toAdd);
    await updateFoodGroup(toAdd);

    onGroupAdded?.();

    if (!editingGroup || !editingGroupName.trim()) {
      return;
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteFoodGroup(groupId);

    if (editingGroup?.id === groupId) {
      setEditingGroup(null);
    }
  };

  const handleItemAmountBlur = async (itemId: string, value: string) => {
    if (!editingGroup) {
      return;
    }

    setItemAmountOverrides((prev) => {
      const next = { ...prev };

      delete next[itemId];

      return next;
    });

    const parsedAmount = parseFloat(value);

    if (parsedAmount > 0) {
      await updateItemInGroup(editingGroup.id, itemId, parsedAmount);
    }
  };

  const handleItemAmountChange = (itemId: string, value: string) => {
    if (!editingGroup) {
      return;
    }

    setItemAmountOverrides((prev) => ({ ...prev, [itemId]: value }));

    const parsedAmount = parseFloat(value);

    if (parsedAmount > 0) {
      const updatedItems = editingGroup.items.map((item) =>
        item.id === itemId ? { ...item, amount: parsedAmount } : item,
      );

      setEditingGroup({ ...editingGroup, items: updatedItems });
    }
  };

  const handleReorderItem = async (itemId: string, direction: 'down' | 'up') => {
    if (!editingGroup) {
      return;
    }

    await reorderItemInGroup(editingGroup.id, itemId, direction);

    const updated = foodGroups.value.find((g) => g.id === editingGroup.id);

    if (updated) {
      setEditingGroup(updated);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!editingGroup) {
      return;
    }

    await removeItemFromGroup(editingGroup.id, itemId);

    const updated = foodGroups.value.find((g) => g.id === editingGroup.id);

    if (updated) {
      setEditingGroup(updated);
    }
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !editingGroupName.trim()) {
      return;
    }

    const updated = { ...editingGroup, name: editingGroupName.trim() };

    await updateFoodGroup(updated);
    setEditingGroup(updated);
    setEditingGroup(null);
  };

  const handleUpdateForDay = async (group: FoodGroup) => {
    if (!dateId || !editingFoodId) {
      return;
    }

    const withName = { ...group, name: editingGroupName.trim() || group.name };

    await updateGroupForDay(dateId, editingFoodId, withName);
    onGroupAdded?.();
  };

  if (editingGroup) {
    return (
      <div className="groups-detail">
        {!editingFoodId && (
          <button className="add-btn groups-back-btn" onClick={() => setEditingGroup(null)}>
            <ArrowLeftIcon className="btn-icon" />
            Back to Groups
          </button>
        )}

        <div className="groups-detail-header">
          <textarea
            className="search-input"
            onChange={(e) => setEditingGroupName(e.target.value)}
            placeholder="Group name"
            value={editingGroupName}
          />

          <span className="groups-total">{groupTotalCalories} cal total</span>
        </div>

        <div className="groups-items-list">
          {groupItemDetails.length === 0 && (
            <p className="no-results">No items yet. Search or pick from recent foods below.</p>
          )}

          {groupItemDetails.map((item, index) => (
            <div className="groups-item-row" key={item.id}>
              <div className="groups-item-reorder">
                <button
                  className="groups-reorder-btn"
                  disabled={index === 0}
                  onClick={() => handleReorderItem(item.id, 'up')}
                >
                  <ChevronUpIcon className="btn-icon" />
                </button>

                <button
                  className="groups-reorder-btn"
                  disabled={index === groupItemDetails.length - 1}
                  onClick={() => handleReorderItem(item.id, 'down')}
                >
                  <ChevronDownIcon className="btn-icon" />
                </button>
              </div>

              <div className="groups-item-info">
                <span className="groups-item-brand">{item.food?.brand}</span>
                <span className="groups-item-name">{item.name}</span>
                <span className="groups-item-meta">{item.calories} cal</span>
              </div>

              <div className="groups-item-controls">
                <input
                  className="groups-item-amount-input"
                  onBlur={(e) => handleItemAmountBlur(item.id, e.target.value)}
                  onChange={(e) => handleItemAmountChange(item.id, e.target.value)}
                  type="number"
                  value={itemAmountOverrides[item.id] ?? item.amount}
                />

                <span className="groups-item-meta">g</span>

                <button className="groups-remove-btn" onClick={() => handleRemoveItem(item.id)}>
                  <XMarkIcon className="btn-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {recentFoods.value.length > 0 && (
          <div className="groups-recent-section">
            <span className="groups-section-label">Recent Foods</span>

            <div className="groups-recent-list">
              {recentFoods.value.slice(0, 5).map((food) => (
                <div
                  className={`food-list-item ${selectedFood?.id === food.id ? 'selected' : ''}`}
                  key={food.id}
                  onClick={() => handleAddRecentToGroup(food)}
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
            </div>
          </div>
        )}

        <div className="groups-add-item">
          <input
            className="search-input"
            onChange={(e) => {
              setItemSearchQuery(e.target.value);
              setSelectedFood(null);
            }}
            placeholder="Search food to add..."
            type="text"
            value={itemSearchQuery}
          />

          {filteredFoods.length > 0 && (
            <div className="food-list groups-food-search-results">
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
                    {Math.round(food.caloriesPerServing)} cal / {food.servingSize}g
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFood && (
            <div className="amount-row">
              <input
                className="amount-input"
                onChange={(e) => setItemAmount(e.target.value)}
                placeholder={`Amount (g) — default: ${selectedFood.servingSize}g`}
                type="number"
                value={itemAmount}
              />

              <button className="add-btn" onClick={handleAddItemToGroup}>
                Add to Group
              </button>
            </div>
          )}
        </div>

        {!editingFoodId && (
          <button
            className={`save-btn ${!editingGroupName.trim() ? 'disabled' : ''}`}
            disabled={!editingGroupName.trim()}
            onClick={handleSaveGroup}
          >
            Save Group
          </button>
        )}

        {dateId && editingGroup.items.length > 0 && (
          <button
            className="save-btn"
            onClick={() =>
              editingFoodId
                ? handleUpdateForDay(editingGroup)
                : handleAddToDay(editingGroup, editingGroupName.trim() || undefined)
            }
          >
            {editingFoodId ? 'Save Changes' : 'Add Group to Day'} ({groupTotalCalories} cal)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="groups-list-view">
      <input
        className="search-input"
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search groups..."
        type="text"
        value={searchQuery}
      />

      {showCreateForm ? (
        <div className="groups-create-form">
          <input
            className="search-input"
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddGroup();
              }
            }}
            placeholder="Group name (required)"
            ref={groupNameInputRef}
            type="text"
            value={groupName}
          />

          <button
            className={`save-btn ${!groupName.trim() ? 'disabled' : ''}`}
            disabled={!groupName.trim()}
            onClick={handleAddGroup}
          >
            Create Group
          </button>
        </div>
      ) : (
        <button className="save-btn" onClick={() => setShowCreateForm(true)}>
          + New Group
        </button>
      )}

      <div className="food-list">
        {filteredGroups.map((group) => {
          const foodMap = new Map(foodDatabase.value.map((f) => [f.id, f]));

          const totalCals = group.items.reduce((sum, item) => {
            const food = foodMap.get(item.foodId);

            if (!food) {
              return sum;
            }

            return sum + Math.round((item.amount / food.servingSize) * food.caloriesPerServing);
          }, 0);

          return (
            <div className="food-list-item groups-list-item" key={group.id}>
              <div
                className="food-info"
                onClick={() => {
                  setEditingGroup(group);
                  setEditingGroupName(group.name);
                }}
              >
                <div className="food-brand">{group.items.length} item(s)</div>
                <div className="food-name">{group.name}</div>
              </div>

              <div className="groups-list-actions">
                <span className="food-cals">{totalCals} cal</span>

                {dateId && group.items.length > 0 && (
                  <button className="groups-action-btn" onClick={() => handleAddToDay(group)}>
                    <PlusIcon className="btn-icon" />
                  </button>
                )}

                <button className="groups-action-btn" onClick={() => handleCloneGroup(group)}>
                  <DocumentDuplicateIcon className="btn-icon" />
                </button>

                <button className="groups-remove-btn" onClick={() => handleDeleteGroup(group.id)}>
                  <XMarkIcon className="btn-icon" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredGroups.length === 0 && !showCreateForm && (
          <p className="no-results">No groups found. Create one to get started.</p>
        )}
      </div>
    </div>
  );
};
