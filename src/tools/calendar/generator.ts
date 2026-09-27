export interface CalendarOptions {
  year: number;
  month: number;
  centerX: number;
  centerY: number;
  theme?: "white" | "light" | "dark";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const WHITE_PALETTE = {
  cardBg: "#ffffff",
  cardBorder: "#cbd5e1",
  titleBg: "#ffffff",
  titleBorder: "#cbd5e1",
  titleText: "#0f172a",
  headerBg: "#f1f5f9",
  headerBorder: "#cbd5e1",
  headerText: "#334155",
  cellBg: "#ffffff",
  cellBorder: "#cbd5e1",
  cellText: "#0f172a",
  dimCellBg: "#f8fafc",
  dimCellBorder: "#e2e8f0",
  dimCellText: "#94a3b8",
};

const DARK_PALETTE = {
  cardBg: "#1e293b",
  cardBorder: "#334155",
  titleBg: "#1e293b",
  titleBorder: "#334155",
  titleText: "#f8fafc",
  headerBg: "#0f172a",
  headerBorder: "#334155",
  headerText: "#cbd5e1",
  cellBg: "#1e293b",
  cellBorder: "#334155",
  cellText: "#ffffff",
  dimCellBg: "#0f172a",
  dimCellBorder: "#1e293b",
  dimCellText: "#64748b",
};

const baseEl = (id: string, type: string, x: number, y: number, w: number, h: number, gId: string, opacity = 100) => ({
  id,
  type,
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(w),
  height: Math.round(h),
  angle: 0,
  strokeColor: "#ffffff",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 1.5,
  strokeStyle: "solid",
  roughness: 1,
  opacity,
  groupIds: [gId],
  frameId: null,
  roundness: null as { type: number } | null,
  seed: Math.floor(Math.random() * 100000),
  version: 1,
  versionNonce: Math.floor(Math.random() * 100000),
  isDeleted: false,
  boundElements: null,
  updated: Date.now(),
  link: null,
  locked: false,
});

const makeRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  bg: string,
  gId: string,
  opacity = 100,
  strokeWidth = 1.5,
  roundness: { type: number } | null = { type: 3 }
) => ({
  ...baseEl(`rect_${Math.random().toString(36).slice(2, 9)}`, "rectangle", x, y, w, h, gId, opacity),
  strokeColor: stroke,
  backgroundColor: bg,
  strokeWidth,
  roundness,
});

const makeText = (
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  size: number,
  color: string,
  align: "left" | "center",
  gId: string,
  opacity = 100
) => ({
  ...baseEl(`text_${Math.random().toString(36).slice(2, 9)}`, "text", x, y, w, h, gId, opacity),
  text,
  fontSize: size,
  fontFamily: 1,
  textAlign: align,
  verticalAlign: align === "center" ? "middle" : "top",
  strokeColor: color,
  originalText: text,
  lineHeight: 1.25,
  baseline: Math.round(size * 0.9),
});

export function generateCalendar({
  year,
  month,
  centerX,
  centerY,
  theme = "white",
}: CalendarOptions): any[] {
  const pal = theme === "dark" ? DARK_PALETTE : WHITE_PALETTE;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const rows = Math.ceil((startDay + daysInMonth) / 7);
  const totalCells = rows * 7;

  const cellW = 96;
  const cellH = 76;
  const gap = 6;
  const totalW = 7 * cellW + 6 * gap;
  const titleH = 40;
  const headerH = 26;
  const totalH = titleH + 12 + headerH + 6 + (rows * (cellH + gap) - gap);
  const startX = centerX - totalW / 2;
  const startY = centerY - totalH / 2;
  const gId = `cal_${Math.random().toString(36).slice(2, 9)}`;
  const elements: any[] = [];

  // 0. Solid Card Backdrop Container (Ensures crisp contrast on any canvas background)
  const pad = 16;
  const cardX = startX - pad;
  const cardY = startY - pad;
  const cardW = totalW + pad * 2;
  const cardH = totalH + pad * 2;
  elements.push(
    makeRect(cardX, cardY, cardW, cardH, pal.cardBorder, pal.cardBg, gId, 100, 1.5, { type: 3 })
  );

  // 1. Title Banner
  const titleW = 240;
  const titleX = centerX - titleW / 2;
  elements.push(makeRect(titleX, startY, titleW, titleH, pal.titleBorder, pal.titleBg, gId, 100, 1.5, { type: 3 }));
  elements.push(makeText(titleX, startY + 8, titleW, 24, `${MONTHS[month]} ${year}`, 20, pal.titleText, "center", gId));

  // 2. 7 Weekday Header Badges
  const headerY = startY + titleH + 12;
  WEEKDAYS.forEach((name, col) => {
    const colX = startX + col * (cellW + gap);
    elements.push(makeRect(colX, headerY, cellW, headerH, pal.headerBorder, pal.headerBg, gId, 100, 1, { type: 3 }));
    elements.push(makeText(colX, headerY + 4, cellW, headerH - 8, name, 12, pal.headerText, "center", gId));
  });

  // 3. Day Grid Tiles
  const gridY = headerY + headerH + 8;
  for (let idx = 0; idx < totalCells; idx++) {
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const cellX = startX + col * (cellW + gap);
    const cellY = gridY + row * (cellH + gap);

    if (idx < startDay) {
      const prevDay = prevDaysInMonth - (startDay - 1 - idx);
      elements.push(makeRect(cellX, cellY, cellW, cellH, pal.dimCellBorder, pal.dimCellBg, gId, 100, 1, { type: 3 }));
      elements.push(makeText(cellX + 8, cellY + 6, 25, 18, `${prevDay}`, 13, pal.dimCellText, "left", gId));
    } else if (idx < startDay + daysInMonth) {
      const dayNum = idx - startDay + 1;
      elements.push(makeRect(cellX, cellY, cellW, cellH, pal.cellBorder, pal.cellBg, gId, 100, 1, { type: 3 }));
      elements.push(makeText(cellX + 8, cellY + 6, 25, 18, `${dayNum}`, 16, pal.cellText, "left", gId));
    } else {
      const nextDay = idx - (startDay + daysInMonth) + 1;
      elements.push(makeRect(cellX, cellY, cellW, cellH, pal.dimCellBorder, pal.dimCellBg, gId, 100, 1, { type: 3 }));
      elements.push(makeText(cellX + 8, cellY + 6, 25, 18, `${nextDay}`, 13, pal.dimCellText, "left", gId));
    }
  }

  return elements;
}
