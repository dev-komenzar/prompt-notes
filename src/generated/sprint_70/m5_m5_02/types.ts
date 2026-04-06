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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:types.ts
// IPC Error Notification System — Type Definitions
// Resolves OQ-006: IPC error notification strategy (toast / inline / dialog)

export type NotificationChannel = 'toast' | 'inline' | 'dialog';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface IpcErrorDetail {
  readonly command: string;
  readonly args?: Readonly<Record<string, unknown>>;
  readonly rawError: unknown;
  readonly message: string;
  readonly errorCode?: string;
}

export interface NotificationAction {
  readonly label: string;
  readonly handler: () => void;
}

export interface Notification {
  readonly id: string;
  readonly channel: NotificationChannel;
  readonly severity: NotificationSeverity;
  readonly title: string;
  readonly message: string;
  readonly detail?: IpcErrorDetail;
  readonly timestamp: number;
  readonly autoDismissMs?: number;
  readonly context?: string;
  readonly actions?: ReadonlyArray<NotificationAction>;
}

export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;

/**
 * Svelte-compatible readable store contract.
 * Any object implementing this interface can be used with Svelte's $store syntax.
 */
export interface Readable<T> {
  subscribe(run: Subscriber<T>): Unsubscriber;
}

export interface ClassificationResult {
  readonly channel: NotificationChannel;
  readonly severity: NotificationSeverity;
  readonly title: string;
  readonly autoDismissMs?: number;
  readonly context?: string;
}

export interface ClassificationRule {
  readonly commandPattern?: RegExp;
  readonly errorPattern?: RegExp;
  readonly channel: NotificationChannel;
  readonly severity: NotificationSeverity;
  readonly titleTemplate: string;
  readonly autoDismissMs?: number;
  readonly context?: string;
}

/**
 * Signature for the Tauri invoke function.
 * Decoupled from @tauri-apps/api to keep this module transport-agnostic.
 */
export type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

export interface DialogResolution {
  readonly notificationId: string;
  readonly actionLabel?: string;
  readonly acknowledged: boolean;
}

export interface ErrorHandlerOptions {
  readonly maxToasts?: number;
  readonly defaultToastDurationMs?: number;
  readonly defaultDialogActions?: ReadonlyArray<NotificationAction>;
}
