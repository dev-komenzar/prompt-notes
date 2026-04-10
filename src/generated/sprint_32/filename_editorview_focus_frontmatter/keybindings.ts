// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-4
// @task-title: ${filename}')` → `editorView.focus()`（frontmatter 末尾次行にカーソル配置）。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Traceability: Sprint 32, Task 32-4
// Deliverable: Cmd+N (macOS) / Ctrl+N (Linux) global keybinding → createNote() → goto('/edit/${filename}') → editorView.focus() at line after frontmatter

export {
  registerGlobalKeybindings,
  focusAfterFrontmatter,
  initEditorPageKeybindings,
  activateEditorFocus,
} from '../edit/keybindings';
