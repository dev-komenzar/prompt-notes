// ADR-008 guard: pseudo round-trip idempotency for the production frontmatter helpers.
// `extractBody` uses `trimStart()` so the production path happens to be idempotent
// even though the raw layout produced by `generateNoteContent` places a separator
// newline directly after the closing fence. These tests lock that behavior in.

import { describe, it, expect } from 'vitest';
import { generateNoteContent, extractBody } from '../../src/editor/frontmatter';

describe('ADR-008 prod frontmatter round-trip idempotency', () => {
  const cases: Array<{ name: string; body: string }> = [
    { name: 'simple body', body: 'Hello' },
    { name: 'empty body', body: '' },
    {
      name: 'multiline + japanese + trailing whitespace',
      body: 'こんにちは\n\n世界  \n末尾',
    },
  ];

  for (const { name, body } of cases) {
    it(`extractBody(generateNoteContent([], body)) === body (${name}) — ADR-008 guard`, () => {
      const content = generateNoteContent([], body);
      const extracted = extractBody(content);
      expect(
        extracted,
        'ADR-008: extractBody must return the body without any separator newline'
      ).toBe(body);
    });

    it(`extractBody is idempotent after a second round-trip (${name}) — ADR-008 guard`, () => {
      const first = extractBody(generateNoteContent([], body));
      const second = extractBody(generateNoteContent([], first));
      expect(
        second,
        'ADR-008: extractBody(generateNoteContent([], extractBody(...))) must equal original body'
      ).toBe(body);
    });
  }
});
