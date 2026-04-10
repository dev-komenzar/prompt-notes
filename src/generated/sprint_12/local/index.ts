// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-2
// @task-title: .local
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 12
// @task: 12-2
// @description: Public API barrel for sprint 12 local directory resolution module

export {
  type ResolveNotesDirResult,
  getDefaultNotesDirForPlatform,
  resolveNotesDirLocal,
  getCurrentPlatformDefaultDir,
} from './resolve-notes-dir';

export {
  type EnsureNotesDirParams,
  type EnsureNotesDirResponse,
  ensureNotesDir,
  ensureDefaultNotesDir,
} from './ensure-notes-dir';

export {
  validateDirAccess,
  hasPathTraversalRisk,
} from './validate-dir-access';
