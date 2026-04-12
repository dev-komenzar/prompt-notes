// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 59
// @codd-task: 59-1
// @codd-deliverable: パッケージング (macOS .dmg)
// @codd-source: docs/plan/implementation_plan.md

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const SRC_TAURI = path.join(PROJECT_ROOT, "src-tauri");
const BUNDLE_DIR = path.join(SRC_TAURI, "target", "release", "bundle");

interface BuildResult {
  success: boolean;
  artifactPath: string | null;
  error: string | null;
}

function assertMacOS(): void {
  if (process.platform !== "darwin") {
    throw new Error(
      `macOS ビルドは darwin プラットフォームでのみ実行可能です。現在: ${process.platform}`
    );
  }
}

function assertRustToolchain(): void {
  const result = spawnSync("cargo", ["--version"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      "cargo が見つかりません。rustup でインストールしてください: https://rustup.rs"
    );
  }
  const tauriResult = spawnSync("cargo", ["tauri", "--version"], {
    encoding: "utf8",
  });
  if (tauriResult.status !== 0) {
    throw new Error(
      "cargo-tauri が見つかりません。`cargo install tauri-cli` を実行してください。"
    );
  }
}

function assertNodeDeps(): void {
  const pkgLock = path.join(PROJECT_ROOT, "package.json");
  if (!fs.existsSync(pkgLock)) {
    throw new Error(`package.json が見つかりません: ${pkgLock}`);
  }
  const nmDir = path.join(PROJECT_ROOT, "node_modules");
  if (!fs.existsSync(nmDir)) {
    throw new Error(
      "node_modules が存在しません。`npm install` または `pnpm install` を実行してください。"
    );
  }
}

function buildFrontend(): void {
  console.log("[1/3] フロントエンドをビルド中...");
  execSync("npm run build", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
  console.log("[1/3] フロントエンドビルド完了");
}

function buildTauriRelease(): void {
  console.log("[2/3] Tauri リリースビルド中 (cargo tauri build)...");
  execSync("cargo tauri build", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      TAURI_PRIVATE_KEY: process.env.TAURI_PRIVATE_KEY ?? "",
      TAURI_KEY_PASSWORD: process.env.TAURI_KEY_PASSWORD ?? "",
    },
  });
  console.log("[2/3] Tauri ビルド完了");
}

function locateDmg(): string {
  const dmgDir = path.join(BUNDLE_DIR, "dmg");
  if (!fs.existsSync(dmgDir)) {
    throw new Error(
      `.dmg バンドルディレクトリが見つかりません: ${dmgDir}\ncargo tauri build が成功しているか確認してください。`
    );
  }
  const files = fs.readdirSync(dmgDir).filter((f) => f.endsWith(".dmg"));
  if (files.length === 0) {
    throw new Error(`.dmg ファイルが ${dmgDir} に存在しません。`);
  }
  return path.join(dmgDir, files[0]);
}

function copyArtifact(dmgPath: string, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const dest = path.join(outputDir, path.basename(dmgPath));
  fs.copyFileSync(dmgPath, dest);
  return dest;
}

export async function buildMacOsDmg(
  outputDir: string = path.join(PROJECT_ROOT, "dist")
): Promise<BuildResult> {
  try {
    assertMacOS();
    assertRustToolchain();
    assertNodeDeps();

    buildFrontend();
    buildTauriRelease();

    const dmgPath = locateDmg();
    const artifact = copyArtifact(dmgPath, outputDir);

    console.log(`[3/3] .dmg アーティファクト: ${artifact}`);
    const stat = fs.statSync(artifact);
    const sizeMb = (stat.size / 1024 / 1024).toFixed(2);
    console.log(`      サイズ: ${sizeMb} MB`);

    return { success: true, artifactPath: artifact, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] macOS ビルド失敗: ${message}`);
    return { success: false, artifactPath: null, error: message };
  }
}

// CLI エントリポイント
if (require.main === module) {
  const outputDir = process.argv[2] ?? path.join(PROJECT_ROOT, "dist");
  buildMacOsDmg(outputDir).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
