import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+.*$/.test(newVersion)) {
  console.error("❌ Please provide a valid version number (e.g. bun run release 0.1.4)");
  process.exit(1);
}

const tag = `v${newVersion.replace(/^v/, "")}`;
const cleanVersion = newVersion.replace(/^v/, "");

console.log(`🚀 Syncing with remote repository...`);
try {
  execSync(`git pull --rebase origin main`, { cwd: rootDir, stdio: "inherit" });
} catch (e) {
  console.warn("⚠️ Could not pull rebase from remote, continuing with local state...");
}

console.log(`\n🚀 Preparing release for ${tag} (version ${cleanVersion})...\n`);

// 1. Update package.json
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
pkg.version = cleanVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ Updated package.json -> ${cleanVersion}`);

// 2. Update src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
tauriConf.version = cleanVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
console.log(`✅ Updated src-tauri/tauri.conf.json -> ${cleanVersion}`);

// 3. Update src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, "src-tauri", "Cargo.toml");
let cargoToml = fs.readFileSync(cargoPath, "utf-8");
cargoToml = cargoToml.replace(/^version = ".*?"/m, `version = "${cleanVersion}"`);
fs.writeFileSync(cargoPath, cargoToml);
console.log(`✅ Updated src-tauri/Cargo.toml -> ${cleanVersion}`);

console.log("\n📦 Committing version bump, tagging, and pushing to GitHub...");

try {
  execSync(`git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`, {
    cwd: rootDir,
    stdio: "inherit",
  });
  execSync(`git commit -m "chore(release): bump version to ${tag}"`, {
    cwd: rootDir,
    stdio: "inherit",
  });
  execSync(`git tag ${tag}`, { cwd: rootDir, stdio: "inherit" });
  execSync(`git push origin main`, { cwd: rootDir, stdio: "inherit" });
  execSync(`git push origin ${tag}`, { cwd: rootDir, stdio: "inherit" });
  console.log(`\n🎉 Successfully published ${tag} to GitHub!`);
  console.log(`Live build: https://github.com/GokulAnand14/excalideck/actions\n`);
} catch (e) {
  console.error("❌ Git operation failed:", e.message);
  process.exit(1);
}
