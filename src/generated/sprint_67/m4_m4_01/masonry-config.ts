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
// CSS Columns masonry — default configuration targeting Tauri WebView on Linux/macOS.

import type { MasonryLayoutConfig, NoteCardStyleTokens } from './types';

/**
 * Default masonry layout configuration.
 *
 * Column counts are tuned for typical Tauri desktop window sizes
 * on Linux (GTK WebKitGTK) and macOS (WKWebView).
 * CSS Columns is the chosen implementation per OQ-003 resolution:
 *  - Stable support in both WebKitGTK and WKWebView.
 *  - No JavaScript layout computation required.
 *  - Cards flow top→bottom, then next column (Pinterest-style).
 */
export const DEFAULT_MASONRY_CONFIG: MasonryLayoutConfig = {
  breakpoints: [
    { minWidth: 0, columns: 1 },
    { minWidth: 480, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1440, columns: 5 },
  ],
  columnGap: 16,
  rowGap: 16,
  fallbackColumns: 2,
} as const;

/**
 * Default visual tokens for note cards.
 * Designed for light theme; dark mode adaptation uses CSS variables.
 */
export const DEFAULT_CARD_STYLE_TOKENS: NoteCardStyleTokens = {
  borderRadius: '8px',
  padding: '12px 16px',
  backgroundColor: 'var(--card-bg, #ffffff)',
  hoverBackgroundColor: 'var(--card-hover-bg, #f5f7fa)',
  tagBadgeBg: 'var(--tag-badge-bg, #e8ecf1)',
  tagBadgeColor: 'var(--tag-badge-color, #3b4252)',
  previewFontSize: '0.875rem',
  metaFontSize: '0.75rem',
  lineClamp: null, // variable height — no clamping
} as const;

/** CSS class name prefix used by the masonry system. */
export const CSS_CLASS_PREFIX = 'pn-masonry' as const;
