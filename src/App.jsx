import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  getAllStoredDates,
  ensurePersistentStorage,
  downloadBackupFile,
  MIN_DATE_KEY,
  getMaxDateKey,
} from './storage.js';
import TrackerRow from './TrackerRow.jsx';
import { usePWAInstall } from './usePWAInstall.js';

export default function App() {
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [dayData, setDayData] = useState(() => getDayData(todayKey));
  const [editingSet, setEditingSet] = useState(null);

  // Hidden Data management modal
  const [showDataModal, setShowDataModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [dataFeedback, setDataFeedback] = useState('');
  const [storedDatesList, setStoredDatesList] = useState([]);
  const [isPersisted, setIsPersisted] = useState(false);

  // Long press on header to reveal storage modal (1.8s)
  const headerPressTimer = useRef(null);
  const fileInputRef = useRef(null);

  const {
    isInstallable,
    isIOS,
    showGuide,
    setShowGuide,
    triggerInstall,
  } = usePWAInstall();

  // Date boundaries:
  // Cannot go before 2026-10-01
  // Cannot go beyond tomorrow
  const minDateKey = MIN_DATE_KEY;
  const maxDateKey = useMemo(() => getMaxDateKey(), []);

  const canPrev = selectedDateKey > minDateKey;
  const canNext = selectedDateKey < maxDateKey;

  // Lock storage on mount so Chrome/Android never evicts it
  useEffect(() => {
    ensurePersistentStorage().then((persisted) => {
      setIsPersisted(persisted);
    });
  }, []);

  // Reload data whenever selected date changes
  useEffect(() => {
    setDayData(getDayData(selectedDateKey));
    setEditingSet(null);
  }, [selectedDateKey]);

  // Refresh stored dates list when opening modal
  useEffect(() => {
    if (showDataModal) {
      setStoredDatesList(getAllStoredDates());
    }
  }, [showDataModal, dayData]);

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

  // Date navigation strictly clamped
  const handlePrevDay = () => {
    if (selectedDateKey <= minDateKey) return;
    setSelectedDateKey((curr) => {
      const prev = getAdjacentDateKey(curr, -1);
      return prev < minDateKey ? minDateKey : prev;
    });
  };

  const handleNextDay = () => {
    if (selectedDateKey >= maxDateKey) return;
    setSelectedDateKey((curr) => {
      const next = getAdjacentDateKey(curr, 1);
      return next > maxDateKey ? maxDateKey : next;
    });
  };

  const handleTodayClick = () => {
    setSelectedDateKey(todayKey);
  };

  const handleJumpToDate = (targetDateKey) => {
    setSelectedDateKey(targetDateKey);
    setShowDataModal(false);
  };

  // Header long press handlers (2 seconds)
  const startHeaderPress = () => {
    if (headerPressTimer.current) clearTimeout(headerPressTimer.current);
    headerPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
      setShowDataModal(true);
    }, 1800);
  };

  const cancelHeaderPress = () => {
    if (headerPressTimer.current) {
      clearTimeout(headerPressTimer.current);
      headerPressTimer.current = null;
    }
  };

  // File download and file upload handlers
  const handleDownloadFile = () => {
    downloadBackupFile();
    setDataFeedback('Backup file saved to your phone Downloads folder!');
    setTimeout(() => setDataFeedback(''), 4000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importDataJson(content);
        if (res.success) {
          setDayData(getDayData(selectedDateKey));
          setStoredDatesList(getAllStoredDates());
          setDataFeedback('Backup file uploaded and populated successfully!');
          setTimeout(() => setDataFeedback(''), 4000);
        } else {
          setDataFeedback('Error: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Text JSON paste actions
  const handleCustomImportSubmit = (e) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importDataJson(importJsonText.trim());
    if (res.success) {
      setDayData(getDayData(selectedDateKey));
      setStoredDatesList(getAllStoredDates());
      setDataFeedback('Data restored successfully!');
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
        setDataFeedback('All records copied to clipboard!');
        setTimeout(() => setDataFeedback(''), 4000);
      });
    } else {
      setImportJsonText(json);
      setDataFeedback('Records displayed in text box below:');
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-neutral-50 text-neutral-900 flex flex-col justify-between items-center py-2 sm:py-4 px-3 sm:px-6 selection:bg-neutral-200 overflow-hidden touch-pan-y">
      <main className="w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center flex-1 justify-between">
        {/* Top Header Bar: Long press 2s reveals hidden Storage & Backup */}
        <div
          onMouseDown={startHeaderPress}
          onMouseUp={cancelHeaderPress}
          onMouseLeave={cancelHeaderPress}
          onTouchStart={startHeaderPress}
          onTouchEnd={cancelHeaderPress}
          onTouchCancel={cancelHeaderPress}
          className="w-full flex items-center justify-center py-0.5 select-none cursor-pointer"
          title="Press and hold for 2s for Storage & Backup"
        >
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Daily Tracker
          </span>
        </div>

        {/* Date Navigation (strictly clamped between Oct 1, 2026 and Tomorrow) */}
        <div className="w-full flex items-center justify-between text-neutral-700 my-1">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={!canPrev}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white border border-neutral-200/90 shadow-2xs touch-manipulation transition ${
              canPrev
                ? 'hover:text-neutral-950 active:bg-neutral-100 cursor-pointer'
                : 'opacity-25 cursor-not-allowed'
            }`}
            aria-label="Previous day"
            title={canPrev ? 'Previous day' : 'Cannot go prior to 1st October 2026'}
          >
            <svg
              className="w-5 h-5"
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
            <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
              {formatDisplayDate(selectedDateKey)}
            </span>
            {!isToday && (
              <button
                type="button"
                onClick={handleTodayClick}
                className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-950 underline underline-offset-2 transition cursor-pointer px-2"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={!canNext}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white border border-neutral-200/90 shadow-2xs touch-manipulation transition ${
              canNext
                ? 'hover:text-neutral-950 active:bg-neutral-100 cursor-pointer'
                : 'opacity-25 cursor-not-allowed'
            }`}
            aria-label="Next day"
            title={canNext ? 'Next day' : 'Cannot navigate beyond tomorrow'}
          >
            <svg
              className="w-5 h-5"
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

        {/* Progress Display: Compact and Prominent */}
        <div className="my-1 text-center">
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 tabular-nums">
            {completedUnits} / 80
          </div>
          {/* Progress Bar */}
          <div className="w-52 sm:w-60 h-1.5 bg-neutral-200/80 rounded-full mx-auto mt-1.5 overflow-hidden">
            <div
              className="h-full bg-neutral-900 transition-all duration-300"
              style={{ width: `${Math.min(100, (completedUnits / 80) * 100)}%` }}
            />
          </div>
        </div>

        {/* Column Headers & Ten Sets Table (Compact, 100% visible on screen) */}
        <div className="w-full bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden my-1">
          <div className="w-full flex items-center justify-between px-3.5 sm:px-4 py-1.5 text-xs uppercase tracking-wider font-medium text-neutral-400 bg-neutral-100/70 border-b border-neutral-200/80">
            <span className="w-12 text-left text-neutral-400 font-normal">Set</span>
            <span className="w-14 text-center text-neutral-700 font-semibold">Units</span>
            <span className="flex-1 text-right text-neutral-700 font-semibold">Time</span>
          </div>

          <div className="divide-y divide-neutral-200/60">
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
        <p className="text-center text-[10px] sm:text-xs text-neutral-400 py-0.5">
          Double-tap empty set to log &bull; Press &amp; hold row to edit
        </p>

        {/* Installation Guide Modal */}
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
                    1. Tap the <strong>Share</strong> button in Safari.
                  </p>
                  <p>
                    2. Tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              ) : (
                <div className="mt-3 text-sm text-neutral-600 space-y-2">
                  <p>
                    1. Tap the <strong>three dots (⋮)</strong> menu in Chrome.
                  </p>
                  <p>
                    2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Hidden Data Inspection, File Backup & Restore Modal (Triggered by 2s header hold) */}
        {showDataModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={() => setShowDataModal(false)}
          >
            <div
              className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Storage &amp; Backup
                  </h3>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {isPersisted
                      ? '✓ Storage locked in device hardware memory'
                      : 'Saved in local device storage'}
                  </div>
                </div>
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

              {/* Physical Backup & Restore via JSON Files in Downloads */}
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <h4 className="text-sm font-semibold text-neutral-900">
                  Backup File Management
                </h4>
                <p className="mt-1 text-xs text-neutral-500">
                  Save your backup file directly to your phone's Downloads folder, or upload a backup file to populate a new phone.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 text-white font-semibold text-xs hover:bg-neutral-800 active:bg-neutral-950 transition cursor-pointer text-center"
                  >
                    📥 Save Backup to Downloads
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-semibold text-xs hover:bg-neutral-50 transition cursor-pointer text-center"
                  >
                    📤 Upload Backup File (.json)
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Stored Dates List Inspector */}
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <h4 className="text-sm font-semibold text-neutral-900">
                  Recorded Dates in Storage ({storedDatesList.length})
                </h4>
                {storedDatesList.length > 0 ? (
                  <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto">
                    {storedDatesList.map((item) => (
                      <div
                        key={item.dateKey}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-200 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-neutral-800">
                            {formatDisplayDate(item.dateKey)}
                          </span>
                          <span className="ml-2 text-neutral-500">
                            ({item.completedUnits} / 80 units)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJumpToDate(item.dateKey)}
                          className="px-2.5 py-1 rounded bg-neutral-900 text-white font-medium hover:bg-neutral-800 text-xs transition cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-neutral-400 italic">
                    No dates stored currently.
                  </p>
                )}
              </div>

              {/* Clipboard Backup */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full py-2 px-3 rounded-xl border border-neutral-300 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 text-xs font-semibold transition cursor-pointer"
                >
                  Copy All Records to Clipboard
                </button>
              </div>

              {/* Text JSON Paste */}
              <form onSubmit={handleCustomImportSubmit} className="mt-4">
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Or Paste Backup JSON:
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='Paste backup JSON here...'
                  rows={2}
                  className="w-full text-xs font-mono p-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  disabled={!importJsonText.trim()}
                  className="mt-2 w-full py-2 px-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40 text-neutral-800 text-xs font-semibold transition cursor-pointer"
                >
                  Restore Pasted Text
                </button>
              </form>

              {/* PWA Install Button inside modal if not installed */}
              {isInstallable && (
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={triggerInstall}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Install as Phone App
                  </button>
                </div>
              )}

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
    </div>
  );
}
