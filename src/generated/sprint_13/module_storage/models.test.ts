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

import { describe, it, expect } from 'vitest';
import {
  isValidNoteId,
  parseNoteIdToCreatedAt,
  buildFrontmatter,
  parseFrontmatter,
  extractBody,
  truncatePreview,
} from './models';

describe('isValidNoteId', () => {
  it('accepts valid YYYY-MM-DDTHHMMSS format', () => {
    expect(isValidNoteId('2026-04-11T143052')).toBe(true);
    expect(isValidNoteId('2026-01-01T000000')).toBe(true);
  });

  it('rejects ISO 8601 with colons in time part', () => {
    expect(isValidNoteId('2026-04-11T14:30:52')).toBe(false);
  });

  it('rejects filenames with extension', () => {
    expect(isValidNoteId('2026-04-11T143052.md')).toBe(false);
  });

  it('rejects arbitrary strings', () => {
    expect(isValidNoteId('my-note')).toBe(false);
    expect(isValidNoteId('')).toBe(false);
  });
});

describe('parseNoteIdToCreatedAt', () => {
  it('converts YYYY-MM-DDTHHMMSS to ISO 8601 datetime', () => {
    const result = parseNoteIdToCreatedAt('2026-04-11T143052');
    expect(result).toBe('2026-04-11T14:30:52');
  });

  it('throws on invalid format', () => {
    expect(() => parseNoteIdToCreatedAt('invalid')).toThrow();
  });
});

describe('buildFrontmatter', () => {
  it('serializes tags array to YAML frontmatter block', () => {
    const result = buildFrontmatter({ tags: ['gpt', 'coding'] });
    expect(result).toContain('tags:');
    expect(result).toContain('gpt');
    expect(result).toContain('coding');
    expect(result.startsWith('---\n')).toBe(true);
    expect(result.trimEnd().endsWith('---')).toBe(true);
  });

  it('serializes empty tags array', () => {
    const result = buildFrontmatter({ tags: [] });
    expect(result).toContain('tags:');
  });

  it('does not include created_at or other fields', () => {
    const result = buildFrontmatter({ tags: ['x'] });
    expect(result).not.toContain('created_at');
    expect(result).not.toContain('id');
  });
});

describe('parseFrontmatter', () => {
  it('extracts tags from YAML frontmatter', () => {
    const content = '---\ntags:\n  - rust\n  - tauri\n---\n\nBody text here.';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual(['rust', 'tauri']);
    expect(body.trim()).toBe('Body text here.');
  });

  it('returns empty tags when frontmatter is absent', () => {
    const content = 'Just a plain body.';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual([]);
    expect(body).toBe('Just a plain body.');
  });

  it('ignores unknown frontmatter fields', () => {
    const content = '---\ntags: [a]\ntitle: should be ignored\n---\nBody.';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual(['a']);
    expect('title' in frontmatter).toBe(false);
  });

  it('returns empty tags for empty frontmatter block', () => {
    const content = '---\n---\nBody.';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.tags).toEqual([]);
    expect(body.trim()).toBe('Body.');
  });
});

describe('extractBody', () => {
  it('strips frontmatter block from document string', () => {
    const doc = '---\ntags: [a]\n---\n\nActual body.';
    expect(extractBody(doc).trim()).toBe('Actual body.');
  });

  it('returns full text when no frontmatter present', () => {
    expect(extractBody('plain text')).toBe('plain text');
  });
});

describe('truncatePreview', () => {
  it('truncates body to 100 characters', () => {
    const long = 'a'.repeat(200);
    expect(truncatePreview(long)).toHaveLength(100);
  });

  it('does not truncate short bodies', () => {
    expect(truncatePreview('short')).toBe('short');
  });

  it('does not cut in the middle of a multibyte character', () => {
    const emoji = '😀'.repeat(60);
    const preview = truncatePreview(emoji);
    // Each emoji is a surrogate pair; splitting at a code unit boundary would yield orphaned surrogates.
    // The function must split at code point boundaries.
    expect(() => encodeURIComponent(preview)).not.toThrow();
  });
});
