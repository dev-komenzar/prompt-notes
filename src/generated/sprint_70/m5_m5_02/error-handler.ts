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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:error-handler.ts
// Error Handler — Central IPC error handler routing errors to notification channels
// Orchestrates classifier, toast, inline, and dialog managers

import type {
  ClassificationResult,
  DialogResolution,
  ErrorHandlerOptions,
  IpcErrorDetail,
  NotificationAction,
} from './types';
import { classifyIpcError, extractErrorMessage } from './ipc-error-classifier';
import { notificationStore, NotificationStore } from './notification-store';
import { ToastManager } from './toast-manager';
import { InlineErrorState } from './inline-error-state';
import { DialogManager } from './dialog-manager';

/**
 * Central error handler for IPC errors.
 * Classifies errors and routes them to the appropriate notification channel.
 */
export class ErrorHandler {
  readonly toasts: ToastManager;
  readonly inline: InlineErrorState;
  readonly dialogs: DialogManager;
  readonly store: NotificationStore;

  constructor(store: NotificationStore, options?: ErrorHandlerOptions) {
    this.store = store;
    this.toasts = new ToastManager(store, {
      maxVisible: options?.maxToasts ?? 5,
      defaultAutoDismissMs: options?.defaultToastDurationMs ?? 4000,
    });
    this.inline = new InlineErrorState(store);
    this.dialogs = new DialogManager(store);
  }

  /**
   * Handles an IPC error by classifying it and routing to the appropriate
   * notification channel.
   *
   * @param command  - The IPC command name that failed (e.g. 'save_note')
   * @param rawError - The raw error from the Tauri invoke rejection
   * @param args     - Optional IPC command arguments for debugging context
   * @returns For dialog errors, returns a Promise<DialogResolution>.
   *          For toast/inline errors, returns the notification ID.
   */
  handleIpcError(
    command: string,
    rawError: unknown,
    args?: Record<string, unknown>,
  ): string | Promise<DialogResolution> {
    const message = extractErrorMessage(rawError);
    const classification = classifyIpcError(command, rawError);

    const detail: IpcErrorDetail = {
      command,
      args,
      rawError,
      message,
    };

    return this.routeToChannel(classification, message, detail);
  }

  /**
   * Manually show a toast notification (not tied to an IPC error).
   */
  showToast(
    severity: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    message: string,
    autoDismissMs?: number,
  ): string {
    return this.toasts.show({ severity, title, message, autoDismissMs });
  }

  /**
   * Manually set an inline error for a context.
   */
  setInlineError(
    context: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    message: string,
  ): string {
    return this.inline.set({ context, severity, title, message });
  }

  /**
   * Manually show a dialog notification.
   */
  showDialog(
    severity: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    message: string,
    actions?: ReadonlyArray<NotificationAction>,
  ): Promise<DialogResolution> {
    return this.dialogs.show({ severity, title, message, actions });
  }

  /**
   * Clears inline errors for a given context.
   * Call this when navigating away from a view or on successful data load.
   */
  clearInlineErrors(context: string): void {
    this.inline.clear(context);
  }

  /**
   * Dismisses all notifications across all channels.
   */
  dismissAll(): void {
    this.toasts.dismissAll();
    this.inline.clearAll();
    this.dialogs.dismissAll();
  }

  private routeToChannel(
    classification: ClassificationResult,
    message: string,
    detail: IpcErrorDetail,
  ): string | Promise<DialogResolution> {
    switch (classification.channel) {
      case 'toast':
        return this.toasts.show({
          severity: classification.severity,
          title: classification.title,
          message,
          detail,
          autoDismissMs: classification.autoDismissMs,
        });

      case 'inline':
        return this.inline.set({
          context: classification.context ?? 'editor',
          severity: classification.severity,
          title: classification.title,
          message,
          detail,
        });

      case 'dialog':
        return this.dialogs.show({
          severity: classification.severity,
          title: classification.title,
          message,
          detail,
        });
    }
  }
}

/** Singleton error handler instance using the global notification store. */
export const errorHandler = new ErrorHandler(notificationStore);
