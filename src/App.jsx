import React, { useState, useEffect, useMemo } from 'react';
import {
  getLocalDateKey,
  formatDisplayDate,
  getAdjacentDateKey,
  getCurrentLocalTime,
  getDayData,
  updateDayEntry,
  loadAllData,
  saveAllData,
  importDataJson,
  exportDataJson,
  PREPARED_PAST_DATA,
} from './storage.js';
import TrackerRow from './TrackerRow.jsx';
import { usePWAInstall } from './usePWAInstall.js';

export default function App() {
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [dayData, setDayData] = useState(() => getDayData(todayKey));
  const [editingSet, setEditingSet] = useState(null);

  // Data management modal
  const [showDataModal, setShowDataModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [dataFeedback, setDataFeedback] = useState('');

  const {
    isInstallable,
    isIOS,
    showGuide,
    setShowGuide,
    triggerInstall,
  } = usePWAInstall();

  // Reload data whenever selected date changes
  useEffect(() => {
    setDayData(getDayData(selectedDateKey));
    setEditingSet(null);
  }, [selectedDateKey]);

  // Compute completed sets and total units
  const completedCount = useMemo(() => {
    return Object.values(dayData).filter(Boolean).length;
  }, [dayData]);

  const completedUnits = completedCount * 8;
  const isToday = selectedDateKey === todayKey;

  // Normal entry activation (double click/tap)
  const handleActivate = (setNumber) => {
    const currentTime = getCurrentLocalTime();
    const updated = updateDayEntry(selectedDateKey, setNumber, currentTime);
    setDayData(updated);
  };

  // Editing handlers
  const handleStartEdit = (setNumber) => {
    setEditingSet(setNumber);
  };

  const handleSaveEdit = (setNumber, timeString) => {
    const updated = updateDayEntry(selectedDateKey, setNumber, timeString);
    setDayData(updated);
    setEditingSet(null);
  };

  const handleClearEdit = (setNumber) => {
    const updated = updateDayEntry(selectedDateKey, setNumber, null);
    setDayData(updated);
    setEditingSet(null);
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
  };

  // Date navigation
  const handlePrevDay = () => {
    setSelectedDateKey((curr) => getAdjacentDateKey(curr, -1));
  };

  const handleNextDay = () => {
    setSelectedDateKey((curr) => getAdjacentDateKey(curr, 1));
  };

  const handleTodayClick = () => {
    setSelectedDateKey(todayKey);
  };

  // Import / Export actions
  const handleImportPastData = () => {
    const current = loadAllData();
    saveAllData({ ...current, ...PREPARED_PAST_DATA });
    setSelectedDateKey('2026-10-01'); // Automatically take the user to Oct 1 to view their imported records!
    setDayData(getDayData('2026-10-01'));
    setDataFeedback('Imported 5 days of practice! Navigated to Oct 1, 2026.');
  };

  const handleCustomImportSubmit = (e) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importDataJson(importJsonText.trim());
    if (res.success) {
      setDayData(getDayData(selectedDateKey));
      setDataFeedback('Custom data imported successfully into phone storage!');
      setImportJsonText('');
      setTimeout(() => setDataFeedback(''), 4000);
    } else {
      setDataFeedback(res.error || 'Failed to import data');
    }
  };

  const handleExportData = () => {
    const json = exportDataJson();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        setDataFeedback('All stored records copied to clipboard as JSON!');
        setTimeout(() => setDataFeedback(''), 4000);
      });
    } else {
      setImportJsonText(json);
      setDataFeedback('Exported data shown in text box below:');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col justify-between items-center py-5 sm:py-8 px-4 sm:px-6 selection:bg-neutral-200 touch-pan-y">
      <main className="w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center">
        {/* Top Header Bar with prominent Backup & Import button */}
        <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Daily Tracker
          </span>
          <button
            type="button"
            onClick={() => setShowDataModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200/90 hover:border-neutral-400 text-xs font-semibold text-neutral-700 hover:text-neutral-950 shadow-2xs transition cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Backup &amp; Import
          </button>
        </div>

        {/* Date Navigation */}
        <div className="w-full flex items-center justify-between text-neutral-700 mb-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-neutral-200/90 hover:text-neutral-950 active:bg-neutral-100 transition cursor-pointer shadow-2xs touch-manipulation"
            aria-label="Previous day"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {formatDisplayDate(selectedDateKey)}
            </span>
            {!isToday && (
              <button
                type="button"
                onClick={handleTodayClick}
                className="mt-1 text-xs font-medium text-neutral-600 hover:text-neutral-950 underline underline-offset-2 transition cursor-pointer py-0.5 px-2"
              >
                Return to Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-neutral-200/90 hover:text-neutral-950 active:bg-neutral-100 transition cursor-pointer shadow-2xs touch-manipulation"
            aria-label="Next day"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Progress Display: Large, Calm & Prominent */}
        <div className="my-3 sm:my-4 text-center">
          <div className="text-5xl sm:text-6xl font-semibold tracking-tight text-neutral-900 tabular-nums">
            {completedUnits} / 80
          </div>
          {/* Progress Bar */}
          <div className="w-64 sm:w-72 h-2 bg-neutral-200/80 rounded-full mx-auto mt-3 overflow-hidden">
            <div
              className="h-full bg-neutral-900 transition-all duration-300"
              style={{ width: `${Math.min(100, (completedUnits / 80) * 100)}%` }}
            />
          </div>
        </div>

        {/* Column Headers & Ten Sets Table */}
        <div className="w-full bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-xs sm:text-sm uppercase tracking-wider font-medium text-neutral-400 bg-neutral-100/70 border-b border-neutral-200/80">
            <span className="w-14 text-left text-neutral-400 font-normal">Set</span>
            <span className="w-16 text-center text-neutral-700 font-semibold">Units</span>
            <span className="flex-1 text-right text-neutral-700 font-semibold">Time</span>
          </div>

          <div className="divide-y divide-neutral-200/70">
            {Array.from({ length: 10 }, (_, index) => {
              const setNumber = String(index + 1);
              return (
                <TrackerRow
                  key={setNumber}
                  setNumber={setNumber}
                  units={8}
                  time={dayData[setNumber]}
                  isEditing={editingSet === setNumber}
                  onActivate={handleActivate}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onClearEdit={handleClearEdit}
                />
              );
            })}
          </div>
        </div>

        {/* Secondary interaction hint */}
        <p className="mt-3 text-center text-xs text-neutral-400">
          Double-tap empty set to log current time &bull; Press and hold to edit or remove
        </p>

        {/* Prominent Action Buttons: Backup & Import + Install */}
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setShowDataModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:text-neutral-950 hover:bg-neutral-50 active:bg-neutral-100 transition shadow-2xs cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Backup &amp; Import Data
          </button>

          {isInstallable && (
            <button
              type="button"
              onClick={triggerInstall}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:text-neutral-950 hover:bg-neutral-50 active:bg-neutral-100 transition shadow-2xs cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Install as App
            </button>
          )}
        </div>

        {/* In-App Installation Guide Modal */}
        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={() => setShowGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-neutral-900">
                Install to Home Screen
              </h3>

              {isIOS ? (
                <div className="mt-3 text-sm text-neutral-600 space-y-2">
                  <p>
                    1. Tap the <strong>Share</strong> button (the square with an arrow) in the Safari toolbar.
                  </p>
                  <p>
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                  <p>
                    3. Tap <strong>Add</strong> in the top-right corner.
                  </p>
                </div>
              ) : (
                <div className="mt-3 text-sm text-neutral-600 space-y-2">
                  <p>
                    1. Tap the <strong>three dots (⋮)</strong> menu at the top right of Chrome.
                  </p>
                  <p>
                    2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                  <p>
                    3. Confirm <strong>Install</strong> to add it to your home screen.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 active:bg-neutral-950 transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Data Management / Import Modal */}
        {showDataModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={() => setShowDataModal(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  Backup &amp; Import Data
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDataModal(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {dataFeedback && (
                <div className="mt-3 p-3 bg-neutral-100 rounded-xl text-xs sm:text-sm text-neutral-800 font-medium">
                  {dataFeedback}
                </div>
              )}

              {/* 1-Tap Load Past Practice Records */}
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <h4 className="text-sm font-semibold text-neutral-900">
                  Load Past Days (Oct 1 – Oct 5)
                </h4>
                <p className="mt-1 text-xs text-neutral-500">
                  Instantly writes your 5 days of past practice records into your phone's storage.
                </p>
                <button
                  type="button"
                  onClick={handleImportPastData}
                  className="mt-3 w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  Import Oct 1–5 Practice Records
                </button>
              </div>

              {/* Export Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full py-2 px-3 rounded-xl border border-neutral-300 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Copy All Stored Data (Backup)
                </button>
              </div>

              {/* Custom JSON Paste */}
              <form onSubmit={handleCustomImportSubmit} className="mt-4">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Custom Import / Paste Data (JSON):
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"2026-10-01": {"1": "06:55", ...}}'
                  rows={3}
                  className="w-full text-xs font-mono p-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  disabled={!importJsonText.trim()}
                  className="mt-2 w-full py-2 px-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40 text-neutral-800 text-xs font-semibold transition cursor-pointer"
                >
                  Import Pasted Data
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowDataModal(false)}
                className="mt-4 w-full py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center text-xs text-neutral-400 mt-6">
        Daily target: 80 units
      </footer>
    </div>
  );
}
