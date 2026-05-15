import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ArrowLeftIcon, EllipsisVerticalIcon, PlusIcon, TrashIcon } from '../../assets/icons';
import type { DayFoodEntryWithDetails, FoodGroupItem, FoodItem } from '../../models';
import { currentDayEntries, foodGroups } from '../../state';
import {
  addDayFoodEntry,
  addItemToGroup,
  deleteDayFoodEntries,
  loadDayEntries,
  loadFoodGroups,
  updateDayFoodEntry,
  updateFoodItem,
} from '../../storage/actions';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { FoodModal } from '../FoodModal/FoodModal';
import './DayDetail.scss';

export const DayDetail = () => {
  const { dateId } = useParams<{ dateId: string }>();

  const navigate = useNavigate();

  const [addToGroupEntry, setAddToGroupEntry] = useState<DayFoodEntryWithDetails | null>(null);
  const [editingEntry, setEditingEntry] = useState<DayFoodEntryWithDetails | null>(null);
  const [editingGroupFoodId, setEditingGroupFoodId] = useState<string | undefined>(undefined);
  const [initialGroupItems, setInitialGroupItems] = useState<FoodGroupItem[] | undefined>(undefined);
  const [initialGroupName, setInitialGroupName] = useState<string | undefined>(undefined);
  const [menuEntryId, setMenuEntryId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'search'>('add');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { title } = useMemo(() => {
    if (!dateId) {
      return {
        title: 'Today',
      };
    }

    const isToday = new Date(dateId).toDateString() === new Date().toDateString();
    const dateTitle = new Date(dateId).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const title = (
      <div>
        {isToday && <div>Today</div>}
        <div>{dateTitle}</div>
      </div>
    );

    return { title };
  }, [dateId]);

  useEffect(() => {
    if (dateId) {
      loadDayEntries(dateId);
    }
  }, [dateId]);

  useEffect(() => {
    if (menuEntryId === null) {
      return;
    }

    const handleClickOutside = () => setMenuEntryId(null);

    document.addEventListener('click', handleClickOutside);

    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuEntryId]);

  const entries = currentDayEntries.value;
  const isSelecting = selectedEntries.size > 0;
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  const editingFoodItem: FoodItem | undefined = editingEntry
    ? {
        brand: editingEntry.brand,
        caloriesPerServing:
          editingEntry.amount > 0
            ? (editingEntry.calories * editingEntry.servingSize) / editingEntry.amount
            : 0,
        carbsPerServing:
          editingEntry.amount > 0
            ? (editingEntry.carbs * editingEntry.servingSize) / editingEntry.amount
            : 0,
        fatPerServing:
          editingEntry.amount > 0
            ? (editingEntry.fat * editingEntry.servingSize) / editingEntry.amount
            : 0,
        id: editingEntry.foodId,
        name: editingEntry.name,
        proteinPerServing:
          editingEntry.amount > 0
            ? (editingEntry.protein * editingEntry.servingSize) / editingEntry.amount
            : 0,
        servingSize: editingEntry.servingSize,
      }
    : undefined;

  const confirmDelete = async () => {
    if (dateId) {
      await deleteDayFoodEntries(Array.from(selectedEntries), dateId);
    }

    setSelectedEntries(new Set());
    setShowConfirm(false);
  };

  const handleAddToGroup = async (entry: DayFoodEntryWithDetails, groupId: string) => {
    await addItemToGroup(groupId, { amount: entry.amount, foodId: entry.foodId });
    setAddToGroupEntry(null);
    setMenuEntryId(null);
  };

  const handleDeleteSelected = () => {
    setShowConfirm(true);
  };

  const handleDeleteSingle = async (entry: DayFoodEntryWithDetails) => {
    setMenuEntryId(null);

    if (dateId) {
      await deleteDayFoodEntries([entry.id], dateId);
    }
  };

  const handleEntryClick = (entry: DayFoodEntryWithDetails) => {
    if (isSelecting) {
      handleToggleSelect(entry.id);
      return;
    }

    if (entry.brand === 'Quick Add') {
      return;
    }

    if (entry.brand === 'Group') {
      setEditingGroupFoodId(entry.id);
      setInitialGroupItems(entry.groupItems);
      setInitialGroupName(entry.name);
      setEditingEntry(null);
      setModalMode('add');
      setShowModal(true);
      return;
    }

    handleOpenEdit(entry);
  };

  const handleFoodSelected = async (food: FoodItem, amount: number) => {
    if (!dateId) {
      return;
    }

    if (editingEntry) {
      await updateFoodItem(food);

      if (amount > 0) {
        await updateDayFoodEntry(editingEntry.id, dateId, amount);
      }
    } else if (amount > 0) {
      await addDayFoodEntry(dateId, food.id, amount);
    }

    setShowModal(false);
    setEditingEntry(null);
  };

  const handleMenuToggle = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    setMenuEntryId(menuEntryId === entryId ? null : entryId);
  };

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setEditingGroupFoodId(undefined);
    setInitialGroupItems(undefined);
    setInitialGroupName(undefined);
    setModalMode('add');
    setShowModal(true);
  };

  const handleOpenAddToGroup = (entry: DayFoodEntryWithDetails) => {
    loadFoodGroups();
    setAddToGroupEntry(entry);
    setMenuEntryId(null);
  };

  const handleOpenEdit = (entry: DayFoodEntryWithDetails) => {
    setEditingEntry(entry);
    setMenuEntryId(null);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleToggleSelect = (entryId: string) => {
    const next = new Set(selectedEntries);

    if (next.has(entryId)) {
      next.delete(entryId);
    } else {
      next.add(entryId);
    }

    setSelectedEntries(next);
  };

  return (
    <div className="day-detail-page">
      <header className="detail-menu-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeftIcon className="btn-icon" />
        </button>

        <h1 className="detail-title">{title}</h1>

        <div className="detail-actions">
          {isSelecting && (
            <button className="detail-btn delete" onClick={handleDeleteSelected}>
              <TrashIcon className="btn-icon" />
              Delete ({selectedEntries.size})
            </button>
          )}

          <button className="detail-btn" onClick={handleOpenAdd}>
            <PlusIcon className="btn-icon" />
            Add
          </button>
        </div>
      </header>

      <div className="total-calories">
        <div className="total-label">Total</div>
        <div className="total-value">{totalCalories} cal</div>
      </div>

      <main className="entry-list">
        {entries.length === 0 && <p className="empty-state">No food logged. Tap + Add to start.</p>}

        {entries.map((entry) => (
          <div
            className={`entry-row ${selectedEntries.has(entry.id) ? 'selected' : ''}`}
            key={entry.id}
            onClick={() => handleEntryClick(entry)}
          >
            <input
              checked={selectedEntries.has(entry.id)}
              className="entry-checkbox"
              onChange={() => handleToggleSelect(entry.id)}
              onClick={(e) => e.stopPropagation()}
              type="checkbox"
            />

            <div className="entry-info">
              <span className="entry-brand">{entry.brand}</span>
              <span className="entry-name">{entry.name}</span>
              <span className="entry-time">{new Date(entry.createdAt).toLocaleTimeString()}</span>
            </div>

            <div className="entry-meta">
              <span className="entry-cals">{entry.calories} cal</span>

              {entry.brand !== 'Quick Add' && <span className="entry-amount">{entry.amount}g</span>}
            </div>

            <div className="entry-menu-wrapper">
              <button className="entry-menu-btn" onClick={(e) => handleMenuToggle(e, entry.id)}>
                <EllipsisVerticalIcon className="btn-icon" />
              </button>

              {menuEntryId === entry.id && (
                <div className="entry-dropdown">
                  {entry.brand !== 'Group' && (
                    <button
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddToGroup(entry);
                      }}
                    >
                      Add to Group
                    </button>
                  )}

                  <button
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(entry);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="dropdown-item delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingle(entry);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {showConfirm && (
        <ConfirmDialog
          message={`Delete ${selectedEntries.size} food entry(s)?`}
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}

      {addToGroupEntry && (
        <div className="food-modal-overlay" onClick={() => setAddToGroupEntry(null)}>
          <div className="group-picker" onClick={(e) => e.stopPropagation()}>
            <h3>Add "{addToGroupEntry.name}" to Group</h3>

            <div className="group-picker-list">
              {foodGroups.value.map((group) => (
                <button
                  className="group-picker-item"
                  key={group.id}
                  onClick={() => handleAddToGroup(addToGroupEntry, group.id)}
                >
                  {group.name}
                </button>
              ))}

              {foodGroups.value.length === 0 && (
                <p className="no-results">No groups yet. Create one in the Groups tab.</p>
              )}
            </div>

            <button className="save-btn" onClick={() => setAddToGroupEntry(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <FoodModal
          dateId={dateId}
          editingFood={editingFoodItem}
          editingGroupFoodId={editingGroupFoodId}
          initialAmount={editingEntry?.amount}
          initialGroupItems={initialGroupItems}
          initialGroupName={initialGroupName}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
            setEditingGroupFoodId(undefined);
            setInitialGroupItems(undefined);
            setInitialGroupName(undefined);
          }}
          onSelect={handleFoodSelected}
        />
      )}
    </div>
  );
};
