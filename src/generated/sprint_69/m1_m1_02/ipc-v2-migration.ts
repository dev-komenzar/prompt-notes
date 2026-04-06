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
// CoDD trace: detail:component_architecture §3.2, design:system-design §2.2
// Tauri v2 — Import path migration map from v1 references in design documents
//
// The design documents (system_design.md, component_architecture.md) were written
// with v1-style import paths. This module documents the concrete v1→v2 mappings
// applied in this codebase and provides runtime verification.

/**
 * Tauri v1 → v2 import path migrations applied to PromptNotes codebase.
 *
 * Design documents reference v1 paths. All implementation code uses v2 paths.
 */
export const IMPORT_MIGRATIONS = [
  {
    v1Import: '@tauri-apps/api/tauri',
    v1Symbol: 'invoke',
    v2Import: '@tauri-apps/api/core',
    v2Symbol: 'invoke',
    usedIn: ['api.ts'],
    note: 'Core IPC invoke function. Module path changed in v2.',
  },
  {
    v1Import: '@tauri-apps/api/dialog',
    v1Symbol: 'open',
    v2Import: '@tauri-apps/plugin-dialog',
    v2Symbol: 'open',
    usedIn: ['module:settings UI (Settings.svelte)'],
    note: 'Directory picker for notes_dir change. Moved to plugin in v2.',
  },
  {
    v1Import: '@tauri-apps/api/os',
    v1Symbol: 'platform',
    v2Import: '@tauri-apps/plugin-os',
    v2Symbol: 'platform',
    usedIn: ['platform.ts'],
    note: 'OS detection. Moved to plugin in v2.',
  },
] as const;

/**
 * Tauri v2 configuration file structure changes from v1.
 */
export const CONFIG_MIGRATIONS = [
  {
    v1Location: 'tauri.conf.json > tauri > allowlist',
    v2Location: 'src-tauri/capabilities/default.json',
    description: 'Security permissions moved from monolithic allowlist to capability files',
  },
  {
    v1Location: 'tauri.conf.json > tauri > allowlist > fs > scope',
    v2Location: 'Not applicable — fs plugin not used',
    description: 'PromptNotes does not grant fs access to WebView (CONV-1). All file ops via IPC commands.',
  },
  {
    v1Location: 'tauri.conf.json > build',
    v2Location: 'tauri.conf.json > build (structure largely unchanged)',
    description: 'Build config remains in tauri.conf.json with minor schema updates.',
  },
] as const;

/**
 * Rust-side Cargo.toml dependency changes for v2.
 */
export const RUST_DEPENDENCY_CHANGES = [
  {
    v1Crate: 'tauri = { version = "1", features = [...] }',
    v2Crate: 'tauri = { version = "2", features = [] }',
    note: 'Core framework. Features restructured in v2.',
  },
  {
    v1Crate: 'N/A (built-in)',
    v2Crate: 'tauri-plugin-dialog = "2"',
    note: 'Dialog functionality extracted to plugin in v2.',
  },
  {
    v1Crate: 'N/A (built-in)',
    v2Crate: 'tauri-plugin-os = "2"',
    note: 'OS info extracted to plugin in v2.',
  },
] as const;

/**
 * IPC command registration differences.
 * In both v1 and v2, commands are registered via generate_handler![].
 * The macro syntax is identical. The main difference is plugin registration.
 */
export const IPC_REGISTRATION_NOTES = {
  commandMacro: '#[tauri::command] — unchanged between v1 and v2',
  handlerRegistration: 'tauri::Builder::default().invoke_handler(tauri::generate_handler![...]) — unchanged',
  pluginRegistration: '.plugin(tauri_plugin_dialog::init()).plugin(tauri_plugin_os::init()) — v2 only',
  permissionsFile: 'src-tauri/capabilities/default.json — v2 only (replaces allowlist)',
} as const;
