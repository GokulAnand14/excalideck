import React, { useState } from "react";
import type { ExcalideckPlugin, PluginContext } from "../../types";
import { generateCalendar } from "./generator";
import { IconCalendar } from "../../../components/common/Icons";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const btnStyle: React.CSSProperties = {
  background: "var(--hover-bg, rgba(255,255,255,0.06))",
  border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
  borderRadius: "4px",
  color: "var(--text-primary)",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const inputStyle: React.CSSProperties = {
  background: "var(--hover-bg, rgba(255,255,255,0.06))",
  border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
  borderRadius: "4px",
  color: "var(--text-primary)",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box",
};

const CalendarPanel: React.FC<{ onInsert: (y: number, m: number) => void }> = ({ onInsert }) => {
  const [date, setDate] = useState(() => new Date());
  const year = date.getFullYear();
  const month = date.getMonth();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "4px 0",
        fontSize: "12px",
        color: "var(--text-primary)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Row 1: Date Navigator */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => setDate(new Date(year, month - 1, 1))}
          style={{ ...btnStyle, width: "24px", height: "26px", flexShrink: 0 }}
          title="Previous Month"
        >
          ‹
        </button>
        <select
          value={month}
          onChange={(e) => setDate(new Date(year, Number(e.target.value), 1))}
          style={{
            ...inputStyle,
            flex: 1,
            minWidth: 0,
            height: "26px",
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          {MONTHS.map((name, i) => (
            <option
              key={name}
              value={i}
              style={{ background: "var(--bg-primary, #18181b)", color: "inherit" }}
            >
              {name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setDate(new Date(Number(e.target.value) || year, month, 1))}
          style={{
            ...inputStyle,
            width: "52px",
            height: "26px",
            flexShrink: 0,
            textAlign: "center",
            padding: "0 2px",
          }}
        />
        <button
          onClick={() => setDate(new Date(year, month + 1, 1))}
          style={{ ...btnStyle, width: "24px", height: "26px", flexShrink: 0 }}
          title="Next Month"
        >
          ›
        </button>
      </div>

      {/* Row 2: Actions */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => setDate(new Date())}
          style={{
            ...btnStyle,
            height: "28px",
            padding: "0 8px",
            flexShrink: 0,
            fontSize: "11px",
          }}
          title="Go to current month"
        >
          Today
        </button>
        <button
          onClick={() => onInsert(year, month)}
          style={{
            flex: 1,
            minWidth: 0,
            height: "28px",
            background: "var(--color-primary, #6366f1)",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontWeight: 600,
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "0 8px",
            boxSizing: "border-box",
          }}
        >
          <IconCalendar size={13} />
          <span>Insert Calendar</span>
        </button>
      </div>
    </div>
  );
};

export const studyCalendarPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    const getViewportCenter = () => {
      const appState = context.canvas.getAppState() || {};
      const zoom = appState.zoom?.value ?? appState.zoom ?? 1;
      const scrollX = appState.scrollX ?? 0;
      const scrollY = appState.scrollY ?? 0;
      const width = window.innerWidth || 1200;
      const height = window.innerHeight || 800;
      return { x: Math.round(-scrollX + width / 2 / zoom), y: Math.round(-scrollY + height / 2 / zoom) };
    };

    const insertCalendar = (y: number, m: number) => {
      const { x, y: cy } = getViewportCenter();
      const elements = generateCalendar({ year: y, month: m, centerX: x, centerY: cy });
      const current = Array.from(context.canvas.getElements() || []);
      const selectedElementIds: Record<string, boolean> = {};
      elements.forEach((el) => { selectedElementIds[el.id] = true; });

      context.canvas.updateScene({
        elements: [...current, ...elements],
        appState: { ...context.canvas.getAppState(), selectedElementIds },
        commitToHistory: true,
      });
      context.logger.info(`Inserted calendar for ${m + 1}/${y}`);
    };

    context.commands.register("study-calendar.insert", () => {
      const now = new Date();
      insertCalendar(now.getFullYear(), now.getMonth());
    });

    context.ui.registerSidebarPanel({
      id: "study-calendar-panel",
      title: "Calendar",
      icon: "calendar",
      render: () => <CalendarPanel onInsert={insertCalendar} />,
    });
  },
};
