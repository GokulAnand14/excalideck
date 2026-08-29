# 🔌 Excalideck Plugin Development Guide

Welcome to the Excalideck Plugin ecosystem! Excalideck features a powerful, lightweight, and extensible plugin engine designed to let the community build everything from new UI components to complex canvas manipulation engines.

This guide will walk you through the architecture, the Plugin API surface, and how to create your first plugin.

---

## 📖 Table of Contents

- [Architecture Overview](#architecture-overview)
- [The Plugin API Surface](#the-plugin-api-surface)
- [Tutorial: Creating a Hello World Plugin](#tutorial-creating-a-hello-world-plugin)
- [Tutorial: Interacting with the Canvas](#tutorial-interacting-with-the-canvas)
- [Marketplace Registration](#marketplace-registration)
- [UI & Styling Guidelines](#ui--styling-guidelines)
- [Best Practices](#best-practices)

---

## 🏗 Architecture Overview

Excalideck plugins are simply JavaScript/TypeScript objects that implement the `ExcalideckPlugin` interface:

```typescript
export interface ExcalideckPlugin {
  activate(context: PluginContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
```

When a user installs or enables your plugin, the core engine calls `activate()` and passes in the `PluginContext`. When the plugin is disabled or uninstalled, `deactivate()` is called. 

The `PluginContext` is your gateway to Excalideck. It provides isolated, safe access to the Excalidraw canvas, the native file system, global state, UI hooks, and the command palette.

---

## 🔌 The Plugin API Surface

The `context` object provided to your `activate` function has the following modules:

### `context.canvas`
The most important module. It allows you to read from and write to the active Excalidraw canvas.
- `getElements()`: Returns the current Excalidraw shapes.
- `getAppState()`: Returns the current zoom, scroll, and view state.
- `updateScene({ elements, appState })`: Safely pushes new shapes or modifies the view.
- `onCanvasChange(callback)`: Listen for any live edits made by the user.

### `context.ui`
Hooks for injecting custom React components into Excalideck's native UI.
- `registerSidebarPanel({ id, title, icon, render })`: Adds a custom tab to the dedicated Plugins Sidebar.
- `registerStatusBarItem({ id, render })`: Adds an item to the bottom status bar.

### `context.commands`
Register global commands that users can trigger via the Command Palette or keyboard shortcuts.
- `register(id, handler)`: Bind a unique string ID to a function.

### `context.events`
A global event bus for system-wide hooks.
- `on(eventName, handler)`: Listen to events like `file:open`, `theme:change`, or `vault:open`.
- `emit('custom:my-event', data)`: Broadcast events to other plugins.

### `context.storage`
Key-value storage specific to your plugin (persisted in Tauri's local storage).
- `get(key)`, `set(key, value)`, `delete(key)`

### `context.app`
Read-only metadata about the environment.
- `getTheme()`, `getVaultPath()`, `getCurrentFile()`.

---

## 🛠 Tutorial: Creating a Hello World Plugin

Plugins belong in the `src/plugins/official/` directory (or `community/` for 3rd-party).

1. **Create the folder:** `src/plugins/official/hello-world/`
2. **Create `index.tsx`:**

```tsx
import React from 'react';
import type { ExcalideckPlugin, PluginContext } from '../../types';

export const helloWorldPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    context.logger.info("Hello World plugin activated!");

    // 1. Register a Status Bar Item
    context.ui.registerStatusBarItem({
      id: "hello-world-status",
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>👋 Hello World</span>
        </div>
      ),
    });

    // 2. Register a Sidebar Panel
    context.ui.registerSidebarPanel({
      id: "hello-world-panel",
      title: "Hello World",
      render: () => (
        <div style={{ padding: '8px', color: 'var(--text-primary)' }}>
          <h3>Welcome to Excalideck!</h3>
          <p>This is a custom React component injected by a plugin.</p>
          <button 
            onClick={() => context.logger.info("Button clicked!")}
            style={{ background: 'var(--accent-color)', color: '#fff', padding: '6px', borderRadius: '4px' }}
          >
            Log to Console
          </button>
        </div>
      )
    });
  },

  deactivate() {
    // Excalideck automatically unregisters UI elements,
    // but you can clean up custom intervals or event listeners here.
  }
};
```

---

## 🎨 Tutorial: Interacting with the Canvas

Here is how you manipulate shapes on the Excalidraw canvas. Let's create a plugin that spawns a sticky note at the exact center of the screen when a command is run.

```typescript
import { nanoid } from 'nanoid';
import type { ExcalideckPlugin, PluginContext } from '../../types';

export const stickyGeneratorPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    
    context.commands.register("sticky.spawn", () => {
      // 1. Get the current app state to find the viewport center
      const appState = context.canvas.getAppState();
      const scrollX = appState.scrollX ?? 0;
      const scrollY = appState.scrollY ?? 0;
      const zoom = appState.zoom?.value ?? 1;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const centerX = -scrollX + (width / 2) / zoom;
      const centerY = -scrollY + (height / 2) / zoom;

      // 2. Create an Excalidraw Element object
      const newSticky = {
        id: nanoid(),
        type: "text",
        x: centerX,
        y: centerY,
        width: 150,
        height: 50,
        text: "Don't forget to study!",
        fontSize: 20,
        fontFamily: 1, // Virgil (hand-drawn)
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        roughness: 1,
        opacity: 100,
        version: 1,
        versionNonce: 1,
        isDeleted: false,
      };

      // 3. Push it to the scene
      const currentElements = context.canvas.getElements();
      context.canvas.updateScene({
        elements: [...currentElements, newSticky],
        commitToHistory: true, // Allows the user to Undo (Ctrl+Z)
      });
    });

  }
};
```

---

## 🛒 Marketplace Registration

To make your plugin visible in the Excalideck Plugin Marketplace:

1. Open `src/plugins/marketplace.ts`.
2. Add your plugin's manifest to `MARKETPLACE_CATALOG`:

```typescript
export const MARKETPLACE_CATALOG: PluginManifest[] = [
  {
    id: "excalideck.my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    description: "Does awesome things.",
    author: "Your Name",
    category: "Utility",
    type: "official",
    tags: ["awesome", "canvas"],
    permissions: ["canvas:read", "canvas:write", "ui:sidebar"],
    main: "index.tsx",
    builtin: false,
  }
];
```

3. Open `src/plugins/communityLoader.ts` and add your plugin to the `OFFICIAL_PLUGIN_MODULES` record so the engine can lazily load it when a user clicks "Install" in the UI.

---

## 💅 UI & Styling Guidelines

Plugins should feel native to Excalideck. Always use the built-in CSS variables for colors, borders, and backgrounds so your plugin automatically respects Dark Mode and Light Mode.

**Core Variables:**
- `var(--bg-primary)`: App background
- `var(--bg-secondary)`: Sidebar & Panels
- `var(--bg-card)`: Elevated cards
- `var(--text-primary)`: Standard text
- `var(--text-secondary)`: Muted text
- `var(--border-color)`: UI borders
- `var(--hover-bg)`: Hover states for buttons
- `var(--accent-color)`: Excalideck brand primary color

---

## 🏆 Best Practices

1. **Be Lean:** The Excalidraw canvas relies on 60fps React rendering. Do not block the main thread with heavy synchronous loops in `onCanvasChange`.
2. **Clean Up:** The Plugin Engine automatically tracks and removes UI components and Commands when your plugin is disabled. However, if you attach raw DOM events (`window.addEventListener`), you **must** remove them in `deactivate()`.
3. **Handle Errors:** Wrap risky parsing or network calls in `try/catch`. 
4. **Use TypeScript:** Let the `PluginContext` type autocomplete guide you!

Happy building! 🚀
