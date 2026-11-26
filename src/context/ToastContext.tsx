import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { IconAlertTriangle, IconCheck } from "../components/common/Icons";
import "./Toast.css";

export type ToastType = "info" | "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      const duration = type === "error" ? 4500 : 2800;
      window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-viewport" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-item toast-${toast.type}`}
              onClick={() => dismissToast(toast.id)}
              title="Dismiss"
            >
              {toast.type === "error" && <IconAlertTriangle size={14} className="toast-icon" />}
              {toast.type === "success" && <IconCheck size={14} className="toast-icon" />}
              <span className="toast-message">{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
