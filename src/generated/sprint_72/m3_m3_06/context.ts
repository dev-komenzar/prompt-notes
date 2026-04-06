// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 72-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:72 | task:72-1 | module:editor | OQ-E02
//
// Pattern B — Svelte Context
//
// The parent component (Editor.svelte) creates an EditorViewContext during
// initialisation and children (CopyButton.svelte) retrieve it via getContext.
//
// Advantages
// ----------
// • Eliminates prop-passing entirely — useful if additional descendants
//   need access in the future.
// • Centralises EditorView lifecycle in a single context object.
//
// Trade-offs
// ----------
// • Implicit coupling: child components rely on a context key being set
//   by an ancestor.
// • Slightly harder to test in isolation (must wrap with a provider).
// • For a two-component hierarchy (Editor → CopyButton) context is heavier
//   than a simple prop.
//
// Usage sketch (Editor.svelte):
//
//   import { provideEditorViewContext } from './context';
//
//   const ctx = provideEditorViewContext();
//
//   onMount(() => {
//     const view = new EditorView({ ... });
//     ctx.setView(view);
//   });
//   onDestroy(() => ctx.setView(null));
//
// Usage sketch (CopyButton.svelte):
//
//   import { consumeEditorViewContext } from './context';
//
//   const ctx = consumeEditorViewContext();
//
//   function handleCopy() {
//     const text = ctx.getBodyText();
//     ...
//   }
//

import { getContext, setContext } from 'svelte';
import type { EditorView } from '@codemirror/view';
import { getFullText, getBodyText } from './editor-text-accessor';

const EDITOR_VIEW_CONTEXT_KEY = Symbol('promptnotes:editor-view');

/**
 * Public interface available to any descendant that consumes the context.
 */
export interface EditorViewContext {
  /**
   * Assigns (or clears) the current EditorView instance.
   * Called by Editor.svelte in onMount / onDestroy.
   */
  setView(view: EditorView | null): void;

  /**
   * Returns the current EditorView or `null` if not yet mounted.
   */
  getView(): EditorView | null;

  /**
   * Returns the full document text (frontmatter included).
   * Returns `''` if no view is available.
   */
  getFullText(): string;

  /**
   * Returns the body text with frontmatter stripped.
   * Returns `''` if no view is available.
   */
  getBodyText(): string;
}

/**
 * Creates the EditorView context and registers it in the Svelte component tree.
 *
 * **Must be called during component initialisation** (top-level `<script>`
 * block of Editor.svelte) because Svelte's `setContext` is only valid at
 * that time.
 */
export function provideEditorViewContext(): EditorViewContext {
  let currentView: EditorView | null = null;

  const ctx: EditorViewContext = {
    setView(view: EditorView | null): void {
      currentView = view;
    },

    getView(): EditorView | null {
      return currentView;
    },

    getFullText(): string {
      return currentView ? getFullText(currentView) : '';
    },

    getBodyText(): string {
      return currentView ? getBodyText(currentView) : '';
    },
  };

  setContext(EDITOR_VIEW_CONTEXT_KEY, ctx);
  return ctx;
}

/**
 * Retrieves the EditorView context set by an ancestor Editor component.
 *
 * **Must be called during component initialisation** (top-level `<script>`
 * block of CopyButton.svelte).
 *
 * Throws at runtime if no ancestor has provided the context.
 */
export function consumeEditorViewContext(): EditorViewContext {
  const ctx = getContext<EditorViewContext | undefined>(EDITOR_VIEW_CONTEXT_KEY);
  if (!ctx) {
    throw new Error(
      'EditorViewContext not found. Ensure a parent component has called provideEditorViewContext().',
    );
  }
  return ctx;
}
