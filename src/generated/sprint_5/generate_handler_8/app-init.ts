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

import { createAppState } from '@/generated/sprint_5/appstate_manage/app-state';
import type { AppState, AppStateConfig } from '@/generated/sprint_5/appstate_manage/app-state';
import { generateHandler, EXPECTED_COMMAND_COUNT } from './generate-handler';
import type { HandlerRegistration, CommandHandler } from './generate-handler';
import type { CommandContext } from './command-stubs';
import type { TauriCommandName } from '@/generated/sprint_5/project_initialization/types/commands';

export interface TauriApp {
  readonly state: AppState;
  readonly handlers: ReadonlyArray<HandlerRegistration>;
  invoke(command: TauriCommandName, params?: unknown): Promise<unknown>;
}

export function initializeApp(config?: AppStateConfig): TauriApp {
  const state = createAppState(config);
  const handlers = generateHandler();

  if (handlers.length !== EXPECTED_COMMAND_COUNT) {
    throw new Error(
      `Handler registration incomplete: expected ${EXPECTED_COMMAND_COUNT}, got ${handlers.length}`
    );
  }

  const handlerMap = new Map<string, CommandHandler>();
  for (const registration of handlers) {
    if (handlerMap.has(registration.name)) {
      throw new Error(`Duplicate command registration: ${registration.name}`);
    }
    handlerMap.set(registration.name, registration.handler);
  }

  const ctx: CommandContext = { state };

  return {
    state,
    handlers,
    async invoke(command: TauriCommandName, params?: unknown): Promise<unknown> {
      const handler = handlerMap.get(command);
      if (!handler) {
        throw new Error(`Unknown command: ${command}`);
      }
      return handler(ctx, params);
    },
  };
}
