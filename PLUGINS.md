# Excalideck Plugin System Documentation

Excalideck features an extensible, lightweight plugin system supporting two types of plugins:
1. **Built-in Plugins**: Bundled with the app binary, statically imported, and shipped with releases.
2. **Community Plugins**: Vault-local plugins residing in `<vault>/.excalideck/plugins/<plugin-id>/`, discovered dynamically upon opening a vault.

---

## 1. Plugin Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       PluginManager                         │
│   ├─ Discovers built-in & community plugins                 │
│   ├─ Manages plugin lifecycle (activate / deactivate)       │
│   ├─ Dispatches typed event bus lifecycle signals           │
│   └─ Isolates errors to prevent host crashes                │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│     PluginContext     │             │     UI Slots / Bus    │
│  ├─ app (theme/file)  │             │  ├─ Sidebar panels    │
│  ├─ canvas (elements) │             │  ├─ Status bar items  │
│  ├─ storage (vault KV)│             │  ├─ Commands registry │
│  ├─ commands          │             │  └─ Custom event bus  │
│  ├─ events            │             └───────────────────────┘
│  └─ logger            │
└───────────────────────┘
```

---

## 2. Plugin Structure

Every plugin consists of:
- `plugin.json`: The manifest describing the plugin metadata, permissions, and contributions.
- `index.ts` / `index.js`: The entry point implementing the `ExcalideckPlugin` interface.

### `plugin.json` Manifest Format

```json
{
  "id": "excalideck.word-count",
  "name": "Word Count",
  "version": "1.0.0",
  "description": "Calculates word count and canvas stats",
  "author": "Gokul",
  "homepage": "https://github.com/GokulAnand14/excalideck",
  "license": "MIT",
  "engine": ">=0.1.0",
  "main": "index.ts",
  "builtin": true,
  "permissions": ["canvas:read", "storage:read", "storage:write"],
  "contributes": {
    "commands": [
      { "id": "word-count.refresh", "title": "Refresh Word Count" }
    ],
    "sidebarPanels": [
      { "id": "word-count.stats", "title": "Canvas Stats" }
    ]
  }
}
```

---

## 3. Creating a Plugin

A plugin exports an object implementing `ExcalideckPlugin`:

```typescript
import type { ExcalideckPlugin, PluginContext } from "@/plugins";

const myPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    context.logger.info("Plugin activated!");

    // 1. Listen to canvas changes
    context.canvas.onCanvasChange((elements, appState) => {
      context.logger.info("Canvas updated with elements:", elements.length);
    });

    // 2. Register a command
    context.commands.register("say-hello", () => {
      alert("Hello from plugin!");
    });

    // 3. Register a status bar widget
    context.ui.registerStatusBarItem({
      id: "indicator",
      render: () => <span>⚡ Plugin Active</span>,
    });

    // 4. Register a sidebar panel
    context.ui.registerSidebarPanel({
      id: "stats-panel",
      title: "My Stats",
      render: () => <div>Panel content here</div>,
    });

    // 5. Use vault-persistent key-value storage
    context.storage.set("lastRun", Date.now().toString());
  },

  deactivate() {
    // Cleanup if needed (subscriptions & UI items are auto-disposed)
  }
};

export default myPlugin;
```

---

## 4. Publishing & Registering Plugins

### Method A: Shipping Built-in Plugins (Developer)

1. Place plugin code inside `src/plugins/builtin/<plugin-name>/`.
2. Register it in `src/plugins/registry.ts`:

```typescript
import myPlugin from "./builtin/my-plugin";

builtinPlugins.set("my-plugin-id", {
  manifest: {
    id: "my-plugin-id",
    name: "My Plugin",
    version: "1.0.0",
    description: "...",
    author: "...",
    main: "index.ts",
    builtin: true,
    permissions: ["canvas:read"],
  },
  factory: () => myPlugin,
});
```

### Method B: Community Plugins (Users & Community)

1. In any vault directory, create `.excalideck/plugins/<plugin-id>/`.
2. Place `plugin.json` and compiled `index.js` inside the folder.
3. Excalideck automatically discovers and loads the plugin whenever that vault is opened.
