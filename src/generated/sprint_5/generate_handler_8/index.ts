// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-3
// @task-title: `generate_handler!` マクロに 8 コマンドのスタブ登録完了
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd propagate
// Sprint 5 Task 5-3: generate_handler! マクロに 8 コマンドのスタブ登録完了

export {
  createNoteHandler,
  saveNoteHandler,
  readNoteHandler,
  listNotesHandler,
  searchNotesHandler,
  deleteNoteHandler,
  getSettingsHandler,
  updateSettingsHandler,
} from './command-stubs';
export type { CommandContext } from './command-stubs';

export {
  generateHandler,
  getHandlerByName,
  getRegisteredCommandNames,
  EXPECTED_COMMAND_COUNT,
} from './generate-handler';
export type { CommandHandler, HandlerRegistration } from './generate-handler';

export { initializeApp } from './app-init';
export type { TauriApp } from './app-init';
