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
// Public API for the CSS Columns masonry layout system.
//
// OQ-003 Resolution:
//   CSS Columns (`column-count` / `column-gap`) selected as the masonry
//   implementation for PromptNotes grid view.
//
//   Rationale:
//   - WebKitGTK (Linux/GTK) — stable CSS Columns support ✓
//   - WKWebView (macOS)     — stable CSS Columns support ✓
//   - CSS Grid masonry (`grid-template-rows: masonry`) — rejected;
//     experimental, Firefox-only as of 2026-04.
//   - JavaScript masonry libraries (e.g. svelte-masonry) — rejected as
//     primary; CSS Columns achieves Pinterest-style variable-height
//     layout without JS layout computation overhead.
//
//   Cards flow top→bottom within each column, then left→right to
//   the next column. `break-inside: avoid` on each card prevents
//   splitting across columns. Variable card height is natural.

// Types
export type {
  NoteEntry,
  MasonryBreakpoint,
  MasonryLayoutConfig,
  ResolvedMasonryLayout,
  NoteCardStyleTokens,
} from './types';

// Configuration
export {
  DEFAULT_MASONRY_CONFIG,
  DEFAULT_CARD_STYLE_TOKENS,
  CSS_CLASS_PREFIX,
} from './masonry-config';

// Responsive resolution
export {
  resolveColumns,
  resolveMasonryLayout,
  createResizeHandler,
} from './masonry-responsive';

// CSS Columns style generation
export {
  containerStyle,
  itemStyle,
  buildMasonryStylesheet,
  applyLayoutToContainer,
} from './masonry-css-columns';

// Card rendering utilities
export type { FormattedNoteCard } from './note-card-renderer';
export {
  formatCreatedAt,
  formatNoteCard,
  sortEntriesDescending,
} from './note-card-renderer';

// Layout engine (high-level API)
export type { MasonryEngine } from './masonry-layout-engine';
export { createMasonryEngine } from './masonry-layout-engine';
