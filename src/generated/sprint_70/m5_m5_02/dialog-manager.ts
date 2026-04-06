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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:dialog-manager.ts
// Dialog Manager — Queue-based dialog notification management
// Dialogs are blocking notifications requiring explicit user acknowledgment

import type {
  DialogResolution,
  IpcErrorDetail,
  Notification,
  NotificationAction,
  Readable,
  Subscriber,
  Unsubscriber,
} from './types';
import { generateNotificationId, NotificationStore } from './notification-store';

interface QueuedDialog {
  readonly notification: Notification;
  readonly resolve: (resolution: DialogResolution) => void;
}

const DEFAULT_DIALOG_ACTIONS: ReadonlyArray<NotificationAction> = [
  { label: 'OK', handler: () => {} },
];

/**
 * Manages dialog notifications with a queue to ensure only one dialog
 * is visible at a time. Each dialog returns a Promise that resolves
 * when the user acknowledges/dismisses it.
 */
export class DialogManager implements Readable<Notification | null> {
  private queue: QueuedDialog[] = [];
  private activeDialog: QueuedDialog | null = null;
  private subscribers: Set<Subscriber<Notification | null>> = new Set();
  private readonly store: NotificationStore;

  constructor(store: NotificationStore) {
    this.store = store;
  }

  subscribe(run: Subscriber<Notification | null>): Unsubscriber {
    this.subscribers.add(run);
    run(this.activeDialog?.notification ?? null);
    return () => {
      this.subscribers.delete(run);
    };
  }

  /**
   * Shows a dialog notification. Returns a Promise that resolves when the
   * user acknowledges/dismisses the dialog. If another dialog is active,
   * this one is queued.
   */
  show(params: {
    severity: Notification['severity'];
    title: string;
    message: string;
    detail?: IpcErrorDetail;
    actions?: ReadonlyArray<NotificationAction>;
  }): Promise<DialogResolution> {
    const id = generateNotificationId();
    const actions = params.actions ?? DEFAULT_DIALOG_ACTIONS;

    const notification: Notification = {
      id,
      channel: 'dialog',
      severity: params.severity,
      title: params.title,
      message: params.message,
      detail: params.detail,
      timestamp: Date.now(),
      actions,
    };

    return new Promise<DialogResolution>((resolve) => {
      const queued: QueuedDialog = { notification, resolve };

      if (this.activeDialog === null) {
        this.activate(queued);
      } else {
        this.queue.push(queued);
      }
    });
  }

  /**
   * Acknowledges the currently active dialog, optionally specifying which
   * action was taken. Advances to the next queued dialog if any.
   */
  acknowledge(notificationId: string, actionLabel?: string): void {
    if (!this.activeDialog || this.activeDialog.notification.id !== notificationId) {
      return;
    }

    const resolution: DialogResolution = {
      notificationId,
      actionLabel,
      acknowledged: true,
    };

    this.store.dismiss(notificationId);
    this.activeDialog.resolve(resolution);
    this.activeDialog = null;

    this.advanceQueue();
    this.notifySubscribers();
  }

  /**
   * Dismisses the active dialog without explicit action acknowledgment.
   */
  dismiss(notificationId: string): void {
    if (this.activeDialog?.notification.id === notificationId) {
      const resolution: DialogResolution = {
        notificationId,
        acknowledged: false,
      };
      this.store.dismiss(notificationId);
      this.activeDialog.resolve(resolution);
      this.activeDialog = null;
      this.advanceQueue();
      this.notifySubscribers();
      return;
    }

    // Check queue
    const queueIndex = this.queue.findIndex((q) => q.notification.id === notificationId);
    if (queueIndex !== -1) {
      const removed = this.queue.splice(queueIndex, 1)[0];
      removed.resolve({ notificationId, acknowledged: false });
    }
  }

  dismissAll(): void {
    if (this.activeDialog) {
      this.store.dismiss(this.activeDialog.notification.id);
      this.activeDialog.resolve({
        notificationId: this.activeDialog.notification.id,
        acknowledged: false,
      });
      this.activeDialog = null;
    }
    for (const queued of this.queue) {
      queued.resolve({
        notificationId: queued.notification.id,
        acknowledged: false,
      });
    }
    this.queue = [];
    this.notifySubscribers();
  }

  get current(): Notification | null {
    return this.activeDialog?.notification ?? null;
  }

  get queueLength(): number {
    return this.queue.length;
  }

  private activate(queued: QueuedDialog): void {
    this.activeDialog = queued;
    this.store.add(queued.notification);
    this.notifySubscribers();
  }

  private advanceQueue(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.activate(next);
    }
  }

  private notifySubscribers(): void {
    const value = this.activeDialog?.notification ?? null;
    for (const sub of this.subscribers) {
      sub(value);
    }
  }
}
