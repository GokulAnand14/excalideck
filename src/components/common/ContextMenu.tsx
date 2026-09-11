import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x, y });

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const pad = 8;
    let newX = x;
    let newY = y;

    if (newX + rect.width > window.innerWidth - pad) {
      newX = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (newX < pad) {
      newX = pad;
    }

    if (newY + rect.height > window.innerHeight - pad) {
      newY = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    if (newY < pad) {
      newY = pad;
    }

    setCoords({ x: newX, y: newY });
  }, [x, y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <div
        className="context-menu-backdrop"
        onClick={onClose}
        onTouchStart={onClose}
        aria-hidden="true"
      />
      <div
        ref={menuRef}
        className="context-menu"
        style={{ top: coords.y, left: coords.x }}
        onClick={(e) => e.stopPropagation()}
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
    </>
  );
};

