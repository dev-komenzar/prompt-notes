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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:toast-manager.ts
// Toast Manager — Manages toast notification lifecycle with auto-dismiss timers
// Toasts are non-intrusive, transient notifications for recoverable errors

import type { IpcErrorDetail, Notification, Readable, Subscriber, Unsubscriber } from './types';
import { generateNotificationId, NotificationStore } from './notification-store';

const DEFAULT_AUTO_DISMISS_MS = 4000;
const DEFAULT_MAX_VISIBLE = 5;

export interface ToastManagerConfig {
  readonly maxVisible: number;
  readonly defaultAutoDismissMs: number;
}

interface ToastEntry {
  readonly notification: Notification;
  timerId: ReturnType<typeof setTimeout> | null;
}

/**
 * Manages toast notification lifecycle.
 * Handles auto-dismiss timers, max visible count, and FIFO ordering.
 * Exposes a Svelte-compatible readable store of visible toast notifications.
 */
export class ToastManager implements Readable<ReadonlyArray<Notification>> {
  private entries: ToastEntry[] = [];
  private subscribers: Set<Subscriber<ReadonlyArray<Notification>>> = new Set();
  private readonly config: ToastManagerConfig;
  private readonly store: NotificationStore;

  constructor(store: NotificationStore, config?: Partial<ToastManagerConfig>) {
    this.store = store;
    this.config = {
      maxVisible: config?.maxVisible ?? DEFAULT_MAX_VISIBLE,
      defaultAutoDismissMs: config?.defaultAutoDismissMs ?? DEFAULT_AUTO_DISMISS_MS,
    };
  }

  subscribe(run: Subscriber<ReadonlyArray<Notification>>): Unsubscriber {
    this.subscribers.add(run);
    run(this.visibleToasts());
    return () => {
      this.subscribers.delete(run);
    };
  }

  private visibleToasts(): ReadonlyArray<Notification> {
    return this.entries.map((e) => e.notification);
  }

  private notifySubscribers(): void {
    const snapshot = this.visibleToasts();
    for (const sub of this.subscribers) {
      sub(snapshot);
    }
  }

  show(params: {
    severity: Notification['severity'];
    title: string;
    message: string;
    detail?: IpcErrorDetail;
    autoDismissMs?: number;
  }): string {
    const id = generateNotificationId();
    const autoDismissMs = params.autoDismissMs ?? this.config.defaultAutoDismissMs;

    const notification: Notification = {
      id,
      channel: 'toast',
      severity: params.severity,
      title: params.title,
      message: params.message,
      detail: params.detail,
      timestamp: Date.now(),
      autoDismissMs,
    };

    // Evict oldest if at max capacity
    while (this.entries.length >= this.config.maxVisible) {
      const oldest = this.entries.shift();
      if (oldest) {
        this.clearTimer(oldest);
        this.store.dismiss(oldest.notification.id);
      }
    }

    const timerId = autoDismissMs > 0
      ? setTimeout(() => this.dismiss(id), autoDismissMs)
      : null;

    this.entries.push({ notification, timerId });
    this.store.add(notification);
    this.notifySubscribers();

    return id;
  }

  dismiss(id: string): void {
    const index = this.entries.findIndex((e) => e.notification.id === id);
    if (index === -1) return;

    const entry = this.entries[index];
    this.clearTimer(entry);
    this.entries.splice(index, 1);
    this.store.dismiss(id);
    this.notifySubscribers();
  }

  dismissAll(): void {
    for (const entry of this.entries) {
      this.clearTimer(entry);
      this.store.dismiss(entry.notification.id);
    }
    this.entries = [];
    this.notifySubscribers();
  }

  private clearTimer(entry: ToastEntry): void {
    if (entry.timerId !== null) {
      clearTimeout(entry.timerId);
      entry.timerId = null;
    }
  }

  get count(): number {
    return this.entries.length;
  }
}
