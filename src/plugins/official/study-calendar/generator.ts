export interface CalendarOptions {
  year: number;
  month: number;
  centerX: number;
  centerY: number;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const PALETTE = {
  border: "#cbd5e1",
  bg: "#ffffff",
  text: "#0f172a",
  dimBorder: "#e2e8f0",
  dimBg: "#f8fafc",
  dimText: "#94a3b8",
};

const baseEl = (id: string, type: string, x: number, y: number, w: number, h: number, gId: string, opacity = 100) => ({
  id, type, x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h),
  angle: 0, strokeColor: "#ffffff", backgroundColor: "transparent", fillStyle: "solid",
  strokeWidth: 1.5, strokeStyle: "solid", roughness: 1, opacity, groupIds: [gId],
  frameId: null, roundness: null as { type: number } | null, seed: Math.floor(Math.random() * 100000),
  version: 1, versionNonce: Math.floor(Math.random() * 100000), isDeleted: false,
  boundElements: null, updated: Date.now(), link: null, locked: false,
});

const makeRect = (
  x: number, y: number, w: number, h: number, stroke: string, bg: string, gId: string, opacity = 100,
) => ({
  ...baseEl(`rect_${Math.random().toString(36).slice(2, 9)}`, "rectangle", x, y, w, h, gId, opacity),
  strokeColor: stroke, backgroundColor: bg, roundness: null,
});

const makeText = (
  x: number, y: number, w: number, h: number, text: string, size: number,
  color: string, align: "left" | "center", gId: string, opacity = 100,
) => ({
  ...baseEl(`text_${Math.random().toString(36).slice(2, 9)}`, "text", x, y, w, h, gId, opacity),
  text, fontSize: size, fontFamily: 1, textAlign: align,
  verticalAlign: align === "center" ? "middle" : "top",
  strokeColor: color, originalText: text, lineHeight: 1.25, baseline: Math.round(size * 0.9),
});

export function generateCalendar({ year, month, centerX, centerY }: CalendarOptions): any[] {
  const pal = PALETTE;
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

  // 1. Title Banner (Boxy)
  const titleW = 240;
  const titleX = centerX - titleW / 2;
  elements.push(makeRect(titleX, startY, titleW, titleH, pal.border, pal.bg, gId));
  elements.push(makeText(titleX, startY + 8, titleW, 24, `${MONTHS[month]} ${year}`, 20, pal.text, "center", gId));

  // 2. 7 Weekday Header Badges
  const headerY = startY + titleH + 12;
  WEEKDAYS.forEach((name, col) => {
    const colX = startX + col * (cellW + gap);
    elements.push(makeRect(colX, headerY, cellW, headerH, pal.border, pal.bg, gId));
    elements.push(makeText(colX, headerY + 4, cellW, headerH - 8, name, 12, pal.text, "center", gId));
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
      elements.push(makeRect(cellX, cellY, cellW, cellH, pal.dimBorder, pal.dimBg, gId, 40));
      elements.push(makeText(cellX + 8, cellY + 6, 25, 18, `${prevDay}`, 13, pal.dimText, "left", gId, 40));
    } else if (idx < startDay + daysInMonth) {
      const dayNum = idx - startDay + 1;
      elements.push(makeRect(cellX, cellY, cellW, cellH, pal.border, pal.bg, gId));
      elements.push(makeText(cellX + 8, cellY + 6, 25, 18, `${dayNum}`, 16, pal.text, "left", gId));
    } else {
      const nextDay = idx - (startDay + daysInMonth) + 1;
      elements.push(makeRect(cellX, cellY, cellW, cellH, pal.dimBorder, pal.dimBg, gId, 40));
      elements.push(makeText(cellX + 8, cellY + 6, 25, 18, `${nextDay}`, 13, pal.dimText, "left", gId, 40));
    }
  }

  return elements;
}
