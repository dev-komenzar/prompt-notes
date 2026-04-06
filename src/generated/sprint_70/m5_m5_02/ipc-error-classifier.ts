// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 70-1
// @task-title: M5（M5-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:70 task:70-1 module:m5_m5_02 file:ipc-error-classifier.ts
// IPC Error Classifier — Determines notification channel and severity for IPC errors
// Maps IPC command failures to appropriate user-facing notification strategies

import type {
  ClassificationResult,
  ClassificationRule,
  NotificationChannel,
  NotificationSeverity,
} from './types';

/**
 * Default classification rules ordered by specificity (most specific first).
 * Rules are evaluated top-down; the first match wins.
 */
const DEFAULT_RULES: ReadonlyArray<ClassificationRule> = [
  // Critical: directory not found / permission denied on any command
  {
    errorPattern: /directory.*(not found|does not exist|not exist)/i,
    channel: 'dialog',
    severity: 'critical',
    titleTemplate: '保存ディレクトリが見つかりません',
  },
  {
    errorPattern: /permission denied/i,
    channel: 'dialog',
    severity: 'critical',
    titleTemplate: 'アクセス権限エラー',
  },
  {
    errorPattern: /(disk full|no space|out of space|not enough space)/i,
    channel: 'dialog',
    severity: 'critical',
    titleTemplate: 'ディスク容量不足',
  },

  // create_note failures are critical — user cannot create notes
  {
    commandPattern: /^create_note$/,
    channel: 'dialog',
    severity: 'critical',
    titleTemplate: 'ノート作成に失敗しました',
  },

  // set_config failures are critical — settings cannot be saved
  {
    commandPattern: /^set_config$/,
    channel: 'dialog',
    severity: 'error',
    titleTemplate: '設定の保存に失敗しました',
  },

  // save_note failures — toast (non-blocking, auto-save will retry)
  {
    commandPattern: /^save_note$/,
    channel: 'toast',
    severity: 'warning',
    titleTemplate: '保存に失敗しました',
    autoDismissMs: 5000,
  },

  // read_note failures — dialog (user navigated to a note that can't be read)
  {
    commandPattern: /^read_note$/,
    errorPattern: /(not found|does not exist)/i,
    channel: 'dialog',
    severity: 'error',
    titleTemplate: 'ノートが見つかりません',
  },
  {
    commandPattern: /^read_note$/,
    channel: 'toast',
    severity: 'error',
    titleTemplate: 'ノートの読み込みに失敗しました',
    autoDismissMs: 5000,
  },

  // delete_note failures — toast
  {
    commandPattern: /^delete_note$/,
    channel: 'toast',
    severity: 'error',
    titleTemplate: 'ノートの削除に失敗しました',
    autoDismissMs: 5000,
  },

  // list_notes / search_notes failures — inline in grid context
  {
    commandPattern: /^list_notes$/,
    channel: 'inline',
    severity: 'error',
    titleTemplate: 'ノート一覧の取得に失敗しました',
    context: 'grid',
  },
  {
    commandPattern: /^search_notes$/,
    channel: 'inline',
    severity: 'error',
    titleTemplate: '検索に失敗しました',
    context: 'grid',
  },

  // get_config failures — inline in settings context
  {
    commandPattern: /^get_config$/,
    channel: 'inline',
    severity: 'warning',
    titleTemplate: '設定の読み込みに失敗しました',
    context: 'settings',
  },

  // Invalid filename (path traversal attempt) — toast
  {
    errorPattern: /invalid filename/i,
    channel: 'toast',
    severity: 'error',
    titleTemplate: '無効なファイル名',
    autoDismissMs: 4000,
  },
];

function extractErrorMessage(rawError: unknown): string {
  if (typeof rawError === 'string') {
    return rawError;
  }
  if (rawError instanceof Error) {
    return rawError.message;
  }
  if (
    rawError !== null &&
    typeof rawError === 'object' &&
    'message' in rawError &&
    typeof (rawError as Record<string, unknown>).message === 'string'
  ) {
    return (rawError as { message: string }).message;
  }
  return String(rawError);
}

function matchesRule(rule: ClassificationRule, command: string, errorMessage: string): boolean {
  if (rule.commandPattern && !rule.commandPattern.test(command)) {
    return false;
  }
  if (rule.errorPattern && !rule.errorPattern.test(errorMessage)) {
    return false;
  }
  return true;
}

const FALLBACK_RESULT: ClassificationResult = {
  channel: 'toast',
  severity: 'error',
  title: 'エラーが発生しました',
  autoDismissMs: 5000,
};

/**
 * Classifies an IPC error into notification channel, severity, and title.
 * Uses configurable rules with fallback defaults.
 */
export function classifyIpcError(
  command: string,
  rawError: unknown,
  customRules?: ReadonlyArray<ClassificationRule>,
): ClassificationResult {
  const errorMessage = extractErrorMessage(rawError);
  const rules = customRules ?? DEFAULT_RULES;

  for (const rule of rules) {
    if (matchesRule(rule, command, errorMessage)) {
      return {
        channel: rule.channel,
        severity: rule.severity,
        title: rule.titleTemplate,
        autoDismissMs: rule.autoDismissMs,
        context: rule.context,
      };
    }
  }

  return FALLBACK_RESULT;
}

export { extractErrorMessage };
export type { ClassificationRule as IpcClassificationRule };
