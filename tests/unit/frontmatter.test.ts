import { describe, it, expect } from "vitest";
import { extractBody, generateNoteContent } from "../../src/editor/frontmatter";

// Re-use production functions for round-trip tests

describe("frontmatter public API", () => {
  describe("extractBody", () => {
    it("extracts body after frontmatter", () => {
      const raw = "---\ntags: []\n---\n\nHello world";
      expect(extractBody(raw)).toBe("Hello world");
    });

    it("returns raw text when frontmatter is absent", () => {
      expect(extractBody("Just text")).toBe("Just text");
    });

    it("returns empty body when only frontmatter is present", () => {
      const raw = "---\ntags: []\n---\n\n";
      expect(extractBody(raw)).toBe("");
    });

    it("preserves body with multiple lines", () => {
      const raw = "---\ntags: []\n---\n\nLine 1\nLine 2\nLine 3";
      expect(extractBody(raw)).toBe("Line 1\nLine 2\nLine 3");
    });
  });

  describe("generateNoteContent", () => {
    it("generates with empty tags (inline [])", () => {
      const result = generateNoteContent([], "Body");
      expect(result).toBe("---\ntags: []\n---\n\nBody");
    });

    it("generates with block-style tags", () => {
      const result = generateNoteContent(["a", "b"], "Body");
      expect(result).toBe("---\ntags:\n  - a\n  - b\n---\n\nBody");
    });

    it("generates with empty body (retains trailing separator)", () => {
      const result = generateNoteContent([], "");
      expect(result).toBe("---\ntags: []\n---\n\n");
    });
  });

  describe("round-trip idempotency (ADR-008 / AC-STOR-06)", () => {
    const cases: Array<{ tags: string[]; body: string }> = [
      { tags: [], body: "Simple body" },
      { tags: ["rust", "tauri"], body: "Multi-tag body" },
      { tags: [], body: "" },
      { tags: ["test"], body: "Line 1\nLine 2\nLine 3" },
    ];

    for (const { tags, body } of cases) {
      const label = body.substring(0, 20) || "(empty)";

      it(`generateNoteContent → extractBody preserves body: ${label}`, () => {
        const raw = generateNoteContent(tags, body);
        expect(extractBody(raw)).toBe(body);
      });

      it(`idempotent over 10 iterations: ${label}`, () => {
        let currentBody = body;
        for (let i = 0; i < 10; i++) {
          const raw = generateNoteContent(tags, currentBody);
          currentBody = extractBody(raw);
        }
        expect(currentBody).toBe(body);
      });
    }
  });
});
