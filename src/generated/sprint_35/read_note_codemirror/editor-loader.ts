// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `read_note` でノート読み込み → CodeMirror にセット → 自動保存有効化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=35 task=35-1 module=editor
import { invoke } from '@tauri-apps/api/core';

export interface Frontmatter {
  tags: string[];
}

export interface NoteData {
  frontmatter: Frontmatter;
  body: string;
}

export async function loadNote(filename: string): Promise<NoteData> {
  return invoke<NoteData>('read_note', { filename });
}

export async function saveNote(
  filename: string,
  frontmatter: Frontmatter,
  body: string,
): Promise<{ success: boolean }> {
  return invoke('save_note', { filename, frontmatter, body });
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
  const tags = extractTags(yamlBlock);
  return { frontmatter: { tags }, body };
}

function extractTags(yaml: string): string[] {
  // Inline array: tags: [a, b]
  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Block list: tags:\n  - a\n  - b
  const blockMatch = yaml.match(/^tags:\s*\n((?:[ \t]+-[ \t]+.+\n?)*)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map((line) => line.replace(/^[ \t]+-[ \t]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

export function buildDocContent(frontmatter: Frontmatter, body: string): string {
  return serializeFrontmatter(frontmatter) + '\n' + body;
}

function serializeFrontmatter(frontmatter: Frontmatter): string {
  const { tags } = frontmatter;
  if (tags.length === 0) {
    return '---\ntags: []\n---';
  }
  const list = tags.map((t) => `  - ${t}`).join('\n');
  return `---\ntags:\n${list}\n---`;
}
