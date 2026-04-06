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
// High-level layout engine that wires config, responsive resolution,
// style application, and lifecycle management for the CSS Columns masonry.

import type {
  MasonryLayoutConfig,
  ResolvedMasonryLayout,
  NoteCardStyleTokens,
} from './types';
import { DEFAULT_MASONRY_CONFIG, DEFAULT_CARD_STYLE_TOKENS } from './masonry-config';
import { resolveMasonryLayout, createResizeHandler } from './masonry-responsive';
import {
  applyLayoutToContainer,
  buildMasonryStylesheet,
  itemStyle,
} from './masonry-css-columns';

export interface MasonryEngine {
  /** Attach the engine to a container element. Returns a teardown function. */
  attach(container: HTMLElement): () => void;
  /** Get the current resolved layout. Null before first attach. */
  currentLayout(): ResolvedMasonryLayout | null;
  /** Get the inline style string for masonry item wrappers. */
  itemStyle(): string;
}

/**
 * Create a masonry layout engine instance.
 *
 * The engine:
 * 1. Injects the masonry stylesheet into <head> (idempotent).
 * 2. Observes the container element via ResizeObserver.
 * 3. Updates column-count on the container when size changes.
 * 4. Provides an `itemStyle()` for card wrappers.
 *
 * @param config - Layout configuration (defaults to DEFAULT_MASONRY_CONFIG).
 * @param cardTokens - Visual tokens for cards (defaults to DEFAULT_CARD_STYLE_TOKENS).
 */
export function createMasonryEngine(
  config: MasonryLayoutConfig = DEFAULT_MASONRY_CONFIG,
  cardTokens: NoteCardStyleTokens = DEFAULT_CARD_STYLE_TOKENS,
): MasonryEngine {
  let resolved: ResolvedMasonryLayout | null = null;
  let styleInjected = false;
  const styleId = 'pn-masonry-stylesheet';

  function injectStylesheet(): void {
    if (styleInjected) return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(styleId)) {
      styleInjected = true;
      return;
    }
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = buildMasonryStylesheet(cardTokens);
    document.head.appendChild(styleEl);
    styleInjected = true;
  }

  function attach(container: HTMLElement): () => void {
    injectStylesheet();

    // Initial layout
    const initialWidth = container.getBoundingClientRect().width;
    resolved = resolveMasonryLayout(initialWidth, config);
    applyLayoutToContainer(container, resolved);

    // Observe resize
    const handler = createResizeHandler(config, (layout) => {
      resolved = layout;
      applyLayoutToContainer(container, layout);
    });
    const observer = new ResizeObserver(handler);
    observer.observe(container);

    // Teardown
    return () => {
      observer.disconnect();
    };
  }

  function currentLayout(): ResolvedMasonryLayout | null {
    return resolved;
  }

  function getItemStyle(): string {
    return itemStyle(config.rowGap);
  }

  return {
    attach,
    currentLayout,
    itemStyle: getItemStyle,
  };
}
