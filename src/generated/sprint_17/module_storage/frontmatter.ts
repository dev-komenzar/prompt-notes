// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Frontmatter parser
// YAML frontmatter with tags-only field. Additional fields require a requirements change.
// This parser is for frontend UI purposes (CodeMirror decoration, body extraction).
// Canonical YAML deserialization is performed by Rust (serde_yaml) on the backend.

const DELIMITER = '---';

/** Parsed frontmatter data. Only `tags` is a supported field. */
export interface FrontmatterData {
  tags: string[];
}

/** Result of parsing a note's content into frontmatter and body. */
export interface ParsedNote {
  /** Parsed frontmatter metadata */
  frontmatter: FrontmatterData;
  /** Note body after frontmatter (leading blank separator line stripped) */
  body: string;
  /** Raw YAML text between delimiters (delimiters excluded) */
  rawYaml: string;
  /** Whether valid frontmatter was detected */
  hasFrontmatter: boolean;
}

/**
 * Character-offset and line-number range of the frontmatter block,
 * including both opening and closing `---` delimiters.
 * Useful for CodeMirror 6 Decoration.line() and range-based operations.
 */
export interface FrontmatterRange {
  /** 0-based line index of the opening delimiter */
  startLine: number;
  /** 0-based line index of the closing delimiter */
  endLine: number;
  /** Character offset of the start of the frontmatter block (always 0) */
  from: number;
  /** Character offset immediately after the closing delimiter line (including its trailing newline if present) */
  to: number;
}

/**
 * Detects the frontmatter block in a document and returns its range.
 * Returns null if no valid frontmatter is found.
 *
 * A valid frontmatter block:
 * - Starts at the very first line of the document with `---`
 * - Has a corresponding closing `---` on a subsequent line
 */
export function detectFrontmatterRange(content: string): FrontmatterRange | null {
  if (!content.startsWith(DELIMITER)) {
    return null;
  }

  const lines = content.split('\n');

  if (lines.length < 2 || lines[0].trim() !== DELIMITER) {
    return null;
  }

  let charOffset = lines[0].length + 1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIMITER) {
      const lineEnd = charOffset + lines[i].length;
      const to = lineEnd + (i < lines.length - 1 ? 1 : 0);

      return {
        startLine: 0,
        endLine: i,
        from: 0,
        to,
      };
    }
    charOffset += lines[i].length + 1;
  }

  return null;
}

/**
 * Parses the full content of a .md note file into frontmatter and body.
 *
 * Handles edge cases per design specification:
 * - No frontmatter → tags: [], entire content is body
 * - YAML parse error → tags: [], body is content after frontmatter block
 * - Missing tags field → tags: []
 * - tags as single string → converted to single-element array
 * - Unknown YAML fields → silently ignored
 * - Empty file → tags: [], body: ""
 */
export function parseFrontmatter(content: string): ParsedNote {
  const range = detectFrontmatterRange(content);

  if (range === null) {
    return {
      frontmatter: { tags: [] },
      body: content,
      rawYaml: '',
      hasFrontmatter: false,
    };
  }

  const lines = content.split('\n');
  const yamlLines = lines.slice(range.startLine + 1, range.endLine);
  const rawYaml = yamlLines.join('\n');
  const rawBody = content.slice(range.to);
  const body = rawBody.replace(/^\n/, '');

  let tags: string[];
  try {
    tags = parseTagsFromYaml(rawYaml);
  } catch {
    tags = [];
  }

  return {
    frontmatter: { tags },
    body,
    rawYaml,
    hasFrontmatter: true,
  };
}

/**
 * Extracts body content from a note, excluding frontmatter.
 * Convenience wrapper around parseFrontmatter.
 */
export function extractBody(content: string): string {
  return parseFrontmatter(content).body;
}

/**
 * Extracts tags from a note's frontmatter.
 * Returns empty array if no frontmatter or no tags field.
 */
export function extractTags(content: string): string[] {
  return parseFrontmatter(content).frontmatter.tags;
}

/**
 * Serializes FrontmatterData into a YAML frontmatter string
 * (including opening and closing delimiters).
 */
export function serializeFrontmatter(data: FrontmatterData): string {
  if (data.tags.length === 0) {
    return `${DELIMITER}\ntags: []\n${DELIMITER}`;
  }
  const tagList = data.tags.map(escapeYamlTag).join(', ');
  return `${DELIMITER}\ntags: [${tagList}]\n${DELIMITER}`;
}

/**
 * Creates the initial content template for a new note.
 * Format: frontmatter block followed by a blank line ready for body input.
 */
export function createNoteTemplate(tags: string[] = []): string {
  return `${serializeFrontmatter({ tags })}\n\n`;
}

// ---------------------------------------------------------------------------
// Internal YAML helpers — limited to the tags-only frontmatter schema
// ---------------------------------------------------------------------------

function escapeYamlTag(tag: string): string {
  if (
    tag.includes(',') ||
    tag.includes('[') ||
    tag.includes(']') ||
    tag.includes('"') ||
    tag.includes("'") ||
    tag.includes(':') ||
    tag.includes('#') ||
    tag.includes('{') ||
    tag.includes('}')
  ) {
    return `"${tag.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return tag;
}

/**
 * Parses the `tags` field value from raw YAML text.
 * Supports:
 *   tags: [gpt, coding]          — flow sequence
 *   tags: []                     — empty flow sequence
 *   tags:                        — block sequence on subsequent lines
 *     - gpt
 *     - coding
 *   tags: single_tag             — bare scalar (converted to single-element array)
 *   tags: "quoted tag"           — quoted scalar
 *   (no tags line)               — returns []
 */
function parseTagsFromYaml(yaml: string): string[] {
  const lines = yaml.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^tags\s*:\s*(.*)/);
    if (!match) {
      continue;
    }

    const inlineValue = match[1].trim();

    if (inlineValue === '' || inlineValue === '~' || inlineValue === 'null') {
      return parseBlockSequence(lines, i + 1);
    }

    if (inlineValue.startsWith('[')) {
      return parseFlowSequence(inlineValue);
    }

    const unquoted = unquoteScalar(inlineValue);
    return unquoted === '' ? [] : [unquoted];
  }

  return [];
}

/**
 * Parses a YAML flow sequence: `[item1, item2, "item 3"]`
 * Handles quoted strings and escaped characters within quotes.
 */
function parseFlowSequence(raw: string): string[] {
  const inner = raw.replace(/^\[/, '').replace(/\].*$/, '').trim();
  if (inner === '') {
    return [];
  }

  const items: string[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];

    if (inQuote !== null) {
      if (ch === '\\' && i + 1 < inner.length) {
        current += inner[i + 1];
        i++;
        continue;
      }
      if (ch === inQuote) {
        inQuote = null;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }

    if (ch === ',') {
      const trimmed = current.trim();
      if (trimmed !== '') {
        items.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  const last = current.trim();
  if (last !== '') {
    items.push(last);
  }

  return items;
}

/**
 * Parses a YAML block sequence starting at `start` index:
 *   - item1
 *   - item2
 */
function parseBlockSequence(lines: string[], start: number): string[] {
  const result: string[] = [];

  for (let i = start; i < lines.length; i++) {
    const match = lines[i].match(/^\s+-\s+(.*)/);
    if (match) {
      const value = unquoteScalar(match[1].trim());
      if (value !== '') {
        result.push(value);
      }
    } else if (lines[i].trim() === '') {
      continue;
    } else {
      break;
    }
  }

  return result;
}

/** Removes surrounding quotes (single or double) from a YAML scalar value. */
function unquoteScalar(s: string): string {
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}
