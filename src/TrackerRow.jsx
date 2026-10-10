import React, { useState, useRef, useEffect } from 'react';
import { formatDisplayTime } from './storage.js';

export default function TrackerRow({
  setNumber,
  units = 8,
  time,
  isEditing,
  onActivate,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onClearEdit,
}) {
  const [editValue, setEditValue] = useState(time || '');
  const [isPressing, setIsPressing] = useState(false);

  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const mouseStartPos = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);

  // Sync edit value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(time || '');
    }
  }, [isEditing, time]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // --- MOUSE HANDLERS (DESKTOP) ---
  const handleMouseDown = (e) => {
    if (isEditing) return;
    if (e.button !== 0) return; // Left click only

    // Long press only edits completed rows
    if (time) {
      mouseStartPos.current = { x: e.clientX, y: e.clientY };
      longPressFired.current = false;
      setIsPressing(true);

      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        setIsPressing(false);
        onStartEdit(setNumber);
      }, 450);
    }
  };

  const handleMouseMove = (e) => {
    if (!longPressTimer.current) return;
    const dx = Math.abs(e.clientX - mouseStartPos.current.x);
    const dy = Math.abs(e.clientY - mouseStartPos.current.y);
    if (Math.hypot(dx, dy) > 15) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      setIsPressing(false);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressing(false);
  };

  const handleDoubleClick = (e) => {
    if (isEditing) return;
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    // Double click enters current time for empty row
    if (!time) {
      onActivate(setNumber);
    }
  };

  // --- TOUCH HANDLERS (MOBILE) ---
  const handleTouchStart = (e) => {
    if (isEditing) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressFired.current = false;

    // Long press is used to edit completed rows
    if (time) {
      setIsPressing(true);
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        setIsPressing(false);
        if (navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch {
            // ignore
          }
        }
        onStartEdit(setNumber);
      }, 450);
    }
  };

  const handleTouchMove = (e) => {
    if (!longPressTimer.current) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (Math.hypot(dx, dy) > 20) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      setIsPressing(false);
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressing(false);

    if (longPressFired.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    // Double-tap immediately entries current time for empty row
    if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
      lastTapTime.current = 0;
      if (!time) {
        onActivate(setNumber);
      }
    } else {
      lastTapTime.current = now;
      // Single tap does NOT trigger edit - prevents accidental edits while scrolling
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editValue && editValue.trim() !== '') {
      onSaveEdit(setNumber, editValue.trim());
    } else {
      onClearEdit(setNumber);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const isCompleted = Boolean(time);
  const formattedDisplay = formatDisplayTime(time);

  return (
    <div
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`group relative flex items-center justify-between min-h-[60px] sm:min-h-[66px] px-4 sm:px-5 py-3.5 select-none transition-colors border-b border-neutral-200/80 last:border-b-0 ${
        isEditing
          ? 'bg-neutral-100/95 ring-1 ring-inset ring-neutral-300'
          : isPressing
          ? 'bg-neutral-200/80'
          : 'hover:bg-neutral-50 active:bg-neutral-100/70'
      }`}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Set Number: Muted grey index */}
      <div className="w-14 text-left tabular-nums text-base sm:text-lg font-normal text-neutral-400 tracking-tight shrink-0">
        {setNumber}
      </div>

      {/* Unit Count (always 8) */}
      <div className="w-16 text-center tabular-nums text-lg sm:text-xl font-semibold text-neutral-800 shrink-0">
        {units}
      </div>

      {/* Time Display with AM/PM or Edit Controls */}
      <div className="flex-1 flex justify-end items-center">
        {isEditing ? (
          <form
            onSubmit={handleFormSubmit}
            onKeyDown={handleKeyDown}
            className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <input
              type="time"
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-base sm:text-sm tabular-nums text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-2xs font-medium"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 transition cursor-pointer"
              title="Save time"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => onClearEdit(setNumber)}
              className="px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:bg-red-200 transition cursor-pointer"
              title="Remove entry"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1.5 text-sm text-neutral-400 hover:text-neutral-700 active:text-neutral-900 transition cursor-pointer"
              title="Cancel"
            >
              ✕
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={`tabular-nums text-base sm:text-lg tracking-tight ${
                isCompleted
                  ? 'font-medium text-neutral-900'
                  : 'text-neutral-300 text-2xl font-light'
              }`}
            >
              {formattedDisplay}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
