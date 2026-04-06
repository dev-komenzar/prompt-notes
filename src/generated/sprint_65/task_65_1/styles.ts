// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=editor+grid
// CSS-in-TS constants for frontmatter decoration and grid layout.
// These are injected as <style> or used by Svelte component scoped styles.

import {
  FRONTMATTER_LINE_CLASS,
  FRONTMATTER_BG_VAR,
  FRONTMATTER_BG_DEFAULT,
} from "./constants";

/**
 * CSS rules for CodeMirror 6 frontmatter line decoration.
 * Injected into the document or Svelte component <style>.
 * Uses CSS custom property for theme flexibility (dark mode support).
 */
export const FRONTMATTER_STYLES = `
.${FRONTMATTER_LINE_CLASS} {
  background-color: var(${FRONTMATTER_BG_VAR}, ${FRONTMATTER_BG_DEFAULT});
}
`;

/**
 * CSS rules for the Masonry grid layout using CSS Columns.
 * CSS Columns is chosen for WebKitGTK / WKWebView cross-platform support.
 * CSS Grid masonry is Firefox-only experimental (not usable in Tauri WebView).
 */
export const MASONRY_GRID_STYLES = `
.pn-grid-container {
  column-count: 3;
  column-gap: 16px;
  padding: 16px;
}

@media (max-width: 900px) {
  .pn-grid-container {
    column-count: 2;
  }
}

@media (max-width: 500px) {
  .pn-grid-container {
    column-count: 1;
  }
}

.pn-note-card {
  break-inside: avoid;
  margin-bottom: 16px;
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 8px;
  padding: 12px 16px;
  background: var(--card-bg, #ffffff);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.pn-note-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pn-note-card__preview {
  font-size: 14px;
  line-height: 1.5;
  color: var(--card-text, #334155);
  white-space: pre-wrap;
  word-break: break-word;
}

.pn-note-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.pn-note-card__tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--tag-bg, #e0f2fe);
  color: var(--tag-text, #0369a1);
}

.pn-note-card__date {
  font-size: 12px;
  color: var(--card-date, #94a3b8);
  margin-top: 8px;
}
`;

/**
 * CSS rules for the copy button (module:editor).
 */
export const COPY_BUTTON_STYLES = `
.pn-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  border: 1px solid var(--copy-btn-border, #cbd5e1);
  border-radius: 6px;
  background: var(--copy-btn-bg, #f8fafc);
  color: var(--copy-btn-text, #475569);
  padding: 6px 10px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  line-height: 1;
}

.pn-copy-btn:hover {
  background: var(--copy-btn-hover-bg, #e2e8f0);
}

.pn-copy-btn--copied {
  color: var(--copy-btn-success, #16a34a);
  border-color: var(--copy-btn-success, #16a34a);
}
`;
