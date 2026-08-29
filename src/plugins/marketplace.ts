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
    version: "1.3.0",
    author: "Gokul (Official)",
    description: "Vim-style modal keyboard navigation and diagramming engine. Single-key canvas panning, element resizing, proportional scaling, rotation, z-ordering, shape spawning, and selection cycling.",
    category: "Productivity",
    type: "official",
    tags: ["keyboard", "vim", "modal", "mouseless", "navigation", "pan", "hud"],
    homepage: "https://github.com/GokulAnand14/excalideck",
    permissions: ["canvas:read", "canvas:write", "ui:statusbar", "ui:sidebar", "commands:register"],
    readme: `
# GhostKeys: Modal Keyboard Navigation for Excalideck

Built for mouseless diagramming, fast sketching, and power users. Designed with a Vim-style modal architecture to completely eliminate shortcut conflicts with native Excalidraw tools.

### Key Bindings:
- **Toggle Navigation Mode**: \`Escape\` or \`Alt + K\`
- **Exit to Normal Mode**: \`i\` or \`Enter\`
- **Pan Viewport**: \`H\` \`J\` \`K\` \`L\` or \`W\` \`A\` \`S\` \`D\` (\`Shift\` for turbo pan)
- **Nudge Selected Element**: \`Arrow Keys\`
- **Resize Width/Height**: \`Shift + Arrow Keys\` (\`Shift + ← / ↑ / ↓ / →\`)
- **Proportional Scale**: \`<\` (Scale Down) / \`>\` (Scale Up)
- **Rotate Element**: \`Shift + R\` (15° increments)
- **Layering (Z-Order)**: \`[\` (Send to Back) / \`]\` (Bring to Front)
- **Stroke Width**: \`1\` (Thin), \`2\` (Medium), \`3\` (Bold)
- **Cycle Selection**: \`Tab\` / \`Shift + Tab\`
- **Spawn Shapes (Center)**: \`R\` (Box), \`O\` (Circle), \`D\` (Diamond), \`T\` (Text), \`A\` (Arrow)
- **Object Manipulation**: \`C\` (Duplicate), \`X\` (Delete)
- **Zoom Controls**: \`+\` / \`-\` / \`0\` / \`Z\` (Fit to content)
- **Floating HUD & Status Bar**: Real-time mode indicators.
    `,
  },
  // --- 2nd Official Plugin: StudyCalendar ---
  {
    id: "excalideck.study-calendar",
    name: "StudyCalendar",
    version: "1.0.0",
    author: "Gokul (Official)",
    description: "Minimal boxy Excalidraw calendar generator. Choose any month and insert a clean, hand-drawn calendar grid onto your canvas.",
    category: "Productivity",
    type: "official",
    tags: ["calendar", "planner", "monthly", "grid", "boxy", "minimalist"],
    homepage: "https://github.com/GokulAnand14/excalideck",
    permissions: ["canvas:read", "canvas:write", "ui:statusbar", "ui:sidebar", "commands:register"],
    readme: `
# StudyCalendar: Minimal Boxy Calendar Generator for Excalideck

Choose any month and insert a clean, hand-drawn boxy calendar grid directly onto your canvas.

### Features:
- **Minimalist Month & Year Title**: Hand-drawn title cleanly aligned above the grid.
- **Boxy Weekday Headers**: Sharp Mon–Sun headers with clear typography.
- **Hand-Drawn Day Grid**: Responsive, boxy day cells grouped together for easy repositioning.
- **Dark & Light Mode Support**: Adapts automatically to your active canvas theme.
    `,
  },
];
