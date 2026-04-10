// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `tauri dev` で `http:
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// traceability: sprint_2/task_2-1 — Scaffold mapping: generated content → project file paths
// This module documents the placement of each generated artifact into the
// project directory structure required for `tauri dev` to serve at localhost:1420.
//
// Usage: Copy each generated file to its target path before running `tauri dev`.
// The Tauri v2 + SvelteKit project requires these minimum files to produce
// an empty application window.

export const SCAFFOLD_MAP: Record<string, string> = {
  // Project root
  'package.json':               'package.json',
  'svelte.config.js':           'svelte.config.js',
  'vite.config.ts':             'vite.config.ts',
  'tsconfig.json':              'tsconfig.json',

  // SvelteKit frontend
  'src_app.html':               'src/app.html',
  'src_routes_layout.ts':       'src/routes/+layout.ts',
  'src_routes_page.ts':         'src/routes/+page.svelte',

  // Tauri Rust backend
  'src_tauri_cargo.toml.ts':    'src-tauri/Cargo.toml',
  'src_tauri_build.rs.ts':      'src-tauri/build.rs',
  'src_tauri_main.rs.ts':       'src-tauri/src/main.rs',
  'src_tauri_lib.rs.ts':        'src-tauri/src/lib.rs',
  'src_tauri_conf.json.ts':     'src-tauri/tauri.conf.json',
  'src_tauri_capabilities_default.json.ts': 'src-tauri/capabilities/default.json',
};

// Verification: after scaffold placement, run:
//   npm install
//   npm run tauri dev
// Expected: Tauri window opens, WebView loads http://localhost:1420
//           showing "PromptNotes — App is running."
