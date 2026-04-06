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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:inline-error-state.ts
// Inline Error State — Manages context-scoped inline error notifications
// Inline errors are displayed within the relevant UI section (editor, grid, settings)

import type { IpcErrorDetail, Notification, Readable, Subscriber, Unsubscriber } from './types';
import { generateNotificationId, NotificationStore } from './notification-store';

export type InlineContext = 'editor' | 'grid' | 'settings';

interface ContextState {
  notification: Notification | null;
}

/**
 * Manages inline error notifications scoped to UI contexts.
 * Each context (editor, grid, settings) can have at most one active inline error.
 * New errors in the same context replace the previous one.
 * Exposes a Svelte-compatible readable store per context.
 */
export class InlineErrorState {
  private contexts: Map<string, ContextState> = new Map();
  private subscribers: Map<string, Set<Subscriber<Notification | null>>> = new Map();
  private readonly store: NotificationStore;

  constructor(store: NotificationStore) {
    this.store = store;
  }

  /**
   * Returns a Svelte-compatible readable store for a specific context.
   * Components subscribe to their relevant context to display inline errors.
   */
  forContext(context: string): Readable<Notification | null> {
    return {
      subscribe: (run: Subscriber<Notification | null>): Unsubscriber => {
        if (!this.subscribers.has(context)) {
          this.subscribers.set(context, new Set());
        }
        const subs = this.subscribers.get(context)!;
        subs.add(run);
        run(this.contexts.get(context)?.notification ?? null);
        return () => {
          subs.delete(run);
          if (subs.size === 0) {
            this.subscribers.delete(context);
          }
        };
      },
    };
  }

  set(params: {
    context: string;
    severity: Notification['severity'];
    title: string;
    message: string;
    detail?: IpcErrorDetail;
  }): string {
    // Dismiss previous inline error in this context
    const existing = this.contexts.get(params.context);
    if (existing?.notification) {
      this.store.dismiss(existing.notification.id);
    }

    const id = generateNotificationId();
    const notification: Notification = {
      id,
      channel: 'inline',
      severity: params.severity,
      title: params.title,
      message: params.message,
      detail: params.detail,
      context: params.context,
      timestamp: Date.now(),
    };

    this.contexts.set(params.context, { notification });
    this.store.add(notification);
    this.notifyContext(params.context);

    return id;
  }

  clear(context: string): void {
    const state = this.contexts.get(context);
    if (!state?.notification) return;

    this.store.dismiss(state.notification.id);
    this.contexts.set(context, { notification: null });
    this.notifyContext(context);
  }

  clearAll(): void {
    for (const [context, state] of this.contexts.entries()) {
      if (state.notification) {
        this.store.dismiss(state.notification.id);
        this.contexts.set(context, { notification: null });
        this.notifyContext(context);
      }
    }
  }

  get(context: string): Notification | null {
    return this.contexts.get(context)?.notification ?? null;
  }

  private notifyContext(context: string): void {
    const subs = this.subscribers.get(context);
    if (!subs) return;
    const value = this.contexts.get(context)?.notification ?? null;
    for (const sub of subs) {
      sub(value);
    }
  }
}
