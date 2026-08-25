import React, { useEffect } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    // setTimeout to prevent immediate close if it was opened by a click event that bubbles up
    setTimeout(() => {
      window.addEventListener("click", handleClick);
    }, 0);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="context-menu" 
      style={{ top: y, left: x }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button 
          key={i} 
          className={`context-menu-item ${item.danger ? "danger" : ""}`}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
};
