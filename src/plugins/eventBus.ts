import { PluginEventName } from "./types";

type EventHandler = (...args: any[]) => void;

export class PluginEventBus {
  private listeners = new Map<PluginEventName, Set<EventHandler>>();

  on(event: PluginEventName, handler: EventHandler): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit(event: PluginEventName, ...args: any[]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (err) {
        console.error(`[PluginEventBus] Error in handler for "${event}":`, err);
      }
    });
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
