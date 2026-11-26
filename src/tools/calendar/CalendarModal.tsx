import React, { useState, useEffect } from "react";
import { IconCalendar } from "../../components/common/Icons";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (year: number, month: number) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [date, setDate] = useState(() => new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const [yearInput, setYearInput] = useState(() => String(year));

  useEffect(() => {
    setYearInput(String(year));
  }, [year]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const clampYear = (val: number) => Math.min(2100, Math.max(1900, val));

  const handlePrevMonth = () => {
    setDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleYearCommit = () => {
    const parsed = parseInt(yearInput, 10);
    if (Number.isFinite(parsed)) {
      const clamped = clampYear(parsed);
      setDate(new Date(clamped, month, 1));
      setYearInput(String(clamped));
    } else {
      setYearInput(String(year));
    }
  };

  const handleInsert = () => {
    const parsed = parseInt(yearInput, 10);
    const effectiveYear = Number.isFinite(parsed) ? clampYear(parsed) : year;
    onInsert(effectiveYear, month);
    onClose();
  };

  return (
    <div className="calendar-popover-overlay" onClick={onClose}>
      <div
        className="calendar-popover"
        role="dialog"
        aria-modal="true"
        aria-label="Insert Calendar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="calendar-popover-header">
          <div className="calendar-popover-title">
            <IconCalendar size={14} />
            <span>Insert Calendar</span>
          </div>
          <button className="calendar-popover-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="calendar-popover-controls">
          <button
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            title="Previous Month"
            aria-label="Previous Month"
          >
            ‹
          </button>
          <select
            className="calendar-select"
            value={month}
            onChange={(e) => setDate(new Date(year, Number(e.target.value), 1))}
            aria-label="Month"
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1900}
            max={2100}
            className="calendar-year-input"
            value={yearInput}
            aria-label="Year"
            onChange={(e) => {
              const raw = e.target.value;
              setYearInput(raw);
              const parsed = parseInt(raw, 10);
              if (raw.length === 4 && Number.isFinite(parsed) && parsed >= 1900 && parsed <= 2100) {
                setDate(new Date(parsed, month, 1));
              }
            }}
            onBlur={handleYearCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsert();
              }
            }}
          />
          <button
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            title="Next Month"
            aria-label="Next Month"
          >
            ›
          </button>
        </div>

        <div className="calendar-popover-actions">
          <button className="calendar-today-btn" onClick={handleToday}>
            This Month
          </button>
          <button className="calendar-submit-btn" onClick={handleInsert}>
            Insert to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
