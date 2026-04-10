// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-3
// @task-title: share
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
// @task: 12-3

export type { PlatformDirConfig } from './platform-dirs';
export { buildPlatformDirConfig, getResolvedNotesDir } from './platform-dirs';

export type { EnsureDirResult, ResolveAndEnsureParams } from './ensure-dir-command';
export { resolveAndEnsureNotesDir, ensureDirectoryExists } from './ensure-dir-command';

export type { ResolvedNotesDirInfo } from './resolve-with-settings';
export { resolveNotesDirWithSettings } from './resolve-with-settings';
