import React, { useState } from "react";
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

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleInsert = () => {
    onInsert(year, month);
    onClose();
  };

  return (
    <div className="calendar-popover-overlay" onClick={onClose}>
      <div className="calendar-popover" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-popover-header">
          <div className="calendar-popover-title">
            <IconCalendar size={14} />
            <span>Insert Calendar</span>
          </div>
          <button className="calendar-popover-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Month & Year Selection */}
        <div className="calendar-popover-controls">
          <button
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            title="Previous Month"
          >
            ‹
          </button>
          <select
            className="calendar-select"
            value={month}
            onChange={(e) => setDate(new Date(year, Number(e.target.value), 1))}
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="calendar-year-input"
            value={year}
            onChange={(e) => setDate(new Date(Number(e.target.value) || year, month, 1))}
          />
          <button
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            title="Next Month"
          >
            ›
          </button>
        </div>

        {/* Action Buttons */}
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
