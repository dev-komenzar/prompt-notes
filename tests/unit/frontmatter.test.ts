import { describe, it, expect } from "vitest";
import {
  splitRaw,
  parseTags,
  extractBody,
  generateNoteContent,
  reassemble,
  parseNote,
} from "../../src/lib/frontmatter";

describe("frontmatter", () => {
  describe("splitRaw", () => {
    it("should split frontmatter and body", () => {
      const raw = "---\ntags: []\n---\n\nHello world";
      const { frontmatter, body } = splitRaw(raw);
      expect(frontmatter).toBe("---\ntags: []\n---\n");
      expect(body).toBe("Hello world");
    });

    it("should handle no frontmatter", () => {
      const raw = "Just text";
      const { frontmatter, body } = splitRaw(raw);
      expect(frontmatter).toBe("");
      expect(body).toBe("Just text");
    });
  });

  describe("parseTags", () => {
    it("should parse inline tags", () => {
      const fm = "---\ntags: [rust, tauri]\n---\n";
      expect(parseTags(fm)).toEqual(["rust", "tauri"]);
    });

    it("should parse block tags", () => {
      const fm = "---\ntags:\n  - rust\n  - tauri\n---\n";
      expect(parseTags(fm)).toEqual(["rust", "tauri"]);
    });

    it("should handle empty tags", () => {
      const fm = "---\ntags: []\n---\n";
      expect(parseTags(fm)).toEqual([]);
    });
  });

  describe("extractBody", () => {
    it("should extract body content", () => {
      const raw = "---\ntags: []\n---\n\nHello";
      expect(extractBody(raw)).toBe("Hello");
    });
  });

  describe("generateNoteContent", () => {
    it("should generate with empty tags", () => {
      const result = generateNoteContent([], "Body");
      expect(result).toBe("---\ntags: []\n---\n\nBody");
    });

    it("should generate with tags", () => {
      const result = generateNoteContent(["a", "b"], "Body");
      expect(result).toBe("---\ntags:\n  - a\n  - b\n---\n\nBody");
    });
  });

  describe("round-trip idempotency (ADR-008 / AC-STOR-06)", () => {
    const cases = [
      "---\ntags: []\n---\n\nSimple body",
      "---\ntags:\n  - rust\n  - tauri\n---\n\nMulti-tag body",
      "---\ntags: []\n---\n\n",
      "---\ntags:\n  - test\n---\n\nLine 1\nLine 2\nLine 3",
    ];

    for (const raw of cases) {
      it(`should round-trip: ${raw.substring(0, 30)}...`, () => {
        const parsed = parseNote(raw);
        const regenerated = generateNoteContent(parsed.tags, parsed.body);
        expect(regenerated).toBe(raw);
      });

      it(`should be idempotent over 10 iterations: ${raw.substring(0, 30)}...`, () => {
        let current = raw;
        for (let i = 0; i < 10; i++) {
          const p = parseNote(current);
          current = generateNoteContent(p.tags, p.body);
        }
        expect(current).toBe(raw);
      });
    }
  });

  describe("reassemble", () => {
    it("should reassemble frontmatter and body", () => {
      const fm = "---\ntags: []\n---\n";
      const body = "Hello";
      expect(reassemble(fm, body)).toBe("---\ntags: []\n---\n\nHello");
    });
  });
});
