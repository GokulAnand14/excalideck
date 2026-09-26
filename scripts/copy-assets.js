import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const srcDir = path.join(rootDir, "node_modules", "@excalidraw", "excalidraw", "dist", "prod");
const publicDir = path.join(rootDir, "public");

const assetFolders = ["fonts", "locales", "data"];

assetFolders.forEach((folder) => {
  const from = path.join(srcDir, folder);
  const to = path.join(publicDir, folder);
  if (fs.existsSync(from)) {
    fs.cpSync(from, to, { recursive: true, force: true });
    console.log(`✅ [copy-assets] Synced @excalidraw/${folder} -> public/${folder}`);
  } else {
    console.warn(`⚠️ [copy-assets] Source folder not found: ${from}`);
  }
});
