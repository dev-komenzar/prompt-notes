// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Container resize observation for responsive masonry

import { computeMasonryLayout, styleMapToString } from './masonry';
import type { MasonryConfig, MasonryLayout } from './types';
import { DEFAULT_MASONRY_CONFIG } from './constants';

/**
 * Observes a container element for size changes and recalculates
 * the masonry column count accordingly.
 *
 * Designed for use in Svelte's onMount/onDestroy lifecycle:
 *
 *   let container: HTMLElement;
 *   let layout: MasonryLayout;
 *
 *   onMount(() => {
 *     const observer = createMasonryObserver(container, (l) => { layout = l; });
 *     return () => observer.disconnect();
 *   });
 *
 * @param container - The masonry grid container DOM element
 * @param onLayout - Callback invoked with the new layout when size changes
 * @param config - Optional masonry configuration override
 * @returns ResizeObserver instance (call .disconnect() on destroy)
 */
export function createMasonryObserver(
  container: HTMLElement,
  onLayout: (layout: MasonryLayout) => void,
  config: MasonryConfig = DEFAULT_MASONRY_CONFIG,
): ResizeObserver {
  function handleResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      const layout = computeMasonryLayout(width, config);
      onLayout(layout);
    }
  }

  const observer = new ResizeObserver(handleResize);
  observer.observe(container);

  // Trigger initial layout calculation
  const initialWidth = container.clientWidth;
  if (initialWidth > 0) {
    onLayout(computeMasonryLayout(initialWidth, config));
  }

  return observer;
}

/**
 * Applies a MasonryLayout to a container element's inline style.
 * Convenience function for imperative style updates.
 */
export function applyMasonryStyle(container: HTMLElement, layout: MasonryLayout): void {
  const styleStr = styleMapToString(layout.containerStyle);
  container.setAttribute('style', styleStr);
}
