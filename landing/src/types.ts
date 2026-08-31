export type WindowId = 'hero' | 'vim' | 'vault' | 'diff' | 'plugins';

export interface WindowState {
  id: WindowId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  isOpen: boolean;
  activeTab?: string;
  screenshotSlotId: string;
  screenshotResolution: string;
}

export interface ScreenshotSlot {
  id: string;
  name: string;
  recommendedResolution: string;
  aspectRatio: string;
  description: string;
  userImageUrl?: string;
}
