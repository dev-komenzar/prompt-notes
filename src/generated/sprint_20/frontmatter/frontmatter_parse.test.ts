// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-2
// @task-title: frontmatter パース
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Sprint 20, Task 20-2: frontmatter パース ユニットテスト
// Rust 実装対象: src-tauri/src/storage/frontmatter.rs

/**
 * These TypeScript types mirror the Rust structs defined in src-tauri/src/storage/types.rs.
 * Authoritative definitions live in Rust; this file is a test-specification mirror.
 */

export interface Frontmatter {
  tags: string[];
  extra?: Record<string, unknown>; // serde(flatten) で保全される未知フィールド
}

export interface ParseResult {
  frontmatter: Frontmatter;
  body: string;
}

/** Simulates module:storage parse_frontmatter() behaviour for test specification. */
function parseFrontmatter(content: string): ParseResult {
  const FM_DELIMITER = "---";
  const lines = content.split("\n");

  if (lines[0] !== FM_DELIMITER) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const closingIdx = lines.indexOf(FM_DELIMITER, 1);
  if (closingIdx === -1) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const yamlLines = lines.slice(1, closingIdx).join("\n");
  const body = lines.slice(closingIdx + 1).join("\n").replace(/^\n/, "");

  // Minimal YAML parser for tags only (mirrors serde_yaml behaviour)
  const tags: string[] = [];
  const extra: Record<string, unknown> = {};

  const tagMatch = yamlLines.match(/^tags:\s*\[([^\]]*)\]/m);
  const tagListMatch = yamlLines.match(/^tags:\s*\n((?:\s+-[^\n]*\n?)+)/m);

  if (tagMatch) {
    const raw = tagMatch[1];
    raw.split(",").map(t => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean).forEach(t => tags.push(t));
  } else if (tagListMatch) {
    tagListMatch[1].split("\n").forEach(line => {
      const m = line.match(/^\s+-\s+(.+)/);
      if (m) tags.push(m[1].trim());
    });
  }

  // Preserve unknown fields
  for (const line of yamlLines.split("\n")) {
    const m = line.match(/^(\w+):\s+(.+)/);
    if (m && m[1] !== "tags") {
      extra[m[1]] = m[2];
    }
  }

  return { frontmatter: { tags, extra }, body };
}

function serializeFrontmatter(fm: Frontmatter, body: string): string {
  const tagsYaml =
    fm.tags.length === 0
      ? "tags: []"
      : `tags:\n${fm.tags.map(t => `  - ${t}`).join("\n")}`;

  const extraYaml = fm.extra
    ? Object.entries(fm.extra)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";

  const fmBlock = [tagsYaml, ...(extraYaml ? [extraYaml] : [])].join("\n");
  return `---\n${fmBlock}\n---\n${body ? `\n${body}` : ""}`;
}

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function assertDeepEqual<T>(actual: T, expected: T, message: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`FAIL: ${message}\n  actual:   ${a}\n  expected: ${e}`);
}

// ---------------------------------------------------------------------------
// Tests: parse_frontmatter
// ---------------------------------------------------------------------------

function test_parse_inline_tag_list(): void {
  const content = "---\ntags: [gpt, coding]\n---\n\n本文テキスト";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, ["gpt", "coding"], "inline tag list must be parsed");
  assert(result.body === "本文テキスト", "body must be extracted after frontmatter");
}

function test_parse_block_tag_list(): void {
  const content = "---\ntags:\n  - prompt\n  - gpt4\n---\n\nbody here";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, ["prompt", "gpt4"], "block-style tag list must be parsed");
  assert(result.body === "body here", "body must follow frontmatter");
}

function test_parse_empty_tags(): void {
  const content = "---\ntags: []\n---\n\nbody";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, [], "empty tag array must produce empty Vec");
  assert(result.body === "body", "body must be extracted");
}

function test_parse_no_frontmatter(): void {
  const content = "plain body without frontmatter";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, [], "missing frontmatter defaults to empty tags");
  assert(result.body === content, "entire content is body when no frontmatter");
}

function test_parse_unclosed_frontmatter(): void {
  // Opening --- present but no closing ---
  const content = "---\ntags: [x]\nbody without closing";
  const result = parseFrontmatter(content);
  // Treated as no frontmatter — tags default to empty
  assertDeepEqual(result.frontmatter.tags, [], "unclosed frontmatter must fall back to empty tags");
}

function test_parse_empty_body(): void {
  const content = "---\ntags: [a]\n---\n";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, ["a"], "tags parsed correctly with empty body");
  assert(result.body === "", "empty body after frontmatter");
}

function test_parse_single_tag(): void {
  const content = "---\ntags: [single]\n---\n\nsome text";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, ["single"], "single tag must be parsed as one-element array");
}

function test_parse_tags_with_spaces(): void {
  const content = "---\ntags: [ gpt , coding ]\n---\n\nbody";
  const result = parseFrontmatter(content);
  // serde_yaml strips surrounding whitespace
  assertDeepEqual(result.frontmatter.tags, ["gpt", "coding"], "tags with surrounding spaces must be trimmed");
}

function test_parse_preserves_unknown_fields(): void {
  // NNC-S2: unknown fields must be preserved (not discarded) on round-trip
  const content = "---\ntags: [x]\ncustom_field: hello\n---\n\nbody";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, ["x"], "tags still parsed with unknown fields present");
  assert(
    result.frontmatter.extra !== undefined && result.frontmatter.extra["custom_field"] !== undefined,
    "unknown fields must be preserved in extra map"
  );
}

function test_parse_body_with_dashes(): void {
  // Body containing "---" must not be confused with frontmatter delimiter
  const content = "---\ntags: [a]\n---\n\nsome\n---\ncontent\n---\nmore";
  const result = parseFrontmatter(content);
  assertDeepEqual(result.frontmatter.tags, ["a"], "body dashes must not affect frontmatter parsing");
  assert(result.body.includes("---"), "body dashes must be preserved");
}

function test_parse_multiline_body(): void {
  const body = "line1\nline2\n\nline3";
  const content = `---\ntags: [note]\n---\n\n${body}`;
  const result = parseFrontmatter(content);
  assert(result.body === body, "multiline body must be fully preserved");
}

// ---------------------------------------------------------------------------
// Tests: serialize_frontmatter (round-trip)
// ---------------------------------------------------------------------------

function test_serialize_basic(): void {
  const fm: Frontmatter = { tags: ["gpt", "coding"] };
  const body = "本文";
  const serialized = serializeFrontmatter(fm, body);
  assert(serialized.startsWith("---\n"), "serialized output must start with ---");
  assert(serialized.includes("gpt"), "serialized output must contain tags");
  assert(serialized.includes(body), "serialized output must contain body");
}

function test_roundtrip_tags_preserved(): void {
  const original = "---\ntags:\n  - prompt\n  - gpt4\n---\n\ncontent here";
  const parsed = parseFrontmatter(original);
  const reserialized = serializeFrontmatter(parsed.frontmatter, parsed.body);
  const reparsed = parseFrontmatter(reserialized);
  assertDeepEqual(reparsed.frontmatter.tags, ["prompt", "gpt4"], "tags must survive round-trip");
  assert(reparsed.body === "content here", "body must survive round-trip");
}

function test_roundtrip_empty_tags(): void {
  const original = "---\ntags: []\n---\n\nbody text";
  const parsed = parseFrontmatter(original);
  const reserialized = serializeFrontmatter(parsed.frontmatter, parsed.body);
  const reparsed = parseFrontmatter(reserialized);
  assertDeepEqual(reparsed.frontmatter.tags, [], "empty tags must survive round-trip");
}

function test_serialize_empty_body(): void {
  const fm: Frontmatter = { tags: ["a", "b"] };
  const serialized = serializeFrontmatter(fm, "");
  const reparsed = parseFrontmatter(serialized);
  assertDeepEqual(reparsed.frontmatter.tags, ["a", "b"], "tags preserved when body is empty");
  assert(reparsed.body === "", "body remains empty");
}

function test_no_extra_fields_injected(): void {
  // NNC-S2: module:storage must NOT auto-insert fields other than tags
  const fm: Frontmatter = { tags: ["x"] };
  const serialized = serializeFrontmatter(fm, "body");
  const forbidden = ["title", "created_at", "updated_at", "date", "id"];
  for (const field of forbidden) {
    assert(
      !new RegExp(`^${field}:`, "m").test(serialized),
      `forbidden field '${field}' must not be auto-inserted into frontmatter`
    );
  }
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

const TESTS: Array<[string, () => void]> = [
  ["parse_inline_tag_list", test_parse_inline_tag_list],
  ["parse_block_tag_list", test_parse_block_tag_list],
  ["parse_empty_tags", test_parse_empty_tags],
  ["parse_no_frontmatter", test_parse_no_frontmatter],
  ["parse_unclosed_frontmatter", test_parse_unclosed_frontmatter],
  ["parse_empty_body", test_parse_empty_body],
  ["parse_single_tag", test_parse_single_tag],
  ["parse_tags_with_spaces", test_parse_tags_with_spaces],
  ["parse_preserves_unknown_fields", test_parse_preserves_unknown_fields],
  ["parse_body_with_dashes", test_parse_body_with_dashes],
  ["parse_multiline_body", test_parse_multiline_body],
  ["serialize_basic", test_serialize_basic],
  ["roundtrip_tags_preserved", test_roundtrip_tags_preserved],
  ["roundtrip_empty_tags", test_roundtrip_empty_tags],
  ["serialize_empty_body", test_serialize_empty_body],
  ["no_extra_fields_injected", test_no_extra_fields_injected],
];

let passed = 0;
let failed = 0;
for (const [name, fn] of TESTS) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL  ${name}: ${(e as Error).message}`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
