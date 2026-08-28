import React, { Component, ErrorInfo, ReactNode } from "react";

interface PluginSlotProps {
  render: () => ReactNode;
  fallback?: ReactNode;
}

interface PluginSlotState {
  hasError: boolean;
}

/**
 * Isolated component host for rendering dynamic plugin UI slots.
 * Guarantees that plugin hooks/state live in their own fiber and
 * errors in plugin UI do not crash the main application.
 */
class PluginSlotBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  PluginSlotState
> {
  state: PluginSlotState = { hasError: false };

  static getDerivedStateFromError(): PluginSlotState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PluginSlot] Error caught in plugin component:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

const PluginSlotContent: React.FC<{ render: () => ReactNode }> = ({ render }) => {
  return <>{render()}</>;
};

export const PluginSlot: React.FC<PluginSlotProps> = ({ render, fallback }) => {
  return (
    <PluginSlotBoundary fallback={fallback}>
      <PluginSlotContent render={render} />
    </PluginSlotBoundary>
  );
};
