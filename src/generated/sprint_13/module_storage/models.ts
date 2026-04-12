// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd implement --sprint 13

/** YYYY-MM-DDTHHMMSS (no colons in time part, no extension). */
const NOTE_ID_RE = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

export interface Frontmatter {
  tags: string[];
}

export interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string;
  preview: string;
}

export interface Note {
  id: string;
  frontmatter: Frontmatter;
  body: string;
  created_at: string;
}

export interface NoteFilter {
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface AppConfig {
  notes_dir: string;
}

export function isValidNoteId(id: string): boolean {
  return NOTE_ID_RE.test(id);
}

/**
 * Converts a note ID ("2026-04-11T143052") to ISO 8601 datetime
 * ("2026-04-11T14:30:52"). Throws if the format is invalid.
 */
export function parseNoteIdToCreatedAt(id: string): string {
  if (!isValidNoteId(id)) {
    throw new Error(`Invalid note ID format: "${id}"`);
  }
  const datePart = id.slice(0, 10);
  const timePart = id.slice(11);
  const hh = timePart.slice(0, 2);
  const mm = timePart.slice(2, 4);
  const ss = timePart.slice(4, 6);
  return `${datePart}T${hh}:${mm}:${ss}`;
}

/** Serializes a Frontmatter object to a YAML block enclosed in `---` delimiters. */
export function buildFrontmatter(fm: Frontmatter): string {
  const tagLines =
    fm.tags.length === 0
      ? 'tags: []'
      : `tags:\n${fm.tags.map((t) => `  - ${t}`).join('\n')}`;
  return `---\n${tagLines}\n---`;
}

/** Splits a file's full content into { frontmatter, body }. */
export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  if (!content.startsWith('---\n')) {
    return { frontmatter: { tags: [] }, body: content };
  }
  const closeIdx = content.indexOf('\n---\n', 4);
  if (closeIdx === -1) {
    return { frontmatter: { tags: [] }, body: content };
  }
  const yamlStr = content.slice(4, closeIdx);
  const body = content.slice(closeIdx + 5);
  const tags = parseYamlTags(yamlStr);
  return { frontmatter: { tags }, body };
}

function parseYamlTags(yaml: string): string[] {
  // Handle: "tags: [a, b]" or "tags:\n  - a\n  - b" or "tags: []"
  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]\s*$/m);
  if (inlineMatch) {
    const raw = inlineMatch[1].trim();
    if (!raw) return [];
    return raw.split(',').map((t) => t.trim()).filter(Boolean);
  }
  const blockMatch = yaml.match(/^tags:\s*$([\s\S]*?)(?=^\S|\s*$)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map((line) => line.match(/^\s+-\s+(.+)/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => m[1].trim());
  }
  return [];
}

/** Strips the frontmatter block from a document string, returning only body text. */
export function extractBody(doc: string): string {
  const { body } = parseFrontmatter(doc);
  return body;
}

/** Truncates text to at most 100 Unicode code points without splitting surrogates. */
export function truncatePreview(text: string): string {
  const codePoints = [...text];
  return codePoints.slice(0, 100).join('');
}
