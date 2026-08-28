import type { PluginManifest, PluginPermission } from "./types";

export type PluginCategory =
  | "All"
  | "Productivity"
  | "Visualization"
  | "Styling"
  | "Utilities"
  | "Export";

export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: PluginCategory;
  type: "official" | "community";
  downloads: number;
  stars: number;
  tags: string[];
  iconBg?: string;
  repositoryUrl?: string;
  homepage?: string;
  permissions: PluginPermission[];
  readme?: string;
  sampleCode?: string;
}

/**
 * Official & Community Marketplace Catalog.
 */
export const MARKETPLACE_CATALOG: MarketplacePlugin[] = [
  // --- 1st Official Plugin (Requested by Reddit User Nitish_nc) ---
  {
    id: "excalideck.ghost-keys",
    name: "GhostKeys",
    version: "1.2.0",
    author: "Gokul (Official)",
    description: "Vim-style modal keyboard navigation engine. Toggle with Escape for conflict-free single-key canvas panning, element cycling, shape spawning, object moving, cloning, and zooming.",
    category: "Productivity",
    type: "official",
    downloads: 4850,
    stars: 5.0,
    tags: ["keyboard", "vim", "modal", "mouseless", "navigation", "pan", "hud"],
    homepage: "https://github.com/GokulAnand14/excalideck",
    permissions: ["canvas:read", "canvas:write", "ui:statusbar", "ui:sidebar", "commands:register"],
    readme: `
# GhostKeys: Modal Keyboard Navigation for Excalideck

Built for mouseless diagramming, fast sketching, and power users. Designed with a Vim-style modal architecture to completely eliminate shortcut conflicts with native Excalidraw tools.

### 🚀 Key Bindings:
- **Toggle Navigation Mode**: \`Escape\` or \`Alt + K\`
- **Exit to Normal Mode**: \`i\` or \`Enter\`
- **Pan Viewport**: \`H\` \`J\` \`K\` \`L\` or \`W\` \`A\` \`S\` \`D\` (\`Shift\` for turbo pan)
- **Nudge Selected Element**: \`Arrow Keys\`
- **Cycle Selection**: \`Tab\` / \`Shift + Tab\`
- **Spawn Shapes (Center)**: \`R\` (Box), \`O\` (Circle), \`D\` (Diamond), \`T\` (Text), \`A\` (Arrow)
- **Object Manipulation**: \`C\` (Duplicate), \`X\` (Delete)
- **Zoom Controls**: \`+\` / \`-\` / \`0\` / \`Z\` (Fit to content)
- **Floating HUD & Status Bar**: Real-time mode indicators.
    `,
  },
];
