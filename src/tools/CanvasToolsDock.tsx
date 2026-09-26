import React from "react";
import { IconCalendar } from "../components/common/Icons";

interface CanvasToolsDockProps {
  onOpenCalendar: () => void;
}

export const CanvasToolsDock: React.FC<CanvasToolsDockProps> = ({
  onOpenCalendar,
}) => {
  return (
    <div className="canvas-tools-dock" title="Canvas Tools">
      <button
        className="canvas-tool-btn"
        onClick={onOpenCalendar}
        title="Insert Calendar Planner to Canvas"
      >
        <IconCalendar size={14} />
        <span>Calendar</span>
      </button>
    </div>
  );
};
