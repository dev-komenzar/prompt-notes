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
// Svelte-compatible toast notification store.
// Implements the Svelte store contract (subscribe method) for reactive UI binding.
// Toast notifications are the primary user-facing error notification mechanism.

import type { ToastNotification, ErrorSeverity } from '../types/errors';

/** Auto-dismiss durations by severity (milliseconds) */
const DURATION_BY_SEVERITY: Record<ErrorSeverity, number> = {
  info: 2000,
  warning: 4000,
  error: 5000,
  critical: 0, // persistent — requires manual dismiss
};

/** Maximum number of simultaneously visible toasts */
const MAX_VISIBLE_TOASTS = 5;

type Subscriber = (toasts: ReadonlyArray<ToastNotification>) => void;
type Unsubscribe = () => void;

let nextId = 0;

function generateToastId(): string {
  nextId += 1;
  return `toast-${Date.now()}-${nextId}`;
}

/**
 * Creates a Svelte-compatible toast notification store.
 *
 * Usage in Svelte components:
 *   import { toastStore } from './toast-store';
 *   $: toasts = $toastStore;
 *
 * Usage in plain TS:
 *   toastStore.subscribe(toasts => { ... });
 *   toastStore.push({ message: '...', severity: 'error' });
 */
function createToastStore() {
  let toasts: ToastNotification[] = [];
  const subscribers = new Set<Subscriber>();
  const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function notify(): void {
    const snapshot = Object.freeze([...toasts]) as ReadonlyArray<ToastNotification>;
    for (const sub of subscribers) {
      sub(snapshot);
    }
  }

  function scheduleDismiss(toast: ToastNotification): void {
    if (toast.durationMs > 0) {
      const timer = setTimeout(() => {
        dismiss(toast.id);
      }, toast.durationMs);
      dismissTimers.set(toast.id, timer);
    }
  }

  function push(params: {
    message: string;
    severity: ErrorSeverity;
    durationMs?: number;
    actionLabel?: string;
    onAction?: () => void;
  }): string {
    const id = generateToastId();
    const toast: ToastNotification = {
      id,
      message: params.message,
      severity: params.severity,
      durationMs: params.durationMs ?? DURATION_BY_SEVERITY[params.severity],
      actionLabel: params.actionLabel,
      onAction: params.onAction,
      createdAt: Date.now(),
    };

    toasts = [...toasts, toast];

    // Evict oldest non-critical toasts if over limit
    while (toasts.length > MAX_VISIBLE_TOASTS) {
      const evictIndex = toasts.findIndex((t) => t.severity !== 'critical');
      if (evictIndex === -1) break;
      const evicted = toasts[evictIndex];
      const timer = dismissTimers.get(evicted.id);
      if (timer != null) {
        clearTimeout(timer);
        dismissTimers.delete(evicted.id);
      }
      toasts = [...toasts.slice(0, evictIndex), ...toasts.slice(evictIndex + 1)];
    }

    scheduleDismiss(toast);
    notify();
    return id;
  }

  function dismiss(id: string): void {
    const timer = dismissTimers.get(id);
    if (timer != null) {
      clearTimeout(timer);
      dismissTimers.delete(id);
    }
    const prevLength = toasts.length;
    toasts = toasts.filter((t) => t.id !== id);
    if (toasts.length !== prevLength) {
      notify();
    }
  }

  function dismissAll(): void {
    for (const timer of dismissTimers.values()) {
      clearTimeout(timer);
    }
    dismissTimers.clear();
    toasts = [];
    notify();
  }

  /**
   * Svelte store contract: subscribe method.
   * Returns an unsubscribe function.
   */
  function subscribe(subscriber: Subscriber): Unsubscribe {
    subscribers.add(subscriber);
    // Immediately emit current state to new subscriber
    subscriber(Object.freeze([...toasts]) as ReadonlyArray<ToastNotification>);
    return () => {
      subscribers.delete(subscriber);
    };
  }

  return {
    subscribe,
    push,
    dismiss,
    dismissAll,
  };
}

/**
 * Singleton toast notification store.
 * Import this in any module to push notifications or subscribe to changes.
 */
export const toastStore = createToastStore();
