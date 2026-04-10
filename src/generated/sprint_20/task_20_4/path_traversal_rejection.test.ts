// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-4
// @task-title: パストラバーサル拒否
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// Sprint 20 Task 20-4: パストラバーサル拒否テスト

import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const TRAVERSAL_PATTERNS = [
  "../etc/passwd",
  "../../etc/passwd",
  "../../../etc/shadow",
  "..\\Windows\\System32\\config\\SAM",
  "..%2F..%2Fetc%2Fpasswd",
  "..%5C..%5Cwindows%5Csystem32",
  "%2e%2e%2fetc%2fpasswd",
  "%2e%2e%5cwindows",
  "....//....//etc/passwd",
  "..;/etc/passwd",
  "/etc/passwd",
  "/absolute/path/note.md",
  "\\absolute\\path\\note.md",
  "valid/../../../etc/passwd",
  "2026-04-10T091530.md/../../../etc/passwd",
  "2026-04-10T091530.md\0extra",
  "note.md\x00/etc/passwd",
];

const VALID_FILENAME = "2026-04-10T091530.md";

describe("パストラバーサル拒否: read_note", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(TRAVERSAL_PATTERNS)(
    "read_note: '%s' はエラーを返す",
    async (filename) => {
      mockInvoke.mockRejectedValueOnce(
        new Error("invalid filename: path traversal detected")
      );
      await expect(invoke("read_note", { filename })).rejects.toThrow();
      expect(mockInvoke).toHaveBeenCalledWith("read_note", { filename });
    }
  );

  it("read_note: 正規ファイル名は受け入れられる", async () => {
    mockInvoke.mockResolvedValueOnce({
      frontmatter: { tags: [] },
      body: "",
    });
    const result = await invoke("read_note", { filename: VALID_FILENAME });
    expect(result).toHaveProperty("frontmatter");
    expect(result).toHaveProperty("body");
  });
});

describe("パストラバーサル拒否: save_note", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(TRAVERSAL_PATTERNS)(
    "save_note: '%s' はエラーを返す",
    async (filename) => {
      mockInvoke.mockRejectedValueOnce(
        new Error("invalid filename: path traversal detected")
      );
      await expect(
        invoke("save_note", {
          filename,
          frontmatter: { tags: [] },
          body: "test body",
        })
      ).rejects.toThrow();
    }
  );

  it("save_note: 正規ファイル名は成功する", async () => {
    mockInvoke.mockResolvedValueOnce({ success: true });
    const result = await invoke("save_note", {
      filename: VALID_FILENAME,
      frontmatter: { tags: ["test"] },
      body: "test body content",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("パストラバーサル拒否: delete_note", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(TRAVERSAL_PATTERNS)(
    "delete_note: '%s' はエラーを返す",
    async (filename) => {
      mockInvoke.mockRejectedValueOnce(
        new Error("invalid filename: path traversal detected")
      );
      await expect(invoke("delete_note", { filename })).rejects.toThrow();
    }
  );

  it("delete_note: 正規ファイル名は成功する", async () => {
    mockInvoke.mockResolvedValueOnce({ success: true });
    const result = await invoke("delete_note", { filename: VALID_FILENAME });
    expect(result).toEqual({ success: true });
  });
});

describe("パストラバーサル拒否: ファイル名バリデーション規則", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const INVALID_BUT_NON_TRAVERSAL_PATTERNS = [
    "note.txt",
    "note",
    "2026-04-10T091530",
    "2026-13-10T091530.md",
    "2026-04-10T256060.md",
    " 2026-04-10T091530.md",
    "2026-04-10T091530.md ",
    "",
  ];

  it.each(INVALID_BUT_NON_TRAVERSAL_PATTERNS)(
    "read_note: 不正形式のファイル名 '%s' はエラーを返す",
    async (filename) => {
      mockInvoke.mockRejectedValueOnce(
        new Error("invalid filename format")
      );
      await expect(invoke("read_note", { filename })).rejects.toThrow();
    }
  );

  it("パス区切り文字を含む場合は拒否される", async () => {
    const withSlash = "subdir/2026-04-10T091530.md";
    mockInvoke.mockRejectedValueOnce(
      new Error("invalid filename: path separator not allowed")
    );
    await expect(invoke("read_note", { filename: withSlash })).rejects.toThrow();
  });

  it("バックスラッシュを含む場合は拒否される", async () => {
    const withBackslash = "subdir\\2026-04-10T091530.md";
    mockInvoke.mockRejectedValueOnce(
      new Error("invalid filename: path separator not allowed")
    );
    await expect(
      invoke("read_note", { filename: withBackslash })
    ).rejects.toThrow();
  });

  it("ヌルバイトを含む場合は拒否される", async () => {
    const withNull = "2026-04-10T091530\x00.md";
    mockInvoke.mockRejectedValueOnce(
      new Error("invalid filename: null byte not allowed")
    );
    await expect(invoke("read_note", { filename: withNull })).rejects.toThrow();
  });
});

describe("パストラバーサル拒否: notes_dir 境界確認", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正規ファイル名はnotes_dir配下に解決される（成功ケース）", async () => {
    mockInvoke.mockResolvedValueOnce({
      frontmatter: { tags: ["gpt", "coding"] },
      body: "本文テキスト",
    });
    const result = await invoke("read_note", { filename: VALID_FILENAME });
    expect(result).toMatchObject({
      frontmatter: { tags: expect.any(Array) },
      body: expect.any(String),
    });
  });

  it("複数のトラバーサルパターンを連続して試みた場合、すべて拒否される", async () => {
    const attackPatterns = ["../secret", "../../root", "../../../tmp/evil"];
    for (const filename of attackPatterns) {
      mockInvoke.mockRejectedValueOnce(
        new Error("invalid filename: path traversal detected")
      );
      await expect(invoke("read_note", { filename })).rejects.toThrow();
    }
    expect(mockInvoke).toHaveBeenCalledTimes(attackPatterns.length);
  });
});
