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

// @generated sprint:70 task:70-1 module:m5_m5_02 file:derived-stores.ts
// Derived Stores — Svelte-compatible derived stores for filtered notification views
// Provides ready-to-use stores for UI components to subscribe to

import type { Notification, Readable, Subscriber, Unsubscriber } from './types';
import { notificationStore, NotificationStore } from './notification-store';

/**
 * Creates a derived Svelte-compatible store from the notification store,
 * filtered by a predicate function.
 */
function deriveFiltered(
  source: NotificationStore,
  predicate: (n: Notification) => boolean,
): Readable<ReadonlyArray<Notification>> {
  return {
    subscribe(run: Subscriber<ReadonlyArray<Notification>>): Unsubscriber {
      return source.subscribe((notifications) => {
        run(notifications.filter(predicate));
      });
    },
  };
}

/** Store of all active toast notifications. */
export const toastNotifications: Readable<ReadonlyArray<Notification>> =
  deriveFiltered(notificationStore, (n) => n.channel === 'toast');

/** Store of all active inline notifications. */
export const inlineNotifications: Readable<ReadonlyArray<Notification>> =
  deriveFiltered(notificationStore, (n) => n.channel === 'inline');

/** Store of all active dialog notifications. */
export const dialogNotifications: Readable<ReadonlyArray<Notification>> =
  deriveFiltered(notificationStore, (n) => n.channel === 'dialog');

/**
 * Creates a derived store for inline notifications scoped to a specific context.
 *
 * @example
 * ```svelte
 * <script>
 *   import { inlineForContext } from '@/generated/sprint_70/m5_m5_02';
 *   const gridError = inlineForContext('grid');
 * </script>
 *
 * {#if $gridError.length > 0}
 *   <div class="error-banner">{$gridError[0].message}</div>
 * {/if}
 * ```
 */
export function inlineForContext(
  context: string,
  source?: NotificationStore,
): Readable<ReadonlyArray<Notification>> {
  const store = source ?? notificationStore;
  return deriveFiltered(store, (n) => n.channel === 'inline' && n.context === context);
}

/**
 * Creates a derived store that exposes the count of active notifications
 * by severity level. Useful for badge indicators.
 */
export function notificationCounts(
  source?: NotificationStore,
): Readable<{ info: number; warning: number; error: number; critical: number }> {
  const store = source ?? notificationStore;
  return {
    subscribe(
      run: Subscriber<{ info: number; warning: number; error: number; critical: number }>,
    ): Unsubscriber {
      return store.subscribe((notifications) => {
        const counts = { info: 0, warning: 0, error: 0, critical: 0 };
        for (const n of notifications) {
          counts[n.severity] += 1;
        }
        run(counts);
      });
    },
  };
}
