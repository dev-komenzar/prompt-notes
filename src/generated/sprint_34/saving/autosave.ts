// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-3
// @task-title: Saving
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { EditorView } from '@codemirror/view';
import { saveNote } from '$lib/api/notes';
import type { Frontmatter } from '$lib/types/note';

export const DEBOUNCE_MS = 750;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveCallbacks {
  onSaving: () => void;
  onSaved: () => void;
  onError: (err: unknown) => void;
}

export function parseFrontmatterAndBody(doc: string): { frontmatter: Frontmatter; body: string } {
  if (!doc.startsWith('---\n')) {
    return { frontmatter: { tags: [] }, body: doc };
  }
  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: { tags: [] }, body: doc };
  }
  const yamlBlock = doc.slice(4, endIndex);
  const body = doc.slice(endIndex + 5);

  const tagsMatch = yamlBlock.match(/^tags:\s*\[([^\]]*)\]/m);
  let tags: string[] = [];
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  } else {
    const tagsListMatch = yamlBlock.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
    if (tagsListMatch) {
      tags = tagsListMatch[1]
        .split('\n')
        .map((line) => line.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }
  }

  return { frontmatter: { tags }, body };
}

export function createAutoSaveExtension(filename: string, callbacks: AutoSaveCallbacks) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const doc = update.view.state.doc.toString();
      const { frontmatter, body } = parseFrontmatterAndBody(doc);
      callbacks.onSaving();
      try {
        await saveNote(filename, frontmatter, body);
        callbacks.onSaved();
      } catch (err) {
        callbacks.onError(err);
      }
    }, DEBOUNCE_MS);
  });
}
