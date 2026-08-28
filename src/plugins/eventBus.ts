import { PluginEventName } from "./types";

type EventHandler = (...args: any[]) => void;

export class PluginEventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  on(event: PluginEventName, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
      if (this.listeners.get(event)?.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit(event: PluginEventName, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(...args);
      } catch (err) {
        console.error(`[PluginEventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  removeAllListeners(event?: PluginEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: PluginEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
