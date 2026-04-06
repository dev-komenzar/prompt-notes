// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=shell

/**
 * IPC Boundary Guard
 *
 * Validates that IPC commands conform to the allowed set
 * defined in the system design. Prevents accidental introduction
 * of prohibited IPC commands that would indicate scope-violating features.
 *
 * CONV-1: All file operations via Rust backend (Tauri IPC)
 * CONV-2: Settings changes via Rust backend only
 */

/**
 * Complete set of IPC commands defined in system design.
 * Any command not in this set is a scope violation.
 */
export const ALLOWED_IPC_COMMANDS = new Set([
  'create_note',
  'save_note',
  'read_note',
  'delete_note',
  'list_notes',
  'search_notes',
  'get_config',
  'set_config',
] as const);

export type AllowedIPCCommand =
  | 'create_note'
  | 'save_note'
  | 'read_note'
  | 'delete_note'
  | 'list_notes'
  | 'search_notes'
  | 'get_config'
  | 'set_config';

/**
 * IPC commands that would indicate prohibited features.
 */
export const PROHIBITED_IPC_COMMAND_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  featureId: string;
  failureId: string;
  reason: string;
}> = [
  {
    pattern: /^(ai_|llm_|chat_|prompt_send|generate_|embed_)/i,
    featureId: 'ai_calling',
    failureId: 'FAIL-30',
    reason: 'AI呼び出し関連のIPCコマンドは禁止',
  },
  {
    pattern: /^(sync_|upload_|cloud_|remote_)/i,
    featureId: 'cloud_sync',
    failureId: 'FAIL-31',
    reason: 'クラウド同期関連のIPCコマンドは禁止',
  },
  {
    pattern: /^(db_|sql_|query_|index_create)/i,
    featureId: 'database',
    failureId: 'FAIL-31',
    reason: 'データベース関連のIPCコマンドは禁止',
  },
  {
    pattern: /^(render_markdown|preview_|html_convert)/i,
    featureId: 'markdown_preview',
    failureId: 'FAIL-05',
    reason: 'Markdownレンダリング関連のIPCコマンドは禁止',
  },
];

export interface IPCCommandValidationResult {
  readonly command: string;
  readonly allowed: boolean;
  readonly reason?: string;
  readonly failureId?: string;
}

/**
 * Validates a single IPC command name against allowed and prohibited lists.
 */
export function validateIPCCommand(
  command: string,
): IPCCommandValidationResult {
  if (ALLOWED_IPC_COMMANDS.has(command as AllowedIPCCommand)) {
    return { command, allowed: true };
  }

  for (const { pattern, reason, failureId } of PROHIBITED_IPC_COMMAND_PATTERNS) {
    if (pattern.test(command)) {
      return { command, allowed: false, reason, failureId };
    }
  }

  return {
    command,
    allowed: false,
    reason: `未定義のIPCコマンド: "${command}"。許可されたコマンド: ${[...ALLOWED_IPC_COMMANDS].join(', ')}`,
    failureId: 'SCOPE-IPC',
  };
}

/**
 * Validates a set of IPC commands (e.g., extracted from source analysis).
 */
export function validateIPCCommandSet(
  commands: ReadonlySet<string>,
): {
  allAllowed: boolean;
  results: IPCCommandValidationResult[];
} {
  const results: IPCCommandValidationResult[] = [];
  let allAllowed = true;

  for (const command of commands) {
    const result = validateIPCCommand(command);
    results.push(result);
    if (!result.allowed) {
      allAllowed = false;
    }
  }

  return { allAllowed, results };
}

/**
 * Type-safe invoke wrapper type that only accepts allowed commands.
 * Use this type to enforce IPC boundary at compile time.
 */
export type SafeInvoke = <T>(
  cmd: AllowedIPCCommand,
  args?: Record<string, unknown>,
) => Promise<T>;
