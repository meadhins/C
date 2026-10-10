const STORAGE_KEY = 'daily_sets_tracker_data';

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
  return getLocalDateKey(date);
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

export function exportDataJson() {
  const allData = loadAllData();
  return JSON.stringify(allData, null, 2);
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

// Prepared data from user records (Oct 1 to Oct 5, 2026) for easy 1-click import into device storage
export const PREPARED_PAST_DATA = {
  "2026-10-01": {
    "1": "06:55",
    "2": "06:55",
    "3": "07:58",
    "4": "07:58",
    "5": "09:31",
    "6": "09:31",
    "7": "09:52",
    "8": "09:52",
    "9": "10:01"
  },
  "2026-10-02": {
    "1": "13:21",
    "2": "13:21",
    "3": "13:31",
    "4": "17:03",
    "5": "17:03",
    "6": "17:14",
    "7": "17:24",
    "8": "17:32"
  },
  "2026-10-03": {
    "1": "04:04",
    "2": "04:05",
    "3": "04:13",
    "4": "06:58",
    "5": "06:58",
    "6": "07:56",
    "7": "07:56",
    "8": "15:10",
    "9": "15:10"
  },
  "2026-10-04": {
    "1": "04:23",
    "2": "04:23",
    "3": "16:49",
    "4": "16:49",
    "5": "16:56",
    "6": "17:05",
    "7": "19:03"
  },
  "2026-10-05": {
    "1": "15:35",
    "2": "15:35",
    "3": "15:57",
    "4": "16:16",
    "5": "16:16",
    "6": "17:30",
    "7": "18:12",
    "8": "18:12"
  }
};
