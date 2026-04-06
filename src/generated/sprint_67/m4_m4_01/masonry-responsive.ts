// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 67-1
// @task-title: M4（M4-01）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=67, task=67-1, module=grid, oq=OQ-003
// Responsive column resolution for CSS Columns masonry layout.

import type {
  MasonryBreakpoint,
  MasonryLayoutConfig,
  ResolvedMasonryLayout,
} from './types';

/**
 * Resolve the number of columns for a given container width.
 *
 * Breakpoints are evaluated in descending order of `minWidth`;
 * the first breakpoint whose `minWidth` ≤ containerWidth wins.
 */
export function resolveColumns(
  containerWidth: number,
  breakpoints: readonly MasonryBreakpoint[],
  fallback: number,
): number {
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
  for (const bp of sorted) {
    if (containerWidth >= bp.minWidth) {
      return bp.columns;
    }
  }
  return fallback;
}

/**
 * Produce a fully resolved layout state from config + measured container width.
 */
export function resolveMasonryLayout(
  containerWidth: number,
  config: MasonryLayoutConfig,
): ResolvedMasonryLayout {
  const columns = resolveColumns(
    containerWidth,
    config.breakpoints,
    config.fallbackColumns,
  );
  return {
    columns,
    columnGap: config.columnGap,
    rowGap: config.rowGap,
    containerWidth,
  };
}

/**
 * Build a `ResizeObserver` callback that invokes `onLayout` with
 * the resolved layout whenever the observed element changes size.
 *
 * Usage (inside a Svelte onMount):
 * ```ts
 * const ro = createResizeHandler(config, (layout) => { columns = layout.columns; });
 * const observer = new ResizeObserver(ro);
 * observer.observe(containerEl);
 * ```
 */
export function createResizeHandler(
  config: MasonryLayoutConfig,
  onLayout: (layout: ResolvedMasonryLayout) => void,
): ResizeObserverCallback {
  let lastColumns = -1;
  return (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      const layout = resolveMasonryLayout(width, config);
      if (layout.columns !== lastColumns) {
        lastColumns = layout.columns;
        onLayout(layout);
      }
    }
  };
}
