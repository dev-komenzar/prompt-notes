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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:notification-store.ts
// Notification Store — Svelte-compatible reactive store for managing notifications
// Implements the Svelte store contract (subscribe method) for $store auto-subscription

import type { Notification, Readable, Subscriber, Unsubscriber } from './types';

let idCounter = 0;

export function generateNotificationId(): string {
  idCounter += 1;
  return `notif_${Date.now()}_${idCounter}`;
}

/**
 * Reactive notification store implementing the Svelte readable store contract.
 * Manages an ordered list of active notifications across all channels.
 */
export class NotificationStore implements Readable<ReadonlyArray<Notification>> {
  private notifications: Notification[] = [];
  private subscribers: Set<Subscriber<ReadonlyArray<Notification>>> = new Set();

  subscribe(run: Subscriber<ReadonlyArray<Notification>>): Unsubscriber {
    this.subscribers.add(run);
    run(this.notifications);
    return () => {
      this.subscribers.delete(run);
    };
  }

  private notify(): void {
    const snapshot = [...this.notifications];
    for (const sub of this.subscribers) {
      sub(snapshot);
    }
  }

  add(notification: Notification): void {
    this.notifications = [...this.notifications, notification];
    this.notify();
  }

  dismiss(id: string): void {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) return;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  dismissByContext(context: string): void {
    const before = this.notifications.length;
    this.notifications = this.notifications.filter(
      (n) => n.context !== context,
    );
    if (this.notifications.length !== before) {
      this.notify();
    }
  }

  dismissAll(): void {
    if (this.notifications.length === 0) return;
    this.notifications = [];
    this.notify();
  }

  getByChannel(channel: Notification['channel']): ReadonlyArray<Notification> {
    return this.notifications.filter((n) => n.channel === channel);
  }

  getByContext(context: string): ReadonlyArray<Notification> {
    return this.notifications.filter((n) => n.context === context);
  }

  get current(): ReadonlyArray<Notification> {
    return [...this.notifications];
  }

  get size(): number {
    return this.notifications.length;
  }
}

/** Singleton notification store instance for the application. */
export const notificationStore = new NotificationStore();
