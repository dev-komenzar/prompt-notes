// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --wave 10

export const REQUIRED_IPC_COMMANDS = [
  'create_note',
  'save_note',
  'read_note',
  'list_notes',
  'search_notes',
  'delete_note',
  'get_settings',
  'update_settings',
] as const;

export type IpcCommandName = (typeof REQUIRED_IPC_COMMANDS)[number];

export interface IpcCommandSpec {
  readonly name: IpcCommandName;
  readonly module: string;
  readonly description: string;
}

export const IPC_COMMAND_SPECS: readonly IpcCommandSpec[] = [
  {
    name: 'create_note',
    module: 'module:storage',
    description: '新規 .md ファイル作成。ファイル名はコマンド実行時刻から生成。',
  },
  {
    name: 'save_note',
    module: 'module:storage',
    description: '指定ノートの内容を上書き保存。自動保存から呼び出される。',
  },
  {
    name: 'read_note',
    module: 'module:storage',
    description: '指定ノートの内容を読み取り。',
  },
  {
    name: 'list_notes',
    module: 'module:storage',
    description:
      'フィルタ条件に合致するノート一覧を返却。デフォルト days=7。',
  },
  {
    name: 'search_notes',
    module: 'module:storage',
    description:
      '全文検索。ファイル全走査で本文にクエリ文字列を含むノートを返却。',
  },
  {
    name: 'delete_note',
    module: 'module:storage',
    description: '指定ノートを削除。',
  },
  {
    name: 'get_settings',
    module: 'module:settings',
    description: '現在の設定を取得。',
  },
  {
    name: 'update_settings',
    module: 'module:settings',
    description: '設定を更新・永続化。',
  },
] as const;

export function validateIpcCommandsRegistered(
  registeredCommands: readonly string[],
): { missing: string[]; allRegistered: boolean } {
  const missing = REQUIRED_IPC_COMMANDS.filter(
    (cmd) => !registeredCommands.includes(cmd),
  );
  return { missing, allRegistered: missing.length === 0 };
}
