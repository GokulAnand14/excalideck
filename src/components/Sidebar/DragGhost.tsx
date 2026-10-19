import React from "react";
import { IconFileDrawing, IconFolder } from "../common/Icons";

interface DragGhostProps {
  name: string;
  isFolder: boolean;
  x: number;
  y: number;
}

export const DragGhost = React.forwardRef<HTMLDivElement, DragGhostProps>(({
  name,
  isFolder,
  x,
  y,
}, ref) => {
  const cleanName = name.replace(".excalidraw", "");

  return (
    <div
      ref={ref}
      className="drag-ghost"
      style={{
        transform: `translate3d(${x + 12}px, ${y + 12}px, 0)`,
      }}
    >
      {isFolder ? <IconFolder size={14} /> : <IconFileDrawing size={14} />}
      <span>{cleanName}</span>
    </div>
  );
});
