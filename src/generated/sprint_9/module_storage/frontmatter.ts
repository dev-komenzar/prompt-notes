// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
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
// @generated-by: codd implement --sprint 9

export interface Frontmatter {
  tags: string[];
}

export interface ParsedNote {
  frontmatter: Frontmatter;
  body: string;
}

const DELIMITER = "---";
const FM_OPEN = "---\n";
const FM_CLOSE = "\n---\n";

/**
 * Parses YAML frontmatter from note file content.
 * Only the `tags` field is recognized; unknown fields are silently discarded.
 * If no valid frontmatter block is present, returns empty tags and the full content as body.
 */
export function parseFrontmatter(content: string): ParsedNote {
  if (!content.startsWith(FM_OPEN)) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const closeIndex = content.indexOf(FM_CLOSE, FM_OPEN.length);
  if (closeIndex === -1) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const yamlBlock = content.slice(FM_OPEN.length, closeIndex);
  const body = content.slice(closeIndex + FM_CLOSE.length);
  const frontmatter = parseTagsFromYaml(yamlBlock);

  return { frontmatter, body };
}

/**
 * Serializes frontmatter and body into a note file string.
 * Only `tags` is written; no other fields are emitted.
 */
export function serializeFrontmatter(frontmatter: Frontmatter, body: string): string {
  const tagsYaml = serializeTagsToYaml(frontmatter.tags);
  return `${DELIMITER}\n${tagsYaml}${DELIMITER}\n${body}`;
}

/**
 * Extracts body text without the frontmatter block.
 * Used by CopyButton to exclude frontmatter from clipboard content.
 */
export function extractBody(content: string): string {
  return parseFrontmatter(content).body;
}

function parseTagsFromYaml(yaml: string): Frontmatter {
  // Matches both inline: `tags: [a, b]` and block list forms.
  const inlineMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    const raw = inlineMatch[1];
    const tags = raw
      .split(",")
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
      .filter((t) => t.length > 0);
    return { tags };
  }

  // Block sequence form:
  // tags:
  //   - foo
  //   - bar
  const blockMatch = yaml.match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m);
  if (blockMatch) {
    const lines = blockMatch[1].split("\n");
    const tags = lines
      .map((l) => l.match(/^\s*-\s*(.+)/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => m[1].trim().replace(/^['"]|['"]$/g, ""))
      .filter((t) => t.length > 0);
    return { tags };
  }

  return { tags: [] };
}

function serializeTagsToYaml(tags: string[]): string {
  if (tags.length === 0) {
    return "tags: []\n";
  }
  const escaped = tags.map((t) => (/[,\[\]{}:#&*?|<>=!%@`'"]/.test(t) ? `"${t.replace(/"/g, '\\"')}"` : t));
  return `tags: [${escaped.join(", ")}]\n`;
}
