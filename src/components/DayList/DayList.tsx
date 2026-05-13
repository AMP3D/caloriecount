import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EllipsisVerticalIcon, PlusIcon, TrashIcon } from '../../assets/icons';
import type { FoodItem } from '../../models';
import { daySummaries } from '../../state';
import {
  addDayFoodEntry,
  deleteDaySummaries,
  exportDatabase,
  getTodayId,
  importDatabase,
  loadDaySummaries,
} from '../../storage/actions';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { FoodModal } from '../FoodModal/FoodModal';
import './DayList.scss';

export const DayList = () => {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDaySummaries();
  }, []);

  useEffect(() => {
    if (!showMenu) {
      return;
    }

    const handleClickOutside = () => setShowMenu(false);

    document.addEventListener('click', handleClickOutside);

    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const summaries = daySummaries.value;
  const isSelecting = selectedDates.size > 0;

  const confirmDelete = async () => {
    await deleteDaySummaries(Array.from(selectedDates));
    setSelectedDates(new Set());
    setShowConfirm(false);
  };

  const handleDeleteSelected = () => {
    setShowConfirm(true);
  };

  const handleExport = async () => {
    setShowMenu(false);
    await exportDatabase();
  };

  const handleFoodSelected = (food: FoodItem, amount: number) => {
    if (amount > 0) {
      addDayFoodEntry(getTodayId(), food.id, amount);
    }

    setShowFoodModal(false);
  };

  const handleImport = () => {
    setShowMenu(false);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      await importDatabase(file);
    }

    e.target.value = '';
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleRowClick = (dateId: string) => {
    if (isSelecting) {
      handleToggleSelect(dateId);
    } else {
      navigate(`/day/${dateId}`);
    }
  };

  const handleToggleSelect = (dateId: string) => {
    const next = new Set(selectedDates);

    if (next.has(dateId)) {
      next.delete(dateId);
    } else {
      next.add(dateId);
    }

    setSelectedDates(next);
  };

  return (
    <div className="day-list-page">
      <header className="menu-bar">
        <h1 className="app-title">Calorie Counter</h1>

        <div className="menu-actions">
          {isSelecting && (
            <button className="menu-btn delete" onClick={handleDeleteSelected}>
              <TrashIcon className="btn-icon" />
              Delete ({selectedDates.size})
            </button>
          )}

          <button className="menu-btn" onClick={() => setShowFoodModal(true)}>
            <PlusIcon className="btn-icon" />
            Food
          </button>

          <div className="header-menu-wrapper">
            <button className="header-menu-btn" onClick={handleMenuToggle}>
              <EllipsisVerticalIcon className="btn-icon" />
            </button>

            {showMenu && (
              <div className="header-dropdown">
                <button className="dropdown-item" onClick={handleExport}>
                  Export DB
                </button>

                <button className="dropdown-item" onClick={handleImport}>
                  Import DB
                </button>
              </div>
            )}
          </div>

          <input
            accept=".json"
            hidden
            onChange={handleImportFile}
            ref={fileInputRef}
            type="file"
          />
        </div>
      </header>

      <main className="day-list">
        {summaries.length === 0 && (
          <p className="empty-state">No entries yet. Add food to get started!</p>
        )}

        {summaries.map((day) => (
          <div
            className={`day-row ${selectedDates.has(day.dateId) ? 'selected' : ''}`}
            key={day.dateId}
            onClick={() => handleRowClick(day.dateId)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleToggleSelect(day.dateId);
            }}
          >
            {isSelecting && (
              <input
                checked={selectedDates.has(day.dateId)}
                className="day-checkbox"
                onChange={() => handleToggleSelect(day.dateId)}
                onClick={(e) => e.stopPropagation()}
                type="checkbox"
              />
            )}

            <span className="day-label">{day.displayLabel}</span>

            <span className="day-cals">{day.calories} cal</span>
          </div>
        ))}
      </main>

      {showConfirm && (
        <ConfirmDialog
          message={`Delete ${selectedDates.size} day(s) and all their entries?`}
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}

      {showFoodModal && (
        <FoodModal
          dateId={getTodayId()}
          mode="add"
          onClose={() => setShowFoodModal(false)}
          onSelect={handleFoodSelected}
        />
      )}
    </div>
  );
};
