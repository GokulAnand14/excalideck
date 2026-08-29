import React, { ReactNode } from "react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

interface PluginSlotProps {
  render: () => ReactNode;
  fallback?: ReactNode;
}

const PluginSlotContent: React.FC<{ render: () => ReactNode }> = ({ render }) => {
  return <>{render()}</>;
};

export const PluginSlot: React.FC<PluginSlotProps> = ({ render, fallback }) => {
  return (
    <ErrorBoundary fallback={fallback ?? null}>
      <PluginSlotContent render={render} />
    </ErrorBoundary>
  );
};
