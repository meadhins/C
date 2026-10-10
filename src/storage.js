const STORAGE_KEY = 'daily_sets_tracker_data';

// Navigation boundaries:
// 1. Never go before 1st October 2026
// 2. Never go forward more than tomorrow (the next day from current local date)
export const MIN_DATE_KEY = '2026-10-01';

export function getMaxDateKey(today = new Date()) {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateKey(tomorrow);
}

export function canGoPrevDate(currentDateKey) {
  return currentDateKey > MIN_DATE_KEY;
}

export function canGoNextDate(currentDateKey) {
  const maxKey = getMaxDateKey();
  return currentDateKey < maxKey;
}

// Request Android/Chrome persistent storage so browser history clearing cannot evict it
export async function ensurePersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(dateKey) {
  const date = parseDateKey(dateKey);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function getAdjacentDateKey(dateKey, deltaDays) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + deltaDays);
  const nextKey = getLocalDateKey(date);

  // Enforce min boundary (1st October 2026)
  if (nextKey < MIN_DATE_KEY) return MIN_DATE_KEY;

  // Enforce max boundary (next day from current date)
  const maxKey = getMaxDateKey();
  if (nextKey > maxKey) return maxKey;

  return nextKey;
}

export function getCurrentLocalTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDisplayTime(timeStr) {
  if (!timeStr) return '—';
  if (/am|pm/i.test(timeStr)) return timeStr;

  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;

  const period = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  const hoursFormatted = String(hours12).padStart(2, '0');
  return `${hoursFormatted}:${m} ${period}`;
}

export function loadAllData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAllData(allData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch {
    // LocalStorage quota or access error handled gracefully
  }
}

export function getDayData(dateKey) {
  const allData = loadAllData();
  const dayRecord = allData[dateKey] || {};
  const normalized = {};
  for (let i = 1; i <= 10; i++) {
    const key = String(i);
    normalized[key] = dayRecord[key] || null;
  }
  return normalized;
}

export function updateDayEntry(dateKey, setNumber, timeValue) {
  const allData = loadAllData();
  if (!allData[dateKey]) {
    allData[dateKey] = {};
  }
  if (timeValue) {
    allData[dateKey][String(setNumber)] = timeValue;
  } else {
    allData[dateKey][String(setNumber)] = null;
  }
  saveAllData(allData);
  return getDayData(dateKey);
}

export function getAllStoredDates() {
  const allData = loadAllData();
  const dates = Object.keys(allData).sort();
  return dates.map((dateKey) => {
    const day = allData[dateKey] || {};
    const filled = Object.values(day).filter(Boolean).length;
    return {
      dateKey,
      completedSets: filled,
      completedUnits: filled * 8,
    };
  }).filter((item) => item.completedSets > 0);
}

export function exportDataJson() {
  const allData = loadAllData();
  return JSON.stringify(allData, null, 2);
}

export function downloadBackupFile() {
  const json = exportDataJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `practice_tracker_backup_${getLocalDateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDataJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) {
      return { success: false, error: 'Invalid data format' };
    }
    const current = loadAllData();
    const merged = { ...current, ...parsed };
    saveAllData(merged);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Could not parse JSON: ' + err.message };
  }
}
