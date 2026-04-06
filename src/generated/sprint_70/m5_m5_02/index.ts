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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:index.ts
// IPC Error Notification System — Public API
// Sprint 70 / OQ-006: Resolves error notification strategy (toast / inline / dialog)

// Type exports
export type {
  NotificationChannel,
  NotificationSeverity,
  IpcErrorDetail,
  NotificationAction,
  Notification,
  Subscriber,
  Unsubscriber,
  Readable,
  ClassificationResult,
  ClassificationRule,
  InvokeFn,
  DialogResolution,
  ErrorHandlerOptions,
} from './types';

// Classification
export { classifyIpcError, extractErrorMessage } from './ipc-error-classifier';
export type { IpcClassificationRule } from './ipc-error-classifier';

// Notification store
export { NotificationStore, notificationStore, generateNotificationId } from './notification-store';

// Channel managers
export { ToastManager } from './toast-manager';
export type { ToastManagerConfig } from './toast-manager';
export { InlineErrorState } from './inline-error-state';
export type { InlineContext } from './inline-error-state';
export { DialogManager } from './dialog-manager';

// Central error handler
export { ErrorHandler, errorHandler } from './error-handler';

// IPC wrappers
export {
  withErrorHandling,
  createSafeInvoker,
  wrapIpcCall,
  wrapIpcCallSilent,
} from './with-error-handling';
export type { SafeResult } from './with-error-handling';

// Derived stores for Svelte components
export {
  toastNotifications,
  inlineNotifications,
  dialogNotifications,
  inlineForContext,
  notificationCounts,
} from './derived-stores';
