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

// traceability: sprint_2/task_2-1 — Tauri v2 capability configuration
// This file should be placed at src-tauri/capabilities/default.json
// Minimal permissions: only shell:allow-open for external links.
// fs, http plugins are denied by design (NNC-1, component_architecture §4.1).
export const DEFAULT_CAPABILITY = {
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for PromptNotes desktop app",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open"
  ]
};
