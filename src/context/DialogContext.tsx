import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";
import "./Dialog.css";

export interface PromptOptions {
  title: string;
  subtitle?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: ReactNode;
}

interface DialogContextType {
  promptDialog: (options: PromptOptions) => Promise<string | null>;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptOptions;
    value: string;
    resolve: (val: string | null) => void;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const promptDialog = (options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        value: options.defaultValue || "",
        resolve,
      });
    });
  };

  const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  // Auto-focus input field on prompt open
  useEffect(() => {
    if (promptState?.isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [promptState?.isOpen]);

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptState) return;
    const trimmed = promptState.value.trim();
    if (trimmed) {
      promptState.resolve(trimmed);
      setPromptState(null);
    }
  };

  const handlePromptCancel = () => {
    if (!promptState) return;
    promptState.resolve(null);
    setPromptState(null);
  };

  const handleConfirmSubmit = () => {
    if (!confirmState) return;
    confirmState.resolve(true);
    setConfirmState(null);
  };

  const handleConfirmCancel = () => {
    if (!confirmState) return;
    confirmState.resolve(false);
    setConfirmState(null);
  };

  return (
    <DialogContext.Provider value={{ promptDialog, confirmDialog }}>
      {children}

      {/* Modern Custom Prompt Dialog */}
      {promptState?.isOpen && (
        <div className="custom-dialog-backdrop" onClick={handlePromptCancel}>
          <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="custom-dialog-header">
              <div className="dialog-title-group">
                {promptState.options.icon && (
                  <div className="dialog-icon-badge">{promptState.options.icon}</div>
                )}
                <div>
                  <h3 className="dialog-title">{promptState.options.title}</h3>
                  {promptState.options.subtitle && (
                    <p className="dialog-subtitle">{promptState.options.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                className="dialog-close-btn"
                onClick={handlePromptCancel}
                title="Cancel"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePromptSubmit}>
              <div className="custom-dialog-body">
                <input
                  ref={inputRef}
                  type="text"
                  className="dialog-input"
                  placeholder={promptState.options.placeholder || "Enter name..."}
                  value={promptState.value}
                  onChange={(e) =>
                    setPromptState({ ...promptState, value: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handlePromptCancel();
                    }
                  }}
                />
              </div>

              <div className="custom-dialog-footer">
                <button
                  type="button"
                  className="dialog-btn secondary"
                  onClick={handlePromptCancel}
                >
                  {promptState.options.cancelText || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="dialog-btn primary"
                  disabled={!promptState.value.trim()}
                >
                  {promptState.options.confirmText || "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Custom Confirmation Dialog */}
      {confirmState?.isOpen && (
        <div className="custom-dialog-backdrop" onClick={handleConfirmCancel}>
          <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="custom-dialog-header">
              <div className="dialog-title-group">
                {confirmState.options.icon && (
                  <div className={`dialog-icon-badge ${confirmState.options.danger ? "danger" : ""}`}>
                    {confirmState.options.icon}
                  </div>
                )}
                <div>
                  <h3 className="dialog-title">{confirmState.options.title}</h3>
                  {confirmState.options.subtitle && (
                    <p className="dialog-subtitle">{confirmState.options.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                className="dialog-close-btn"
                onClick={handleConfirmCancel}
                title="Cancel"
              >
                ✕
              </button>
            </div>

            <div className="custom-dialog-body">
              <p className="dialog-message-text">{confirmState.options.message}</p>
            </div>

            <div className="custom-dialog-footer">
              <button
                type="button"
                className="dialog-btn secondary"
                onClick={handleConfirmCancel}
                autoFocus
              >
                {confirmState.options.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                className={`dialog-btn ${confirmState.options.danger ? "danger" : "primary"}`}
                onClick={handleConfirmSubmit}
              >
                {confirmState.options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
