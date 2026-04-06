// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=50, task=50-1, module=all, resolves=OQ-006
// Extracts and classifies errors from Tauri IPC invoke() rejections.
// Maps Rust backend error strings to typed StorageErrorCode values.

import {
  type AppError,
  type AppModule,
  type ErrorSeverity,
  StorageErrorCode,
} from '../types/errors';

/**
 * Pattern-to-code mapping for classifying Rust backend error messages.
 * Order matters: first match wins.
 */
const ERROR_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  code: StorageErrorCode;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;
}> = [
  {
    pattern: /not found|no such file/i,
    code: StorageErrorCode.FILE_NOT_FOUND,
    severity: 'error',
    retryable: false,
    userMessage: 'ファイルが見つかりません。',
  },
  {
    pattern: /directory.*(not found|does not exist|not exist)/i,
    code: StorageErrorCode.DIRECTORY_NOT_FOUND,
    severity: 'critical',
    retryable: false,
    userMessage: 'ノート保存ディレクトリが見つかりません。設定画面でディレクトリを確認してください。',
  },
  {
    pattern: /permission denied|access denied/i,
    code: StorageErrorCode.PERMISSION_DENIED,
    severity: 'critical',
    retryable: false,
    userMessage: 'ファイルへのアクセスが拒否されました。ディレクトリの権限を確認してください。',
  },
  {
    pattern: /write.*fail|disk full|no space/i,
    code: StorageErrorCode.WRITE_FAILED,
    severity: 'error',
    retryable: true,
    userMessage: 'ファイルの保存に失敗しました。ディスク容量を確認してください。',
  },
  {
    pattern: /read.*fail/i,
    code: StorageErrorCode.READ_FAILED,
    severity: 'error',
    retryable: true,
    userMessage: 'ファイルの読み込みに失敗しました。',
  },
  {
    pattern: /invalid.*filename|path traversal/i,
    code: StorageErrorCode.INVALID_FILENAME,
    severity: 'error',
    retryable: false,
    userMessage: '無効なファイル名です。',
  },
  {
    pattern: /frontmatter|yaml.*parse/i,
    code: StorageErrorCode.FRONTMATTER_PARSE_ERROR,
    severity: 'warning',
    retryable: false,
    userMessage: 'フロントマターの解析に失敗しました。タグ情報がリセットされます。',
  },
  {
    pattern: /config.*(read|write|save|load)/i,
    code: StorageErrorCode.CONFIG_IO_ERROR,
    severity: 'error',
    retryable: true,
    userMessage: '設定ファイルの読み書きに失敗しました。',
  },
  {
    pattern: /invalid.*directory|invalid.*path/i,
    code: StorageErrorCode.INVALID_DIRECTORY,
    severity: 'error',
    retryable: false,
    userMessage: '無効なディレクトリパスです。',
  },
  {
    pattern: /not writable|cannot write to directory/i,
    code: StorageErrorCode.DIRECTORY_NOT_WRITABLE,
    severity: 'critical',
    retryable: false,
    userMessage: '指定されたディレクトリに書き込み権限がありません。',
  },
];

/**
 * Extracts a string message from an unknown Tauri IPC error.
 * Tauri's invoke() can reject with a string or an object.
 */
function extractRawMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error != null && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj['message'] === 'string') {
      return obj['message'];
    }
    if (typeof obj['error'] === 'string') {
      return obj['error'];
    }
  }
  return String(error);
}

/**
 * Classifies an unknown IPC error into a structured AppError.
 *
 * @param error - The raw error from Tauri invoke() rejection
 * @param module - The module context where the error occurred
 * @param operation - A description of the operation that failed (for logging)
 */
export function extractIpcError(
  error: unknown,
  module: AppModule,
  operation: string,
): AppError {
  const rawMessage = extractRawMessage(error);

  for (const entry of ERROR_PATTERNS) {
    if (entry.pattern.test(rawMessage)) {
      return {
        module,
        code: entry.code,
        message: `[${module}] ${operation}: ${rawMessage}`,
        userMessage: entry.userMessage,
        severity: entry.severity,
        retryable: entry.retryable,
        cause: error,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Fallback for unrecognized errors
  return {
    module,
    code: StorageErrorCode.UNKNOWN,
    message: `[${module}] ${operation}: ${rawMessage}`,
    userMessage: '予期しないエラーが発生しました。',
    severity: 'error',
    retryable: false,
    cause: error,
    timestamp: new Date().toISOString(),
  };
}
