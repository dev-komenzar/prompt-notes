// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `serde_yaml` による YAML 解析。`Frontmatter` 構造体（`tags: Vec<String>`, `extra: serde_yaml::Mapping`）でラウンドトリップ保全。frontmatter 不在時は `tags: []` として扱う。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 13
// @task: 13-1
// Tests for frontmatter parse/serialize round-trip preservation.

import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  serializeFrontmatter,
  createEmptyFrontmatter,
  splitRaw,
} from './frontmatter';

describe('splitRaw', () => {
  it('returns null yaml when no frontmatter present', () => {
    const result = splitRaw('Hello world');
    expect(result.yaml).toBeNull();
    expect(result.body).toBe('Hello world');
  });

  it('splits frontmatter from body', () => {
    const content = '---\ntags: [a]\n---\nBody text';
    const result = splitRaw(content);
    expect(result.yaml).toBe('tags: [a]');
    expect(result.body).toBe('Body text');
  });

  it('ADR-008: excludes separator newline after closing fence', () => {
    const content = '---\ntags: []\n---\n\nBody';
    const result = splitRaw(content);
    expect(result.yaml).toBe('tags: []');
    expect(
      result.body,
      'ADR-008: body must not include the separator newline after the closing fence'
    ).toBe('Body');
  });
});

describe('ADR-008 round-trip idempotency', () => {
  const cases: Array<{ name: string; body: string }> = [
    { name: 'simple body', body: 'Hello' },
    { name: 'empty body', body: '' },
    {
      name: 'multiline + japanese + trailing whitespace',
      body: 'こんにちは\n\n世界  \n末尾',
    },
  ];

  for (const { name, body } of cases) {
    it(`splitRaw → serializeFrontmatter → splitRaw is idempotent (${name})`, () => {
      const initial = `---\ntags: []\n---\n\n${body}`;

      // 1) splitRaw on the canonical ADR-008 layout must yield the original body
      const split1 = splitRaw(initial);
      expect(
        split1.body,
        'ADR-008: splitRaw must not include the separator newline in the body'
      ).toBe(body);

      // 2) parseFrontmatter → serializeFrontmatter must reconstruct the initial content
      const { frontmatter } = parseFrontmatter(initial);
      const reserialized = serializeFrontmatter(frontmatter, split1.body);
      expect(
        reserialized,
        'ADR-008: serializeFrontmatter should produce `---\\n<yaml>\\n---\\n\\n<body>` layout'
      ).toBe(initial);

      // 3) A second splitRaw must recover the original body (idempotency)
      const split2 = splitRaw(reserialized);
      expect(
        split2.body,
        'ADR-008: round-trip splitRaw must recover the original body'
      ).toBe(body);
    });
  }
});

describe('parseFrontmatter', () => {
  it('returns empty tags when frontmatter is absent', () => {
    const { frontmatter, body } = parseFrontmatter('Just some text');
    expect(frontmatter.tags).toEqual([]);
    expect(frontmatter.extra).toEqual({});
    expect(body).toBe('Just some text');
  });

  it('parses tags from frontmatter', () => {
    const content = '---\ntags:\n  - gpt\n  - coding\n---\nBody here';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual(['gpt', 'coding']);
    expect(body).toBe('Body here');
  });

  it('parses flow-style tags', () => {
    const content = '---\ntags: [gpt, coding]\n---\nBody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual(['gpt', 'coding']);
  });

  it('preserves unknown fields in extra', () => {
    const content = '---\ntags: [a]\ncustom_field: hello\nnested:\n  key: value\n---\nBody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual(['a']);
    expect(frontmatter.extra['custom_field']).toBe('hello');
    expect(frontmatter.extra['nested']).toEqual({ key: 'value' });
  });

  it('handles empty tags field', () => {
    const content = '---\ntags: []\n---\nBody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual([]);
  });

  it('handles missing tags field as empty array', () => {
    const content = '---\nother: value\n---\nBody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual([]);
    expect(frontmatter.extra['other']).toBe('value');
  });

  it('handles malformed YAML gracefully', () => {
    const content = '---\n: invalid yaml {{{\n---\nBody';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual([]);
    expect(body).toBe('Body');
  });
});

describe('serializeFrontmatter', () => {
  it('serializes tags into YAML frontmatter', () => {
    const fm = { tags: ['gpt', 'coding'], extra: {} };
    const result = serializeFrontmatter(fm, 'Body text');
    expect(result).toContain('---\n');
    expect(result).toContain('tags:');
    expect(result).toContain('gpt');
    expect(result).toContain('coding');
    expect(result).toContain('---\nBody text');
  });

  it('preserves extra fields on serialization', () => {
    const fm = {
      tags: ['a'],
      extra: { custom: 'hello', num: 42 },
    };
    const result = serializeFrontmatter(fm, 'Body');
    expect(result).toContain('custom:');
    expect(result).toContain('hello');
    expect(result).toContain('num:');
  });

  it('serializes empty frontmatter', () => {
    const fm = createEmptyFrontmatter();
    const result = serializeFrontmatter(fm, 'Body');
    expect(result).toMatch(/^---\n/);
    expect(result).toContain('tags: []');
    expect(result).toMatch(/---\nBody$/);
  });
});

describe('round-trip preservation', () => {
  it('preserves content through parse then serialize', () => {
    const original = '---\ntags: [gpt, coding]\ncustom: data\n---\nMy body text';
    const { frontmatter, body } = parseFrontmatter(original);
    const reserialized = serializeFrontmatter(frontmatter, body);
    const reparsed = parseFrontmatter(reserialized);

    expect(reparsed.frontmatter.tags).toEqual(['gpt', 'coding']);
    expect(reparsed.frontmatter.extra['custom']).toBe('data');
    expect(reparsed.body).toBe('My body text');
  });

  it('round-trips empty tags with extra fields', () => {
    const original = '---\ntags: []\nfoo: bar\n---\nContent';
    const { frontmatter, body } = parseFrontmatter(original);
    const reserialized = serializeFrontmatter(frontmatter, body);
    const reparsed = parseFrontmatter(reserialized);

    expect(reparsed.frontmatter.tags).toEqual([]);
    expect(reparsed.frontmatter.extra['foo']).toBe('bar');
    expect(reparsed.body).toBe('Content');
  });

  it('round-trips file with no initial frontmatter', () => {
    const original = 'Plain text with no frontmatter';
    const { frontmatter, body } = parseFrontmatter(original);
    expect(frontmatter.tags).toEqual([]);

    const serialized = serializeFrontmatter(frontmatter, body);
    const reparsed = parseFrontmatter(serialized);

    expect(reparsed.frontmatter.tags).toEqual([]);
    expect(reparsed.body).toBe('Plain text with no frontmatter');
  });
});
