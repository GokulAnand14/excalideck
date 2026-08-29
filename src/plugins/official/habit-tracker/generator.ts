import { GeneratorOptions } from "./types";
import { getCellColor, THEME_PALETTES } from "./palettes";
import { calculateStats, formatDateISO, parseDateISO } from "./storage";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const baseEl = (
  id: string,
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  gId: string,
  opacity = 100
) => ({
  id,
  type,
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(w),
  height: Math.round(h),
  angle: 0,
  strokeColor: "#30363d",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 1,
  strokeStyle: "solid",
  roughness: 0, // sleek, clean aesthetic
  opacity,
  groupIds: [gId],
  frameId: null,
  roundness: { type: 3 }, // smooth rounded box
  seed: Math.floor(Math.random() * 100000),
  version: 1,
  versionNonce: Math.floor(Math.random() * 100000),
  isDeleted: false,
  boundElements: null,
  updated: Date.now(),
  link: null,
  locked: false,
  customData: undefined as any,
});

const makeRect = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  bg: string,
  gId: string,
  customData?: any,
  roundnessType = 3
) => ({
  ...baseEl(id, "rectangle", x, y, w, h, gId),
  strokeColor: stroke,
  backgroundColor: bg,
  roundness: { type: roundnessType },
  customData,
});

const makeText = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  size: number,
  color: string,
  align: "left" | "center" | "right",
  gId: string,
  customData?: any
) => ({
  ...baseEl(id, "text", x, y, w, h, gId),
  text,
  fontSize: size,
  fontFamily: 3, // Cascadia / Clean Sans
  textAlign: align,
  verticalAlign: "middle",
  strokeColor: color,
  originalText: text,
  lineHeight: 1.15,
  baseline: Math.round(size * 0.85),
  customData,
});

export function generateHabitTrackerElements({
  habit,
  logs,
  startDate: startStr,
  endDate: endStr,
  centerX,
  centerY,
  theme = "dark",
}: GeneratorOptions): any[] {
  const appTheme: "dark" | "light" = theme === "light" ? "light" : "dark";
  const palette = (THEME_PALETTES[appTheme] || THEME_PALETTES.dark)[habit.colorTheme] || THEME_PALETTES.dark.github;
  const stats = calculateStats(logs);

  const startD = parseDateISO(startStr);
  const endD = parseDateISO(endStr);

  // Align start to the preceding Sunday
  const calendarStart = new Date(startD);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  // Align end to the following Saturday
  const calendarEnd = new Date(endD);
  if (calendarEnd.getDay() !== 6) {
    calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));
  }

  // Count total days and total weeks
  const totalDays = Math.round((calendarEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  // Minimal Dimensions
  const cellSize = 11;
  const cellGap = 3;
  const colPitch = cellSize + cellGap;
  const rowPitch = cellSize + cellGap;

  const leftLabelWidth = 26;
  const gridWidth = totalWeeks * colPitch;
  const gridHeight = 7 * rowPitch;

  const cardPaddingX = 18;
  const cardPaddingTop = 14;
  const cardPaddingBottom = 12;
  const headerHeight = 28;
  const monthLabelsHeight = 14;
  const legendHeight = 16;

  const totalCardWidth = cardPaddingX * 2 + leftLabelWidth + gridWidth;
  const totalCardHeight =
    cardPaddingTop + headerHeight + monthLabelsHeight + gridHeight + 10 + legendHeight + cardPaddingBottom;

  const cardX = Math.round(centerX - totalCardWidth / 2);
  const cardY = Math.round(centerY - totalCardHeight / 2);

  const gId = `habit_group_${habit.id}_${Math.random().toString(36).slice(2, 8)}`;
  const elements: any[] = [];

  // 1. Background Card (Sleek Dark/Light Card)
  elements.push(
    makeRect(
      `ht_card_${habit.id}_${Math.random().toString(36).slice(2, 7)}`,
      cardX,
      cardY,
      totalCardWidth,
      totalCardHeight,
      palette.cardBorder,
      palette.cardBg,
      gId,
      { plugin: "habit-tracker", role: "card", habitId: habit.id },
      3
    )
  );

  // 2. Minimal Header Row
  // Title & Streak Stats (No emojis)
  const titleText = habit.name || "Habit Tracker";
  elements.push(
    makeText(
      `ht_title_${habit.id}`,
      cardX + cardPaddingX,
      cardY + cardPaddingTop,
      Math.min(300, totalCardWidth - cardPaddingX * 2 - 180),
      16,
      titleText,
      13,
      palette.textPrimary,
      "left",
      gId
    )
  );

  const statsText = `${stats.currentStreak}d streak  •  ${stats.totalHours}h total`;
  elements.push(
    makeText(
      `ht_stats_${habit.id}`,
      cardX + cardPaddingX,
      cardY + cardPaddingTop + 14,
      Math.min(300, totalCardWidth - cardPaddingX * 2),
      13,
      statsText,
      10,
      palette.textMuted,
      "left",
      gId
    )
  );

  // Date Range Badge (Top Right)
  const rangeBadge = `${startStr}  →  ${endStr}`;
  elements.push(
    makeText(
      `ht_range_${habit.id}`,
      cardX + totalCardWidth - cardPaddingX - 180,
      cardY + cardPaddingTop + 2,
      180,
      14,
      rangeBadge,
      9.5,
      palette.textMuted,
      "right",
      gId
    )
  );

  // 3. Month Header Labels
  const gridStartX = cardX + cardPaddingX + leftLabelWidth;
  const gridStartY = cardY + cardPaddingTop + headerHeight + monthLabelsHeight;
  const monthY = gridStartY - monthLabelsHeight + 1;

  let prevMonth = -1;
  let lastLabelCol = -99;
  const curr = new Date(calendarStart);

  for (let w = 0; w < totalWeeks; w++) {
    const midWeek = new Date(curr);
    midWeek.setDate(midWeek.getDate() + 3);
    const m = midWeek.getMonth();

    if (m !== prevMonth) {
      if (w - lastLabelCol >= 3 && w < totalWeeks - 1) {
        const monthX = gridStartX + w * colPitch;
        elements.push(
          makeText(
            `ht_m_${w}_${m}`,
            monthX,
            monthY,
            24,
            12,
            MONTH_NAMES[m],
            8.5,
            palette.textMuted,
            "left",
            gId
          )
        );
        lastLabelCol = w;
      }
      prevMonth = m;
    }
    curr.setDate(curr.getDate() + 7);
  }


  // 4. Weekday Labels (Mon, Wed, Fri) - No emojis, clean minimal text
  const dayLabels = [
    { row: 1, text: "Mon" },
    { row: 3, text: "Wed" },
    { row: 5, text: "Fri" },
  ];

  dayLabels.forEach(({ row, text }) => {
    const labelY = gridStartY + row * rowPitch;
    elements.push(
      makeText(
        `ht_wday_${row}`,
        cardX + cardPaddingX,
        labelY,
        leftLabelWidth - 4,
        cellSize,
        text,
        8.5,
        palette.textMuted,
        "left",
        gId
      )
    );
  });

  // 5. Day Grid Tiles (7 rows x N weeks)
  const cellDate = new Date(calendarStart);
  for (let w = 0; w < totalWeeks; w++) {
    for (let r = 0; r < 7; r++) {
      const dateStr = formatDateISO(cellDate);
      const isWithinRange = cellDate >= startD && cellDate <= endD;
      const hours = logs[dateStr]?.hours || 0;
      const note = logs[dateStr]?.note;

      const cellX = gridStartX + w * colPitch;
      const cellY = gridStartY + r * rowPitch;

      const colors = isWithinRange
        ? getCellColor(hours, habit.targetHoursPerDay, habit.colorTheme, appTheme)
        : {
            bg: appTheme === "dark" ? "#10141a" : "#f1f3f5",
            border: appTheme === "dark" ? "#161b22" : "#e5e7eb",
          };

      elements.push(
        makeRect(
          `ht_cell_${habit.id}_${dateStr}`,
          cellX,
          cellY,
          cellSize,
          cellSize,
          colors.border,
          colors.bg,
          gId,
          {
            plugin: "habit-tracker",
            role: "cell",
            habitId: habit.id,
            date: dateStr,
            hours,
            note,
            targetHours: habit.targetHoursPerDay,
            theme: habit.colorTheme,
          },
          2
        )
      );

      cellDate.setDate(cellDate.getDate() + 1);
    }
  }

  // 6. Bottom Legend: Less [][][][][] More
  const legendY = gridStartY + gridHeight + 10;
  const legendStartX = cardX + cardPaddingX + leftLabelWidth;

  // "Less"
  elements.push(
    makeText(
      `ht_leg_less`,
      legendStartX,
      legendY,
      24,
      cellSize,
      "Less",
      8.5,
      palette.textMuted,
      "left",
      gId
    )
  );

  // 5 Color Swatches (Mini 9x9)
  const swatchSize = 9;
  palette.levels.forEach((lvlBg, i) => {
    const swatchX = legendStartX + 24 + i * (swatchSize + 2.5);
    elements.push(
      makeRect(
        `ht_swatch_${i}`,
        swatchX,
        legendY + 1,
        swatchSize,
        swatchSize,
        palette.levelBorders[i],
        lvlBg,
        gId,
        { plugin: "habit-tracker", role: "legend", level: i },
        2
      )
    );
  });

  // "More"
  const afterSwatchesX = legendStartX + 24 + 5 * (swatchSize + 2.5) + 3;
  elements.push(
    makeText(
      `ht_leg_more`,
      afterSwatchesX,
      legendY,
      24,
      cellSize,
      "More",
      8.5,
      palette.textMuted,
      "left",
      gId
    )
  );

  // Daily target label on bottom right
  const targetLabel = `Target: ${habit.targetHoursPerDay}h/day`;
  elements.push(
    makeText(
      `ht_leg_target`,
      cardX + totalCardWidth - cardPaddingX - 120,
      legendY,
      120,
      cellSize,
      targetLabel,
      8.5,
      palette.textMuted,
      "right",
      gId
    )
  );

  return elements;
}
