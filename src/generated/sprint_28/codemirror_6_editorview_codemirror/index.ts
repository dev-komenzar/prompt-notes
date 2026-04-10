// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: CodeMirror 6 `EditorView` のライフサイクル管理。拡張登録: `@codemirror
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: sprint=28 task=28-1 module=editor
// Re-exports for CodeMirrorWrapper.svelte consumption.

export { buildBaseExtensions } from './editor-extensions';
export {
  createEditor,
  destroyEditor,
  setEditorContent,
  getEditorContent,
} from './editor-lifecycle';
export type { CreateEditorOptions } from './editor-lifecycle';
