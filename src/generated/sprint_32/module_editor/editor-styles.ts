// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.2
// CONV: frontmatter region must have distinct background color.
// CONV: No title input field. No Markdown preview/rendering.

/**
 * CSS styles for the editor component.
 * Injected into the document or used as Svelte component styles.
 */
export const EDITOR_STYLES = `
/* Frontmatter background decoration */
.cm-frontmatter-line {
  background-color: var(--frontmatter-bg, rgba(59, 130, 246, 0.08));
}

/* Editor container — fills available space, no title input */
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* CodeMirror wrapper — takes all available space */
.editor-cm-wrapper {
  flex: 1;
  overflow: hidden;
}

/* Copy button — fixed position in editor, always visible */
.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: var(--copy-btn-bg, #ffffff);
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.copy-button:hover {
  background: var(--copy-btn-hover-bg, #f3f4f6);
}

.copy-button:active {
  background: var(--copy-btn-active-bg, #e5e7eb);
}

.copy-button[data-copied="true"] {
  border-color: var(--copy-btn-success-border, #10b981);
  color: var(--copy-btn-success-color, #10b981);
}

/* Back button for navigation from editor to grid */
.back-button {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: var(--back-btn-bg, #ffffff);
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.back-button:hover {
  background: var(--back-btn-hover-bg, #f3f4f6);
}
`;

/**
 * Injects editor styles into the document head if not already present.
 */
export function injectEditorStyles(): void {
  const styleId = "promptnotes-editor-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = EDITOR_STYLES;
  document.head.appendChild(style);
}
