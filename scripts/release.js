import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const inputArg = process.argv[2];

if (!inputArg) {
  console.error("❌ Please provide a version number (e.g. bun run release 0.2 or bun run release 0.2.0)");
  process.exit(1);
}

// Normalize "0.2" or "v0.2" -> "0.2.0"
let cleanVersion = inputArg.replace(/^v/, "").trim();
if (/^\d+\.\d+$/.test(cleanVersion)) {
  cleanVersion = `${cleanVersion}.0`;
}

if (!/^\d+\.\d+\.\d+.*$/.test(cleanVersion)) {
  console.error(`❌ Invalid version "${inputArg}". Please provide a semver version (e.g. 0.2 or 0.2.0)`);
  process.exit(1);
}

const tag = `v${cleanVersion}`;

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

// 4. Update landing/src/utils/os.ts
const landingOsPath = path.join(rootDir, "landing", "src", "utils", "os.ts");
if (fs.existsSync(landingOsPath)) {
  let osTs = fs.readFileSync(landingOsPath, "utf-8");
  osTs = osTs.replace(/export const RELEASE_VERSION = '.*?';/, `export const RELEASE_VERSION = '${tag}';`);
  osTs = osTs.replace(/Excalideck_[\d.]+(?:-[\w.]+)?_/g, `Excalideck_${cleanVersion}_`);
  fs.writeFileSync(landingOsPath, osTs);
  console.log(`✅ Updated landing/src/utils/os.ts -> ${tag}`);
}

console.log("\n📦 Committing version bump, tagging, and pushing to GitHub...");

try {
  execSync(
    `git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml landing/src/utils/os.ts scripts/release.js`,
    { cwd: rootDir, stdio: "inherit" }
  );

  const status = execSync(`git status --porcelain`, { cwd: rootDir }).toString().trim();
  if (status) {
    execSync(`git commit -m "chore(release): bump version to ${tag}"`, {
      cwd: rootDir,
      stdio: "inherit",
    });
  } else {
    console.log("ℹ️ No uncommitted changes, proceeding to tag...");
  }

  // Overwrite existing local tag if present
  try {
    execSync(`git tag -d ${tag}`, { cwd: rootDir, stdio: "ignore" });
  } catch (_) {}

  execSync(`git tag ${tag}`, { cwd: rootDir, stdio: "inherit" });
  execSync(`git push origin main`, { cwd: rootDir, stdio: "inherit" });
  execSync(`git push origin ${tag} --force`, { cwd: rootDir, stdio: "inherit" });
  console.log(`\n🎉 Successfully published ${tag} to GitHub!`);
  console.log(`Live build: https://github.com/GokulAnand14/excalideck/actions\n`);
} catch (e) {
  console.error("❌ Git operation failed:", e.message);
  process.exit(1);
}
