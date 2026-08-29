import React, { useState, useMemo, useRef } from "react";
import { HabitColorTheme, HabitDataStore, HabitDefinition } from "./types";
import { THEME_PALETTES, getCellColor } from "./palettes";
import { calculateStats, formatDateISO, parseDateISO } from "./storage";
import { FloatingCellEditor } from "./FloatingCellEditor";
import {
  IconFlame,
  IconClock,
  IconAward,
  IconPlus,
  IconCalendar,
  IconRefresh,
  IconGripVertical,
  IconEdit,
  IconTrash,
} from "../../../components/common/Icons";

interface HeatmapViewProps {
  store: HabitDataStore;
  theme: "dark" | "light";
  onUpdateStore: (newStore: HabitDataStore) => void;
  onInsertToCanvas: (habit: HabitDefinition, startStr: string, endStr: string) => void;
  onSyncCanvas: (habit: HabitDefinition) => void;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  store,
  theme,
  onUpdateStore,
  onInsertToCanvas,
  onSyncCanvas,
}) => {
  const isDark = theme === "dark";
  const currentYear = new Date().getFullYear();

  const activeHabit = useMemo(() => {
    return (
      store.habits.find((h) => h.id === store.activeHabitId) ||
      store.habits[0] || {
        id: "study_default",
        name: "Study & Deep Work",
        targetHoursPerDay: 4,
        colorTheme: "github" as HabitColorTheme,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        createdAt: Date.now(),
      }
    );
  }, [store, currentYear]);

  const activeLogs = useMemo(() => {
    return store.logs[activeHabit.id] || {};
  }, [store.logs, activeHabit.id]);

  const stats = useMemo(() => {
    return calculateStats(activeLogs);
  }, [activeLogs]);

  // Habit configuration modal state (create / edit)
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [habitFormName, setHabitFormName] = useState("");
  const [habitFormTarget, setHabitFormTarget] = useState(4);
  const [habitFormTheme, setHabitFormTheme] = useState<HabitColorTheme>("github");
  const [habitFormStart, setHabitFormStart] = useState("");
  const [habitFormEnd, setHabitFormEnd] = useState("");

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Movable state for Habit Modal
  const [modalPos, setModalPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [isModalDragging, setIsModalDragging] = useState(false);
  const modalDragRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null);

  // Selected cell for popover editor
  const [editingCell, setEditingCell] = useState<{
    dateStr: string;
    hours: number;
    note?: string;
    screenPos?: { x: number; y: number } | null;
  } | null>(null);

  // Hovered tooltip state
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    hours: number;
    note?: string;
  } | null>(null);

  // Use the active habit's configured start and end dates
  const startDateStr = activeHabit.startDate || `${currentYear}-01-01`;
  const endDateStr = activeHabit.endDate || `${currentYear}-12-31`;

  // Compute weeks array for GitHub-style grid
  const { weeks, monthHeaders } = useMemo(() => {
    const startD = parseDateISO(startDateStr);
    const endD = parseDateISO(endDateStr);

    const calStart = new Date(startD);
    calStart.setDate(calStart.getDate() - calStart.getDay()); // align Sunday

    const calEnd = new Date(endD);
    if (calEnd.getDay() !== 6) {
      calEnd.setDate(calEnd.getDate() + (6 - calEnd.getDay())); // align Saturday
    }

    const totalDays = Math.max(7, Math.round((calEnd.getTime() - calStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const totalWeeks = Math.ceil(totalDays / 7);

    const weeksList: { dateStr: string; isWithinRange: boolean; hours: number; note?: string }[][] = [];
    const monthsList: { colIndex: number; name: string }[] = [];

    let prevMonth = -1;
    let lastMonthCol = -99;
    const curr = new Date(calStart);

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays: { dateStr: string; isWithinRange: boolean; hours: number; note?: string }[] = [];

      const midWeek = new Date(curr);
      midWeek.setDate(midWeek.getDate() + 3);
      const m = midWeek.getMonth();
      if (m !== prevMonth) {
        if (w - lastMonthCol >= 3 && w < totalWeeks - 1) {
          monthsList.push({ colIndex: w, name: MONTH_NAMES[m] });
          lastMonthCol = w;
        }
        prevMonth = m;
      }

      for (let r = 0; r < 7; r++) {
        const dStr = formatDateISO(curr);
        const inRange = curr >= startD && curr <= endD;
        const entry = activeLogs[dStr];
        weekDays.push({
          dateStr: dStr,
          isWithinRange: inRange,
          hours: entry?.hours || 0,
          note: entry?.note,
        });
        curr.setDate(curr.getDate() + 1);
      }
      weeksList.push(weekDays);
    }

    return { weeks: weeksList, monthHeaders: monthsList };
  }, [startDateStr, endDateStr, activeLogs]);

  // Palette definitions
  const currentThemes = THEME_PALETTES[theme] || THEME_PALETTES.dark;
  const palette = currentThemes[activeHabit.colorTheme] || currentThemes.github || THEME_PALETTES.dark.github;

  // Handlers
  const handleHabitChange = (habitId: string) => {
    onUpdateStore({
      ...store,
      activeHabitId: habitId,
    });
  };

  const handleOpenCreateModal = () => {
    const today = new Date();
    setHabitFormName("");
    setHabitFormTarget(4);
    setHabitFormTheme("github");
    setHabitFormStart(`${today.getFullYear()}-01-01`);
    setHabitFormEnd(`${today.getFullYear()}-12-31`);
    setModalPos({
      x: Math.max(16, (window.innerWidth - 310) / 2),
      y: Math.max(16, (window.innerHeight - 340) / 2),
    });
    setModalMode("create");
  };

  const handleOpenEditModal = () => {
    setHabitFormName(activeHabit.name);
    setHabitFormTarget(activeHabit.targetHoursPerDay);
    setHabitFormTheme(activeHabit.colorTheme);
    setHabitFormStart(activeHabit.startDate || `${currentYear}-01-01`);
    setHabitFormEnd(activeHabit.endDate || `${currentYear}-12-31`);
    setModalPos({
      x: Math.max(16, (window.innerWidth - 310) / 2),
      y: Math.max(16, (window.innerHeight - 340) / 2),
    });
    setModalMode("edit");
  };

  const handleSetPresetRange = (type: "year" | "month" | "3months" | "6months") => {
    const today = new Date();
    if (type === "year") {
      setHabitFormStart(`${today.getFullYear()}-01-01`);
      setHabitFormEnd(`${today.getFullYear()}-12-31`);
    } else if (type === "month") {
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      setHabitFormStart(formatDateISO(today));
      setHabitFormEnd(formatDateISO(end));
    } else if (type === "3months") {
      const end = new Date(today);
      end.setDate(end.getDate() + 90);
      setHabitFormStart(formatDateISO(today));
      setHabitFormEnd(formatDateISO(end));
    } else if (type === "6months") {
      const end = new Date(today);
      end.setDate(end.getDate() + 180);
      setHabitFormStart(formatDateISO(today));
      setHabitFormEnd(formatDateISO(end));
    }
  };

  const handleSaveHabitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = habitFormName.trim();
    if (!trimmed) return;

    if (modalMode === "create") {
      const newHabit: HabitDefinition = {
        id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        targetHoursPerDay: Number(habitFormTarget) || 4,
        colorTheme: habitFormTheme,
        startDate: habitFormStart || `${currentYear}-01-01`,
        endDate: habitFormEnd || `${currentYear}-12-31`,
        createdAt: Date.now(),
      };
      const nextHabits = [...store.habits, newHabit];
      const nextLogs = { ...store.logs, [newHabit.id]: {} };
      onUpdateStore({
        habits: nextHabits,
        logs: nextLogs,
        activeHabitId: newHabit.id,
      });
    } else if (modalMode === "edit") {
      const updatedHabits = store.habits.map((h) => {
        if (h.id === activeHabit.id) {
          return {
            ...h,
            name: trimmed,
            targetHoursPerDay: Number(habitFormTarget) || 4,
            colorTheme: habitFormTheme,
            startDate: habitFormStart || `${currentYear}-01-01`,
            endDate: habitFormEnd || `${currentYear}-12-31`,
          };
        }
        return h;
      });
      onUpdateStore({
        ...store,
        habits: updatedHabits,
      });
    }
    setModalMode(null);
  };

  const executeDeleteHabit = (habitIdToDelete: string) => {
    if (store.habits.length > 1) {
      const nextHabits = store.habits.filter((h) => h.id !== habitIdToDelete);
      const nextLogs = { ...store.logs };
      delete nextLogs[habitIdToDelete];
      const nextActiveId = habitIdToDelete === store.activeHabitId ? nextHabits[0].id : store.activeHabitId;
      onUpdateStore({
        habits: nextHabits,
        logs: nextLogs,
        activeHabitId: nextActiveId,
      });
    } else {
      // If deleting the only habit, reset to a clean default habit
      const defaultResetHabit: HabitDefinition = {
        id: `habit_${Date.now()}`,
        name: "Study & Deep Work",
        targetHoursPerDay: 4,
        colorTheme: "github",
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        createdAt: Date.now(),
      };
      onUpdateStore({
        habits: [defaultResetHabit],
        logs: { [defaultResetHabit.id]: {} },
        activeHabitId: defaultResetHabit.id,
      });
    }
    setConfirmDeleteId(null);
    setModalMode(null);
  };

  const handleSaveLog = (hours: number, note?: string) => {
    if (!editingCell) return;
    const { dateStr } = editingCell;
    const currentHabitLogs = { ...(store.logs[activeHabit.id] || {}) };

    if (hours <= 0) {
      delete currentHabitLogs[dateStr];
    } else {
      currentHabitLogs[dateStr] = {
        date: dateStr,
        hours,
        note,
        updatedAt: Date.now(),
      };
    }

    const nextLogs = {
      ...store.logs,
      [activeHabit.id]: currentHabitLogs,
    };

    onUpdateStore({
      ...store,
      logs: nextLogs,
    });
    setEditingCell(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontSize: "11px",
        color: "var(--text-primary)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Sleek Habit Selector Row with Edit, Delete & New */}
      <div style={{ display: "flex", gap: "3px", alignItems: "center", width: "100%" }}>
        <select
          value={activeHabit.id}
          onChange={(e) => handleHabitChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            height: "25px",
            background: "var(--hover-bg, rgba(255,255,255,0.06))",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            borderRadius: "4px",
            color: "var(--text-primary)",
            fontSize: "11px",
            fontWeight: 600,
            padding: "0 6px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {store.habits.map((h) => (
            <option
              key={h.id}
              value={h.id}
              style={{ background: isDark ? "#18181b" : "#ffffff", color: isDark ? "#fff" : "#000" }}
            >
              {h.name}
            </option>
          ))}
        </select>

        {/* Edit Button */}
        <button
          type="button"
          onClick={handleOpenEditModal}
          style={{
            height: "25px",
            width: "25px",
            background: "var(--hover-bg, rgba(255,255,255,0.06))",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            borderRadius: "4px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Edit Habit & Date Range"
        >
          <IconEdit size={12} />
        </button>

        {/* Delete Habit Button */}
        <button
          type="button"
          onClick={() => setConfirmDeleteId(activeHabit.id)}
          style={{
            height: "25px",
            width: "25px",
            background: "var(--hover-bg, rgba(255,255,255,0.06))",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            borderRadius: "4px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Delete Habit"
        >
          <IconTrash size={12} />
        </button>

        {/* New Habit Button */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          style={{
            height: "25px",
            width: "25px",
            background: "var(--hover-bg, rgba(255,255,255,0.06))",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            borderRadius: "4px",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="New Habit"
        >
          <IconPlus size={12} />
        </button>
      </div>

      {/* 2. Compact Minimalist Info Strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "9.5px",
          color: "var(--text-secondary)",
          padding: "2px 4px",
          background: "var(--hover-bg, rgba(255,255,255,0.03))",
          borderRadius: "4px",
          border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <IconCalendar size={10} />
          <span>{startDateStr} → {endDateStr}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--text-primary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <IconFlame size={10} style={{ color: "#f59e0b" }} />
            <span>{stats.currentStreak}d</span>
          </span>
          <span>•</span>
          <span>{stats.totalHours}h</span>
          <span>•</span>
          <span>{activeHabit.targetHoursPerDay}h/d</span>
        </span>
      </div>

      {/* 3. Interactive GitHub Heatmap Card */}
      <div
        style={{
          background: isDark ? "#0d1117" : "#ffffff",
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: "5px",
          padding: "6px 8px",
          overflowX: "auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ minWidth: `${weeks.length * 10.5 + 20}px` }}>
          {/* Month labels */}
          <div style={{ display: "flex", marginLeft: "16px", marginBottom: "3px", height: "11px", position: "relative" }}>
            {monthHeaders.map((m, idx) => (
              <span
                key={`${m.name}_${idx}`}
                style={{
                  position: "absolute",
                  left: `${m.colIndex * 10.5}px`,
                  fontSize: "8px",
                  fontWeight: 600,
                  color: palette.textMuted,
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Grid Rows (7 days x N weeks) */}
          <div style={{ display: "flex", gap: "2px" }}>
            {/* Weekday labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "14px", fontSize: "7.5px", color: palette.textMuted }}>
              <span style={{ height: "8.5px" }} />
              <span style={{ height: "8.5px", lineHeight: "8.5px" }}>Mon</span>
              <span style={{ height: "8.5px" }} />
              <span style={{ height: "8.5px", lineHeight: "8.5px" }}>Wed</span>
              <span style={{ height: "8.5px" }} />
              <span style={{ height: "8.5px", lineHeight: "8.5px" }}>Fri</span>
              <span style={{ height: "8.5px" }} />
            </div>

            {/* Weeks Columns */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {week.map((day) => {
                  const colors = day.isWithinRange
                    ? getCellColor(day.hours, activeHabit.targetHoursPerDay, activeHabit.colorTheme, theme)
                    : { bg: isDark ? "#12161c" : "#f1f3f5", border: isDark ? "#1b2128" : "#e5e7eb" };

                  return (
                    <div
                      key={day.dateStr}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setEditingCell({
                          dateStr: day.dateStr,
                          hours: day.hours,
                          note: day.note,
                          screenPos: { x: rect.left + rect.width / 2, y: rect.top },
                        });
                      }}
                      onMouseEnter={() => setHoveredCell({ dateStr: day.dateStr, hours: day.hours, note: day.note })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        width: "8.5px",
                        height: "8.5px",
                        borderRadius: "2px",
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        opacity: day.isWithinRange ? 1 : 0.35,
                        cursor: "pointer",
                        boxSizing: "border-box",
                        transition: "transform 0.08s ease",
                      }}
                      title={`${day.dateStr}: ${day.hours}h studied${day.note ? ` (${day.note})` : ""}${!day.isWithinRange ? " [Outside active range]" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Hover status bar / Legend */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px", fontSize: "8px", color: palette.textMuted }}>
            <div>
              {hoveredCell ? (
                <span style={{ fontWeight: 600, color: palette.textPrimary }}>
                  {hoveredCell.dateStr}: {hoveredCell.hours}h{hoveredCell.note ? ` • ${hoveredCell.note}` : ""}
                </span>
              ) : (
                <span>Click box to log study time</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <span>Less</span>
              {palette.levels.map((lvlBg, i) => (
                <div
                  key={i}
                  style={{
                    width: "6.5px",
                    height: "6.5px",
                    borderRadius: "1px",
                    background: lvlBg,
                    border: `1px solid ${palette.levelBorders[i]}`,
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Canvas Action Buttons */}
      <div style={{ display: "flex", gap: "4px", width: "100%", marginTop: "2px" }}>
        <button
          type="button"
          onClick={() => onInsertToCanvas(activeHabit, startDateStr, endDateStr)}
          style={{
            flex: 1,
            height: "26px",
            background: "var(--color-primary, #6366f1)",
            color: "#ffffff",
            border: "none",
            borderRadius: "3px",
            fontWeight: 600,
            fontSize: "11px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <IconCalendar size={12} />
          <span>Insert onto Canvas</span>
        </button>

        <button
          type="button"
          onClick={() => onSyncCanvas(activeHabit)}
          style={{
            height: "26px",
            padding: "0 7px",
            background: "var(--hover-bg, rgba(255,255,255,0.06))",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            borderRadius: "3px",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
          title="Sync canvas habit boxes with latest logged data"
        >
          <IconRefresh size={11} />
          <span>Sync</span>
        </button>
      </div>

      {/* 5. Movable Floating Cell Editor Popover */}
      {editingCell && (
        <FloatingCellEditor
          dateStr={editingCell.dateStr}
          initialHours={editingCell.hours}
          initialNote={editingCell.note}
          targetHours={activeHabit.targetHoursPerDay}
          colorTheme={activeHabit.colorTheme}
          theme={theme}
          screenPos={editingCell.screenPos}
          habitName={activeHabit.name}
          onSave={handleSaveLog}
          onClose={() => setEditingCell(null)}
        />
      )}

      {/* 6. Draggable Habit Configuration Modal (Create / Edit) */}
      {modalMode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "transparent",
            pointerEvents: "auto",
          }}
          onClick={() => setModalMode(null)}
        >
          <div
            style={{
              position: "fixed",
              left: `${modalPos.x}px`,
              top: `${modalPos.y}px`,
              width: "300px",
              background: isDark ? "#161b22" : "#ffffff",
              border: `1px solid ${palette.cardBorder}`,
              borderRadius: "8px",
              padding: "12px 14px",
              color: isDark ? "#f0f6fc" : "#1f2328",
              boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.7)" : "0 12px 32px rgba(0,0,0,0.15)",
              boxSizing: "border-box",
              userSelect: isModalDragging ? "none" : "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Draggable Modal Header */}
            <div
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest("select")) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                setIsModalDragging(true);
                modalDragRef.current = {
                  pointerX: e.clientX,
                  pointerY: e.clientY,
                  startX: modalPos.x,
                  startY: modalPos.y,
                };
              }}
              onPointerMove={(e) => {
                if (!isModalDragging || !modalDragRef.current) return;
                const dx = e.clientX - modalDragRef.current.pointerX;
                const dy = e.clientY - modalDragRef.current.pointerY;
                const nextX = Math.max(10, Math.min(window.innerWidth - 310, modalDragRef.current.startX + dx));
                const nextY = Math.max(10, Math.min(window.innerHeight - 350, modalDragRef.current.startY + dy));
                setModalPos({ x: nextX, y: nextY });
              }}
              onPointerUp={(e) => {
                if (isModalDragging) {
                  try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                  setIsModalDragging(false);
                  modalDragRef.current = null;
                }
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: isModalDragging ? "grabbing" : "grab",
                marginBottom: "8px",
                paddingBottom: "5px",
                borderBottom: `1px solid ${palette.cardBorder}`,
              }}
              title="Click and drag to move dialog"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: palette.textMuted }}>
                  <IconGripVertical size={13} />
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: 700 }}>
                  {modalMode === "create" ? "New Habit Tracker" : "Edit Habit"}
                </span>
              </div>
              <button
                onClick={() => setModalMode(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: palette.textMuted,
                  cursor: "pointer",
                  fontSize: "13px",
                  padding: "0 2px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHabitForm}>
              {/* Habit Name */}
              <div style={{ marginBottom: "7px" }}>
                <label style={{ display: "block", fontSize: "9.5px", color: palette.textMuted, marginBottom: "2px" }}>
                  Habit Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coding Practice, DSA, Reading..."
                  value={habitFormName}
                  onChange={(e) => setHabitFormName(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "4px 6px",
                    fontSize: "11px",
                    background: isDark ? "#0d1117" : "#f6f8fa",
                    border: `1px solid ${palette.cardBorder}`,
                    borderRadius: "3px",
                    color: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Goal & Theme */}
              <div style={{ display: "flex", gap: "5px", marginBottom: "7px" }}>
                <div style={{ width: "85px" }}>
                  <label style={{ display: "block", fontSize: "9.5px", color: palette.textMuted, marginBottom: "2px" }}>
                    Goal (Hours/d)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={habitFormTarget}
                    onChange={(e) => setHabitFormTarget(Number(e.target.value) || 4)}
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      fontSize: "11px",
                      background: isDark ? "#0d1117" : "#f6f8fa",
                      border: `1px solid ${palette.cardBorder}`,
                      borderRadius: "3px",
                      color: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "9.5px", color: palette.textMuted, marginBottom: "2px" }}>
                    Color Theme
                  </label>
                  <select
                    value={habitFormTheme}
                    onChange={(e) => setHabitFormTheme(e.target.value as HabitColorTheme)}
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      fontSize: "11px",
                      background: isDark ? "#0d1117" : "#f6f8fa",
                      border: `1px solid ${palette.cardBorder}`,
                      borderRadius: "3px",
                      color: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="github">GitHub Classic Green</option>
                    <option value="emerald">Neon Emerald</option>
                    <option value="cyan">Cyan Frost</option>
                    <option value="amber">Sunset Amber</option>
                    <option value="purple">Cyber Purple</option>
                  </select>
                </div>
              </div>

              {/* Active Date Range Selection */}
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "9.5px", color: palette.textMuted, marginBottom: "2px" }}>
                  Record Date Range
                </label>
                <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="date"
                      value={habitFormStart}
                      onChange={(e) => setHabitFormStart(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "3px 5px",
                        fontSize: "10px",
                        background: isDark ? "#0d1117" : "#f6f8fa",
                        border: `1px solid ${palette.cardBorder}`,
                        borderRadius: "3px",
                        color: "inherit",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <span style={{ alignSelf: "center", fontSize: "9px", color: palette.textMuted }}>→</span>
                  <div style={{ flex: 1 }}>
                    <input
                      type="date"
                      value={habitFormEnd}
                      onChange={(e) => setHabitFormEnd(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "3px 5px",
                        fontSize: "10px",
                        background: isDark ? "#0d1117" : "#f6f8fa",
                        border: `1px solid ${palette.cardBorder}`,
                        borderRadius: "3px",
                        color: "inherit",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: "flex", gap: "2px" }}>
                  {[
                    { label: "This Year", type: "year" as const },
                    { label: "30 Days", type: "month" as const },
                    { label: "90 Days", type: "3months" as const },
                    { label: "6 Months", type: "6months" as const },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSetPresetRange(p.type)}
                      style={{
                        flex: 1,
                        padding: "2px 0",
                        fontSize: "8.5px",
                        fontWeight: 600,
                        background: "var(--hover-bg, rgba(255,255,255,0.06))",
                        border: `1px solid ${palette.cardBorder}`,
                        borderRadius: "2px",
                        color: palette.textMuted,
                        cursor: "pointer",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                {modalMode === "edit" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteId(activeHabit.id);
                    }}
                    style={{
                      padding: "3px 6px",
                      fontSize: "10px",
                      fontWeight: 600,
                      background: "rgba(248, 81, 73, 0.1)",
                      border: "1px solid rgba(248, 81, 73, 0.3)",
                      borderRadius: "3px",
                      color: "#ff7b72",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                    title="Delete this habit"
                  >
                    <IconTrash size={10} />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    style={{
                      padding: "3px 8px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      background: "transparent",
                      border: `1px solid ${palette.cardBorder}`,
                      borderRadius: "3px",
                      color: palette.textMuted,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!habitFormName.trim()}
                    style={{
                      padding: "3px 10px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      background: "var(--color-primary, #6366f1)",
                      border: "none",
                      borderRadius: "3px",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {modalMode === "create" ? "Create" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              width: "270px",
              background: isDark ? "#161b22" : "#ffffff",
              border: `1px solid ${palette.cardBorder}`,
              borderRadius: "8px",
              padding: "14px",
              color: isDark ? "#f0f6fc" : "#1f2328",
              boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{ color: "#ff7b72" }}>
                <IconTrash size={14} />
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700 }}>Delete Habit?</span>
            </div>
            <p style={{ fontSize: "11px", color: palette.textMuted, margin: "0 0 12px 0", lineHeight: 1.4 }}>
              Are you sure you want to delete <strong style={{ color: palette.textPrimary }}>
                {store.habits.find((h) => h.id === confirmDeleteId)?.name || "this habit"}
              </strong> and its recorded history?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  background: "transparent",
                  border: `1px solid ${palette.cardBorder}`,
                  borderRadius: "4px",
                  color: palette.textMuted,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteHabit(confirmDeleteId)}
                style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  background: "#da3633",
                  border: "none",
                  borderRadius: "4px",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
