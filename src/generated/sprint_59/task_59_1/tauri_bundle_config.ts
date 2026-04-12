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
// @codd-deliverable: パッケージング — Tauri バンドル設定ヘルパー
// @codd-source: docs/design/system_design.md §2.9, docs/governance/adr_tech_stack.md ADR-001

/**
 * macOS .dmg バンドルに必要な tauri.conf.json の bundle セクションを
 * プログラム的に生成・検証するヘルパー。
 *
 * 対象プラットフォーム: macOS (darwin) のみ。
 * Linux バンドル (.AppImage / .deb) は別スプリントで扱う。
 */

export interface MacOsBundleConfig {
  /** バンドル識別子 (reverse domain) */
  identifier: string;
  /** アプリ表示名 */
  productName: string;
  /** セマンティックバージョン */
  version: string;
  /** macOS 最小バージョン */
  minimumSystemVersion: string;
  /** .dmg に含めるリソースパス (PROJECT_ROOT 相対) */
  resources: string[];
  /** コード署名証明書名 (CI では空文字列で adhoc 署名) */
  signingIdentity: string;
  /** Apple Notarization — CI 環境変数から注入 */
  notarizeAppleId: string;
  /** ビルドターゲット: universal2 推奨 (x86_64 + aarch64) */
  targets: ("aarch64-apple-darwin" | "x86_64-apple-darwin" | "universal-apple-darwin")[];
}

const DEFAULT_MACOS_CONFIG: MacOsBundleConfig = {
  identifier: "dev.komenzar.promptnotes",
  productName: "PromptNotes",
  version: "0.1.0",
  minimumSystemVersion: "11.0",
  resources: [],
  signingIdentity: process.env.APPLE_SIGNING_IDENTITY ?? "",
  notarizeAppleId: process.env.APPLE_ID ?? "",
  targets: ["universal-apple-darwin"],
};

export function buildMacOsBundleSection(
  overrides: Partial<MacOsBundleConfig> = {}
): Record<string, unknown> {
  const cfg: MacOsBundleConfig = { ...DEFAULT_MACOS_CONFIG, ...overrides };

  validateBundleConfig(cfg);

  return {
    active: true,
    targets: cfg.targets,
    identifier: cfg.identifier,
    publisher: "dev-komenzar",
    icon: [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
    ],
    resources: cfg.resources,
    externalBin: [],
    copyright: `© ${new Date().getFullYear()} dev-komenzar`,
    macOS: {
      frameworks: [],
      minimumSystemVersion: cfg.minimumSystemVersion,
      exceptionDomain: "",
      signingIdentity: cfg.signingIdentity || null,
      providerShortName: null,
      entitlements: null,
    },
    shortDescription: "AI プロンプトを素早く書き溜めるローカルノートアプリ",
    longDescription: null,
  };
}

function validateBundleConfig(cfg: MacOsBundleConfig): void {
  if (!/^[a-z0-9]+(\.[a-z0-9]+){2,}$/i.test(cfg.identifier)) {
    throw new Error(
      `bundle identifier が不正です: "${cfg.identifier}"\n形式: reverse domain (例: dev.komenzar.promptnotes)`
    );
  }
  if (!/^\d+\.\d+\.\d+/.test(cfg.version)) {
    throw new Error(
      `version が不正です: "${cfg.version}"\nセマンティックバージョン (例: 0.1.0) を使用してください。`
    );
  }
  if (cfg.targets.length === 0) {
    throw new Error("targets を 1 つ以上指定してください。");
  }
}

/**
 * src-tauri/tauri.conf.json を読み込み、macOS バンドルセクションを
 * 上書きして書き出す。
 */
export function patchTauriConf(
  confPath: string,
  overrides: Partial<MacOsBundleConfig> = {}
): void {
  const fs = require("fs") as typeof import("fs");
  if (!fs.existsSync(confPath)) {
    throw new Error(`tauri.conf.json が見つかりません: ${confPath}`);
  }
  const raw = fs.readFileSync(confPath, "utf8");
  const conf = JSON.parse(raw) as Record<string, unknown>;

  conf["bundle"] = buildMacOsBundleSection(overrides);

  fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + "\n", "utf8");
  console.log(`[patchTauriConf] ${confPath} を更新しました。`);
}
