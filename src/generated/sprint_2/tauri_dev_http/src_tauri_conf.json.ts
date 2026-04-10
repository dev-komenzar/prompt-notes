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

// traceability: sprint_2/task_2-1 — Tauri v2 configuration
// This file should be placed at src-tauri/tauri.conf.json
// Security: fs/http/shell plugins denied per component_architecture.md §4.1
// Dev server: localhost:1420 per system_design.md §2.8
export const TAURI_CONF = {
  "$schema": "https://raw.githubusercontent.com/nicosResworWorkerool/tauri/refs/heads/v2/crates/tauri-config-schema/schema.json",
  "productName": "PromptNotes",
  "version": "0.1.0",
  "identifier": "com.promptnotes.app",
  "build": {
    "frontendDist": "../build",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "title": "PromptNotes",
    "windows": [
      {
        "title": "PromptNotes",
        "width": 1024,
        "height": 768
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
};
