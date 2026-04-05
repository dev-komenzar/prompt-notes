// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 7-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=7 task=7-1 module=shared-layer
// Barrel export for the shared type layer.
// Consumers import from this index to avoid reaching into individual files.

export type { NoteEntry, Config } from './types';

export type {
  CreateNoteResponse,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResponse,
  DeleteNoteArgs,
  ListNotesArgs,
  ListNotesResponse,
  SearchNotesArgs,
  SearchNotesResponse,
  GetConfigResponse,
  SetConfigArgs,
} from './ipc-types';
