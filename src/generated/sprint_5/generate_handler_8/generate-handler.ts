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

import type { CommandContext } from './command-stubs';
import {
  createNoteHandler,
  saveNoteHandler,
  readNoteHandler,
  listNotesHandler,
  searchNotesHandler,
  deleteNoteHandler,
  getSettingsHandler,
  updateSettingsHandler,
} from './command-stubs';
import type { TauriCommandName } from '@/generated/sprint_5/project_initialization/types/commands';

export type CommandHandler = (ctx: CommandContext, params?: unknown) => Promise<unknown>;

export interface HandlerRegistration {
  readonly name: TauriCommandName;
  readonly handler: CommandHandler;
}

const HANDLER_REGISTRY: ReadonlyArray<HandlerRegistration> = [
  {
    name: 'create_note',
    handler: (ctx) => createNoteHandler(ctx),
  },
  {
    name: 'save_note',
    handler: (ctx, params) =>
      saveNoteHandler(ctx, params as { filename: string; frontmatter: { tags: string[] }; body: string }),
  },
  {
    name: 'read_note',
    handler: (ctx, params) =>
      readNoteHandler(ctx, params as { filename: string }),
  },
  {
    name: 'list_notes',
    handler: (ctx, params) =>
      listNotesHandler(ctx, params as { days?: number; tags?: string[]; date_from?: string; date_to?: string } | undefined),
  },
  {
    name: 'search_notes',
    handler: (ctx, params) =>
      searchNotesHandler(ctx, params as { query?: string; tags?: string[]; date_from?: string; date_to?: string }),
  },
  {
    name: 'delete_note',
    handler: (ctx, params) =>
      deleteNoteHandler(ctx, params as { filename: string }),
  },
  {
    name: 'get_settings',
    handler: (ctx) => getSettingsHandler(ctx),
  },
  {
    name: 'update_settings',
    handler: (ctx, params) =>
      updateSettingsHandler(ctx, params as { notes_dir: string }),
  },
] as const;

export const EXPECTED_COMMAND_COUNT = 8;

export function generateHandler(): ReadonlyArray<HandlerRegistration> {
  if (HANDLER_REGISTRY.length !== EXPECTED_COMMAND_COUNT) {
    throw new Error(
      `generate_handler! expected ${EXPECTED_COMMAND_COUNT} commands but found ${HANDLER_REGISTRY.length}`
    );
  }
  return HANDLER_REGISTRY;
}

export function getHandlerByName(name: TauriCommandName): HandlerRegistration | undefined {
  return HANDLER_REGISTRY.find((reg) => reg.name === name);
}

export function getRegisteredCommandNames(): ReadonlyArray<TauriCommandName> {
  return HANDLER_REGISTRY.map((reg) => reg.name);
}
