import { HabitColorTheme, ThemeColors } from "./types";

export const THEME_PALETTES: Record<"dark" | "light", Record<HabitColorTheme, ThemeColors>> = {
  dark: {
    github: {
      name: "GitHub Classic",
      cardBg: "#0d1117",
      cardBorder: "#30363d",
      textPrimary: "#f0f6fc",
      textMuted: "#7d8590",
      levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
      levelBorders: ["#272d37", "#125633", "#00843d", "#2ec24d", "#56ff77"],
    },
    emerald: {
      name: "Neon Emerald",
      cardBg: "#05130d",
      cardBorder: "#064e3b",
      textPrimary: "#ecfdf5",
      textMuted: "#6ee7b7",
      levels: ["#092419", "#064e3b", "#059669", "#10b981", "#34d399"],
      levelBorders: ["#0f3e2e", "#047857", "#10b981", "#34d399", "#6ee7b7"],
    },
    cyan: {
      name: "Cyan Frost",
      cardBg: "#06131c",
      cardBorder: "#155e75",
      textPrimary: "#ecfeff",
      textMuted: "#67e8f9",
      levels: ["#0a2435", "#164e63", "#0891b2", "#06b6d4", "#22d3ee"],
      levelBorders: ["#155e75", "#0e7490", "#06b6d4", "#22d3ee", "#a5f3fc"],
    },
    amber: {
      name: "Sunset Amber",
      cardBg: "#171004",
      cardBorder: "#78350f",
      textPrimary: "#fffbeb",
      textMuted: "#fcd34d",
      levels: ["#2a1806", "#78350f", "#d97706", "#f59e0b", "#fbbf24"],
      levelBorders: ["#451a03", "#b45309", "#f59e0b", "#fbbf24", "#fef08a"],
    },
    purple: {
      name: "Cyber Purple",
      cardBg: "#10071c",
      cardBorder: "#581c87",
      textPrimary: "#faf5ff",
      textMuted: "#d8b4fe",
      levels: ["#200e35", "#581c87", "#9333ea", "#a855f7", "#c084fc"],
      levelBorders: ["#3b0764", "#7e22ce", "#a855f7", "#c084fc", "#f3e8ff"],
    },
  },
  light: {
    github: {
      name: "GitHub Classic",
      cardBg: "#ffffff",
      cardBorder: "#d0d7de",
      textPrimary: "#1f2328",
      textMuted: "#656d76",
      levels: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
      levelBorders: ["#d0d7de", "#85e495", "#36b356", "#288a42", "#1a582d"],
    },
    emerald: {
      name: "Neon Emerald",
      cardBg: "#ffffff",
      cardBorder: "#a7f3d0",
      textPrimary: "#064e3b",
      textMuted: "#059669",
      levels: ["#f0fdf4", "#a7f3d0", "#34d399", "#059669", "#064e3b"],
      levelBorders: ["#bbf7d0", "#6ee7b7", "#10b981", "#047857", "#022c22"],
    },
    cyan: {
      name: "Cyan Frost",
      cardBg: "#ffffff",
      cardBorder: "#a5f3fc",
      textPrimary: "#164e63",
      textMuted: "#0891b2",
      levels: ["#ecfeff", "#a5f3fc", "#22d3ee", "#0891b2", "#164e63"],
      levelBorders: ["#cffafe", "#67e8f9", "#06b6d4", "#0e7490", "#083344"],
    },
    amber: {
      name: "Sunset Amber",
      cardBg: "#ffffff",
      cardBorder: "#fde68a",
      textPrimary: "#78350f",
      textMuted: "#d97706",
      levels: ["#fffbeb", "#fde68a", "#fbbf24", "#d97706", "#78350f"],
      levelBorders: ["#fef3c7", "#fcd34d", "#f59e0b", "#b45309", "#451a03"],
    },
    purple: {
      name: "Cyber Purple",
      cardBg: "#ffffff",
      cardBorder: "#e9d5ff",
      textPrimary: "#581c87",
      textMuted: "#9333ea",
      levels: ["#faf5ff", "#e9d5ff", "#c084fc", "#9333ea", "#581c87"],
      levelBorders: ["#f3e8ff", "#d8b4fe", "#a855f7", "#7e22ce", "#3b0764"],
    },
  },
};

export function getIntensityLevel(hours: number, targetHours: number): 0 | 1 | 2 | 3 | 4 {
  if (!hours || hours <= 0) return 0;
  const target = Math.max(0.1, targetHours || 4);
  const ratio = hours / target;
  if (ratio < 0.3) return 1;
  if (ratio < 0.65) return 2;
  if (ratio < 1.0) return 3;
  return 4;
}

export function getCellColor(
  hours: number,
  targetHours: number,
  themeKey: HabitColorTheme = "github",
  appTheme: "dark" | "light" = "dark"
): { bg: string; border: string } {
  const currentThemes = THEME_PALETTES[appTheme] || THEME_PALETTES.dark;
  const palette = currentThemes[themeKey] || currentThemes.github || THEME_PALETTES.dark.github;
  const level = getIntensityLevel(hours, targetHours);
  return {
    bg: palette.levels[level],
    border: palette.levelBorders[level],
  };
}
