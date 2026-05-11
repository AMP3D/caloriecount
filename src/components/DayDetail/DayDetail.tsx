import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ArrowLeftIcon, EllipsisVerticalIcon, PlusIcon, TrashIcon } from '../../assets/icons';
import type { DayFoodEntryWithDetails, FoodItem } from '../../models';
import { currentDayEntries } from '../../state';
import {
  addDayFoodEntry,
  deleteDayFoodEntries,
  loadDayEntries,
  updateDayFoodEntry,
  updateFoodItem,
} from '../../storage/actions';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { FoodModal } from '../FoodModal/FoodModal';
import './DayDetail.scss';

export const DayDetail = () => {
  const { dateId } = useParams<{ dateId: string }>();

  const navigate = useNavigate();

  const [editingEntry, setEditingEntry] = useState<DayFoodEntryWithDetails | null>(null);
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

  const handleToggleSelect = (entryId: string) => {
    const next = new Set(selectedEntries);

    if (next.has(entryId)) {
      next.delete(entryId);
    } else {
      next.add(entryId);
    }

    setSelectedEntries(next);
  };

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleOpenEdit = (entry: DayFoodEntryWithDetails) => {
    setEditingEntry(entry);
    setMenuEntryId(null);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteSingle = async (entry: DayFoodEntryWithDetails) => {
    setMenuEntryId(null);

    if (dateId) {
      await deleteDayFoodEntries([entry.id], dateId);
    }
  };

  const handleDeleteSelected = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (dateId) {
      await deleteDayFoodEntries(Array.from(selectedEntries), dateId);
    }

    setSelectedEntries(new Set());
    setShowConfirm(false);
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
          >
            <input
              checked={selectedEntries.has(entry.id)}
              className="entry-checkbox"
              onChange={() => handleToggleSelect(entry.id)}
              type="checkbox"
            />

            <div className="entry-info">
              <span className="entry-brand">{entry.brand}</span>
              <span className="entry-name">{entry.name}</span>
              <span className="entry-time">{new Date(entry.createdAt).toLocaleTimeString()}</span>
            </div>

            <div className="entry-meta">
              <span className="entry-cals">{entry.calories} cal</span>

              {entry.brand !== 'Quick Add' && (
                <span className="entry-amount">{entry.amount}g</span>
              )}
            </div>

            <div className="entry-menu-wrapper">
              <button className="entry-menu-btn" onClick={(e) => handleMenuToggle(e, entry.id)}>
                <EllipsisVerticalIcon className="btn-icon" />
              </button>

              {menuEntryId === entry.id && (
                <div className="entry-dropdown">
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

      {showModal && (
        <FoodModal
          editingFood={editingFoodItem}
          initialAmount={editingEntry?.amount}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
          }}
          onSelect={handleFoodSelected}
        />
      )}
    </div>
  );
};
