export type HabitColorTheme = "github" | "emerald" | "cyan" | "amber" | "purple";

export interface HabitDefinition {
  id: string;
  name: string;
  icon?: string;
  targetHoursPerDay: number;
  colorTheme: HabitColorTheme;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  createdAt: number;
}

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  hours: number;
  note?: string;
  updatedAt: number;
}

export interface HabitStats {
  currentStreak: number;
  maxStreak: number;
  totalHours: number;
  activeDays: number;
  dailyAverage: number;
}

export interface ThemeColors {
  name: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  levels: [string, string, string, string, string]; // 0: empty, 1: low, 2: med, 3: high, 4: max
  levelBorders: [string, string, string, string, string];
}

export interface HabitDataStore {
  habits: HabitDefinition[];
  logs: Record<string, Record<string, DailyLogEntry>>; // habitId -> (date -> DailyLogEntry)
  activeHabitId: string;
}

export interface GeneratorOptions {
  habit: HabitDefinition;
  logs: Record<string, DailyLogEntry>;
  startDate: string;
  endDate: string;
  centerX: number;
  centerY: number;
  theme?: "dark" | "light";
}
