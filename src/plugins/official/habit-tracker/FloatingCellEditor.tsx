import React, { useState, useEffect, useRef, useCallback } from "react";
import { HabitColorTheme } from "./types";
import { getCellColor } from "./palettes";
import { parseDateISO } from "./storage";
import { IconGripVertical, IconClock, IconActivity } from "../../../components/common/Icons";

interface FloatingCellEditorProps {
  dateStr: string;
  initialHours: number;
  initialNote?: string;
  targetHours: number;
  colorTheme: HabitColorTheme;
  theme: "dark" | "light";
  screenPos?: { x: number; y: number } | null;
  habitName?: string;
  onSave: (hours: number, note?: string) => void;
  onClose: () => void;
}

export const FloatingCellEditor: React.FC<FloatingCellEditorProps> = ({
  dateStr,
  initialHours,
  initialNote = "",
  targetHours,
  colorTheme,
  theme,
  screenPos,
  habitName,
  onSave,
  onClose,
}) => {
  const [hours, setHours] = useState<number>(initialHours || 0);
  const [note, setNote] = useState<string>(initialNote || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const DIALOG_WIDTH = 290;
  const DIALOG_HEIGHT = 250;

  // Draggable position state
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (screenPos) {
      let left = screenPos.x - DIALOG_WIDTH / 2;
      let top = screenPos.y - DIALOG_HEIGHT - 12;
      if (left < 16) left = 16;
      if (left + DIALOG_WIDTH > window.innerWidth - 16) left = window.innerWidth - DIALOG_WIDTH - 16;
      if (top < 16) top = screenPos.y + 24;
      if (top + DIALOG_HEIGHT > window.innerHeight - 16) top = window.innerHeight - DIALOG_HEIGHT - 16;
      return { x: Math.max(16, left), y: Math.max(16, top) };
    }
    return {
      x: Math.max(16, (window.innerWidth - DIALOG_WIDTH) / 2),
      y: Math.max(16, (window.innerHeight - DIALOG_HEIGHT) / 2),
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startPosX: number; startPosY: number } | null>(null);

  const dateObj = parseDateISO(dateStr);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const previewColors = getCellColor(hours, targetHours, colorTheme, theme);

  useEffect(() => {
    setHours(initialHours || 0);
    setNote(initialNote || "");
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
  }, [dateStr, initialHours, initialNote]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    let nextX = dragStartRef.current.startPosX + dx;
    let nextY = dragStartRef.current.startPosY + dy;

    // Bounds clamping
    nextX = Math.max(8, Math.min(window.innerWidth - DIALOG_WIDTH - 8, nextX));
    nextY = Math.max(8, Math.min(window.innerHeight - DIALOG_HEIGHT - 8, nextY));

    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const handleQuickAdd = (delta: number) => {
    setHours((prev) => Math.max(0, Number((prev + delta).toFixed(1))));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(hours, note.trim() || undefined);
  };

  const isDark = theme === "dark";
  const bg = isDark ? "#161b22" : "#ffffff";
  const border = isDark ? "#30363d" : "#d0d7de";
  const textPrimary = isDark ? "#f0f6fc" : "#1f2328";
  const textSecondary = isDark ? "#7d8590" : "#656d76";
  const inputBg = isDark ? "#0d1117" : "#f6f8fa";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "transparent",
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "fixed",
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${DIALOG_WIDTH}px`,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "8px",
          boxShadow: isDark
            ? "0 12px 32px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.12)"
            : "0 12px 32px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)",
          padding: "12px 14px",
          color: textPrimary,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "12px",
          boxSizing: "border-box",
          zIndex: 99999,
          userSelect: isDragging ? "none" : "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Movable Drag Header Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            cursor: isDragging ? "grabbing" : "grab",
            paddingBottom: "6px",
            borderBottom: `1px solid ${border}`,
          }}
          title="Click and drag to move dialog"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: textSecondary, opacity: 0.8, display: "flex", alignItems: "center" }}>
              <IconGripVertical size={13} />
            </span>
            <div>
              <div style={{ fontSize: "9.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: textSecondary }}>
                {habitName || "Habit Tracker"}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: textPrimary, marginTop: "1px" }}>
                {formattedDate}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: textSecondary,
              cursor: "pointer",
              fontSize: "13px",
              padding: "2px 4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Shading & Current Hours Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: inputBg,
            padding: "6px 8px",
            borderRadius: "5px",
            border: `1px solid ${border}`,
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "3px",
              background: previewColors.bg,
              border: `1px solid ${previewColors.border}`,
              flexShrink: 0,
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              transition: "all 0.12s ease",
            }}
            title={`Shade: ${hours}h / ${targetHours}h`}
          />
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", flex: 1 }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: textPrimary }}>{hours}</span>
            <span style={{ fontSize: "11px", color: textSecondary }}>hours studied</span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: textSecondary,
              background: isDark ? "#21262d" : "#e5e7eb",
              padding: "1px 5px",
              borderRadius: "4px",
              fontWeight: 500,
            }}
          >
            Goal {targetHours}h
          </span>
        </div>

        {/* Quick Presets */}
        <div style={{ display: "flex", gap: "3px", marginBottom: "8px" }}>
          {[
            { label: "+0.5h", val: 0.5 },
            { label: "+1h", val: 1.0 },
            { label: "+2h", val: 2.0 },
            { label: "+4h", val: 4.0 },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => handleQuickAdd(btn.val)}
              style={{
                flex: 1,
                padding: "3px 0",
                fontSize: "10.5px",
                fontWeight: 600,
                background: isDark ? "#21262d" : "#f3f4f6",
                border: `1px solid ${border}`,
                borderRadius: "3px",
                color: textPrimary,
                cursor: "pointer",
                transition: "background 0.1s ease",
              }}
            >
              {btn.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHours(0)}
            style={{
              padding: "3px 6px",
              fontSize: "10.5px",
              fontWeight: 600,
              background: isDark ? "rgba(248, 81, 73, 0.1)" : "#fee2e2",
              border: `1px solid ${isDark ? "#da3633" : "#fca5a5"}`,
              borderRadius: "3px",
              color: isDark ? "#ff7b72" : "#b91c1c",
              cursor: "pointer",
            }}
            title="Reset to 0h"
          >
            Clear
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            <div style={{ width: "70px" }}>
              <label style={{ display: "block", fontSize: "9.5px", color: textSecondary, marginBottom: "2px" }}>
                Hours
              </label>
              <input
                ref={inputRef}
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={hours || ""}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: "3px",
                  color: textPrimary,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "9.5px", color: textSecondary, marginBottom: "2px" }}>
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Topic, chapter..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  fontSize: "11px",
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: "3px",
                  color: textPrimary,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: 600,
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "3px",
                color: textSecondary,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                background: isDark ? "#238636" : "#1f883d",
                border: `1px solid ${isDark ? "#2ea043" : "#1a7f37"}`,
                borderRadius: "3px",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
