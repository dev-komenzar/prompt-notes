// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-1
// @task-title: `EditorView.updateListener` 拡張。デバウンス間隔 750ms（初期値
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: task=31-1 sprint=31 module=editor
import { EditorView } from '@codemirror/view';
import { saveNote } from '$lib/api/notes';
import type { Frontmatter } from '$lib/types/note';

const DEBOUNCE_MS = 750;

function parseFrontmatterAndBody(doc: string): { frontmatter: Frontmatter; body: string } {
  if (!doc.startsWith('---\n')) {
    return { frontmatter: { tags: [] }, body: doc };
  }
  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: { tags: [] }, body: doc };
  }
  const yamlContent = doc.slice(4, endIndex);
  const body = doc.slice(endIndex + 5);
  const tags = parseTagsFromYaml(yamlContent);
  return { frontmatter: { tags }, body };
}

function parseTagsFromYaml(yaml: string): string[] {
  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter((t) => t.length > 0);
  }
  const blockMatch = yaml.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s+-\s+/, '').trim())
      .filter((t) => t.length > 0);
  }
  return [];
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
