import type { PluginStorageAPI } from "../../types";
import type { DailyLogEntry, HabitDataStore, HabitDefinition, HabitStats } from "./types";

const STORAGE_KEY = "habit_tracker_data_v1";

export const DEFAULT_HABIT: HabitDefinition = {
  id: "study_default",
  name: "Study & Deep Work",
  targetHoursPerDay: 4,
  colorTheme: "github",
  createdAt: 1700000000000,
};


export const INITIAL_STORE: HabitDataStore = {
  habits: [DEFAULT_HABIT],
  logs: {
    study_default: {},
  },
  activeHabitId: "study_default",
};

export async function loadStore(storage: PluginStorageAPI): Promise<HabitDataStore> {
  try {
    const raw = await storage.get(STORAGE_KEY);
    if (!raw) return INITIAL_STORE;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.habits) || parsed.habits.length === 0) {
      return INITIAL_STORE;
    }
    return {
      habits: parsed.habits,
      logs: parsed.logs || {},
      activeHabitId: parsed.activeHabitId || parsed.habits[0].id,
    };
  } catch (err) {
    console.error("[HabitTracker] Error loading store from storage:", err);
    return INITIAL_STORE;
  }
}

export async function saveStore(storage: PluginStorageAPI, store: HabitDataStore): Promise<void> {
  try {
    await storage.set(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("[HabitTracker] Error saving store to storage:", err);
  }
}

export function calculateStats(logs: Record<string, DailyLogEntry> = {}): HabitStats {
  const dates = Object.keys(logs)
    .filter((d) => (logs[d]?.hours ?? 0) > 0)
    .sort();

  let totalHours = 0;
  dates.forEach((d) => {
    totalHours += logs[d].hours || 0;
  });

  const activeDays = dates.length;
  const dailyAverage = activeDays > 0 ? Number((totalHours / activeDays).toFixed(1)) : 0;

  if (dates.length === 0) {
    return { currentStreak: 0, maxStreak: 0, totalHours: 0, activeDays: 0, dailyAverage: 0 };
  }

  // Calculate Max Streak
  let maxStreak = 0;
  let currentRun = 0;
  let prevTime: number | null = null;

  for (const dateStr of dates) {
    const time = new Date(`${dateStr}T00:00:00`).getTime();
    if (prevTime === null) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((time - prevTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > maxStreak) maxStreak = currentRun;
    prevTime = time;
  }

  // Calculate Current Streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateISO(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateISO(yesterday);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // If today is logged, start counting backward from today. Otherwise, if yesterday is logged, start from yesterday.
  if ((logs[todayStr]?.hours ?? 0) > 0) {
    checkDate = new Date(today);
  } else if ((logs[yesterdayStr]?.hours ?? 0) > 0) {
    checkDate = new Date(yesterday);
  } else {
    return { currentStreak: 0, maxStreak, totalHours: Number(totalHours.toFixed(1)), activeDays, dailyAverage };
  }

  while (true) {
    const dStr = formatDateISO(checkDate);
    if ((logs[dStr]?.hours ?? 0) > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    maxStreak,
    totalHours: Number(totalHours.toFixed(1)),
    activeDays,
    dailyAverage,
  };
}

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateISO(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
