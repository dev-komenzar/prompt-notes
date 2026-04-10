// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: frontmatter シリアライズ + 本文結合 → `.{filename}.tmp` に書き込み → `std::fs::rename()` でアトミック置換
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// Sprint 16 Task 16-1: save_note atomic write — autosave debounce extension
//
// Registered as a CodeMirror 6 updateListener extension.
// Triggers save_note IPC (→ Rust atomic write) after debounce.

import { EditorView } from '@codemirror/view';
import { saveNote } from './save-note';
import type { Frontmatter } from './types';

const DEBOUNCE_MS = 750;

function parseFrontmatterAndBody(doc: string): { frontmatter: Frontmatter; body: string } {
  const match = doc.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return { frontmatter: { tags: [] }, body: doc };
  }

  const yamlBlock = match[1];
  const body = doc.slice(match[0].length);

  const tagsMatch = yamlBlock.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsMatch) {
    const tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return { frontmatter: { tags }, body };
  }

  const tagsListMatch = yamlBlock.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (tagsListMatch) {
    const tags = tagsListMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);
    return { frontmatter: { tags }, body };
  }

  return { frontmatter: { tags: [] }, body };
}

export function createAutoSaveExtension(filename: string): ReturnType<typeof EditorView.updateListener.of> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;

    if (timer) clearTimeout(timer);

    timer = setTimeout(async () => {
      const doc = update.view.state.doc.toString();
      const { frontmatter, body } = parseFrontmatterAndBody(doc);
      await saveNote(filename, frontmatter, body);
    }, DEBOUNCE_MS);
  });
}
