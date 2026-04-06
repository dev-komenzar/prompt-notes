// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: governance:adr_tech_stack (ADR-001, FU-004), design:system-design (OQ-005)
// Sprint 69 deliverable: Tauri version selection decision — v2 selected
//
// OQ-005 Resolution:
//   Question: Tauri v2 の安定版リリース状況に応じて v1 と v2 のいずれをベースにするか。
//   Decision: Tauri v2 を採用する。
//   Rationale: See below.

/**
 * Tauri version selection record.
 * This is the codified decision for OQ-005 (design:system-design, detail:component_architecture).
 *
 * ## Decision: Tauri v2
 *
 * ## Rationale
 *
 * 1. **Stability:** Tauri v2 reached stable release (2.0.0) in October 2024.
 *    As of April 2026, v2.x is the actively maintained branch with 18+ months
 *    of stable releases and patch cadence.
 *
 * 2. **Security model — Permissions over Allowlist:**
 *    Tauri v2 replaces v1's `allowlist` with a capability-based permissions system.
 *    Each IPC command and plugin capability is explicitly granted via JSON capability
 *    files in `src-tauri/capabilities/`. This aligns with CONV-1 (IPC boundary
 *    enforcement) and provides finer-grained control over what the WebView can access.
 *
 * 3. **IPC model improvements:**
 *    - `invoke()` moved from `@tauri-apps/api/tauri` to `@tauri-apps/api/core`.
 *    - Plugin-based architecture: `dialog`, `fs`, `os`, `clipboard` etc. are
 *      separate `@tauri-apps/plugin-*` crates and npm packages.
 *    - Per-window and per-webview permissions scoping (not needed now but future-proof).
 *
 * 4. **Plugin ecosystem alignment:**
 *    - `@tauri-apps/plugin-dialog` for directory picker (module:settings).
 *    - `@tauri-apps/plugin-os` for platform detection.
 *    - `@tauri-apps/plugin-clipboard-manager` available but NOT used —
 *      we use navigator.clipboard.writeText() per design (WebView API, no IPC needed).
 *
 * 5. **v1 end-of-life:** Tauri v1 is in maintenance mode with security patches only.
 *    Starting a new project on v1 would require a migration within the project lifetime.
 *
 * 6. **Platform support:** Linux (GTK WebKitGTK) and macOS (WKWebView) are fully
 *    supported in Tauri v2. Windows (WebView2) support exists but is out of scope.
 *
 * ## Migration impact from design documents
 *
 * The design documents (system_design.md, component_architecture.md) reference
 * `@tauri-apps/api/dialog` which is the v1 import path. With v2 selected:
 *   - `@tauri-apps/api/dialog` → `@tauri-apps/plugin-dialog`
 *   - `@tauri-apps/api/tauri` (invoke) → `@tauri-apps/api/core`
 *   - `tauri.conf.json` `allowlist` → `src-tauri/capabilities/*.json`
 *
 * All IPC wrappers in this module (api.ts) already use Tauri v2 import paths.
 */

export const TAURI_VERSION_SELECTION = {
  /** Selected major version */
  major: 2,
  /** Minimum required version for build */
  minimumVersion: '2.0.0',
  /** npm package for core API */
  corePackage: '@tauri-apps/api',
  /** npm package minimum version */
  corePackageMinVersion: '2.0.0',
  /** Rust crate */
  rustCrate: 'tauri',
  /** Rust crate minimum version */
  rustCrateMinVersion: '2.0.0',
  /** OQ-005 resolution status */
  oq005Status: 'resolved' as const,
  /** Decision date */
  decisionDate: '2026-04-06',
} as const;

/**
 * Required Tauri v2 plugins for PromptNotes.
 * Each plugin must be:
 *   1. Added as Rust dependency in Cargo.toml (tauri-plugin-*)
 *   2. Registered in main.rs via .plugin(tauri_plugin_*::init())
 *   3. Granted in src-tauri/capabilities/default.json
 *   4. Installed as npm package (@tauri-apps/plugin-*)
 */
export const REQUIRED_PLUGINS = [
  {
    name: 'dialog',
    rustCrate: 'tauri-plugin-dialog',
    npmPackage: '@tauri-apps/plugin-dialog',
    capability: 'dialog:default',
    usedBy: 'module:settings (directory picker for notes_dir change)',
  },
  {
    name: 'os',
    rustCrate: 'tauri-plugin-os',
    npmPackage: '@tauri-apps/plugin-os',
    capability: 'os:default',
    usedBy: 'platform detection (Linux vs macOS)',
  },
] as const;

/**
 * Explicitly NOT required plugins.
 * Listed to prevent accidental inclusion (scope enforcement).
 */
export const EXCLUDED_PLUGINS = [
  {
    name: 'fs',
    reason: 'All file operations go through #[tauri::command] IPC. Direct fs access from WebView is PROHIBITED (CONV-1).',
  },
  {
    name: 'clipboard-manager',
    reason: 'Copy uses navigator.clipboard.writeText() (WebView standard API). No IPC needed.',
  },
  {
    name: 'http',
    reason: 'No network requests. No cloud sync. No AI calls. All data is local only (CONV-3).',
  },
  {
    name: 'sql',
    reason: 'No database usage. Data is local .md files only (CONV-3).',
  },
  {
    name: 'store',
    reason: 'Config persistence uses custom config.json via module:settings IPC commands.',
  },
] as const;
