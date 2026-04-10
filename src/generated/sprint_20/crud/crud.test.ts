// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: 全 CRUD 操作
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 20
// @task: 20-1
// @deliverable: 全 CRUD 操作テスト（IPC 統合レイヤー）
import { invoke } from "@tauri-apps/api/core";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

describe("create_note", () => {
  const created: string[] = [];

  afterEach(async () => {
    for (const filename of created) {
      try {
        await invoke("delete_note", { filename });
      } catch {
        // ignore cleanup errors
      }
    }
    created.length = 0;
  });

  it("returns filename matching YYYY-MM-DDTHHMMSS.md", async () => {
    const result = await invoke<{ filename: string; path: string }>(
      "create_note"
    );
    created.push(result.filename);
    expect(result.filename).toMatch(FILENAME_REGEX);
  });

  it("returns a non-empty path", async () => {
    const result = await invoke<{ filename: string; path: string }>(
      "create_note"
    );
    created.push(result.filename);
    expect(result.path.length).toBeGreaterThan(0);
  });

  it("creates distinct filenames on successive calls", async () => {
    const a = await invoke<{ filename: string }>("create_note");
    await new Promise((r) => setTimeout(r, 1100));
    const b = await invoke<{ filename: string }>("create_note");
    created.push(a.filename, b.filename);
    expect(a.filename).not.toBe(b.filename);
  });
});

describe("read_note", () => {
  let filename = "";

  beforeEach(async () => {
    const r = await invoke<{ filename: string }>("create_note");
    filename = r.filename;
  });

  afterEach(async () => {
    if (filename) await invoke("delete_note", { filename }).catch(() => {});
  });

  it("returns empty body and empty tags for a fresh note", async () => {
    const result = await invoke<{
      frontmatter: { tags: string[] };
      body: string;
    }>("read_note", { filename });
    expect(result.frontmatter.tags).toEqual([]);
    expect(typeof result.body).toBe("string");
  });

  it("throws for a non-existent filename", async () => {
    await expect(
      invoke("read_note", { filename: "9999-01-01T000000.md" })
    ).rejects.toBeTruthy();
  });
});

describe("save_note / read_note round-trip", () => {
  let filename = "";

  beforeEach(async () => {
    const r = await invoke<{ filename: string }>("create_note");
    filename = r.filename;
  });

  afterEach(async () => {
    if (filename) await invoke("delete_note", { filename }).catch(() => {});
  });

  it("persists body text", async () => {
    const body = "Hello, PromptNotes!";
    await invoke("save_note", { filename, frontmatter: { tags: [] }, body });
    const result = await invoke<{ body: string }>("read_note", { filename });
    expect(result.body).toBe(body);
  });

  it("persists tags array", async () => {
    const tags = ["gpt", "coding"];
    await invoke("save_note", {
      filename,
      frontmatter: { tags },
      body: "body",
    });
    const result = await invoke<{ frontmatter: { tags: string[] } }>(
      "read_note",
      { filename }
    );
    expect(result.frontmatter.tags).toEqual(tags);
  });

  it("overwrites previous content on second save", async () => {
    await invoke("save_note", {
      filename,
      frontmatter: { tags: ["old"] },
      body: "old body",
    });
    await invoke("save_note", {
      filename,
      frontmatter: { tags: ["new"] },
      body: "new body",
    });
    const result = await invoke<{
      frontmatter: { tags: string[] };
      body: string;
    }>("read_note", { filename });
    expect(result.body).toBe("new body");
    expect(result.frontmatter.tags).toEqual(["new"]);
  });
});

describe("delete_note", () => {
  it("removes the file so read_note subsequently throws", async () => {
    const { filename } = await invoke<{ filename: string }>("create_note");
    await invoke("save_note", {
      filename,
      frontmatter: { tags: [] },
      body: "to be deleted",
    });
    await invoke("delete_note", { filename });
    await expect(invoke("read_note", { filename })).rejects.toBeTruthy();
  });

  it("throws when deleting a non-existent note", async () => {
    await expect(
      invoke("delete_note", { filename: "9999-12-31T235959.md" })
    ).rejects.toBeTruthy();
  });
});

describe("list_notes", () => {
  const created: string[] = [];

  afterEach(async () => {
    for (const f of created) {
      await invoke("delete_note", { f }).catch(() => {});
    }
    created.length = 0;
  });

  it("returns an array", async () => {
    const result = await invoke<{ notes: unknown[] }>("list_notes", {});
    expect(Array.isArray(result.notes)).toBe(true);
  });

  it("includes a just-created note in results with days=1", async () => {
    const { filename } = await invoke<{ filename: string }>("create_note");
    created.push(filename);
    await invoke("save_note", {
      filename,
      frontmatter: { tags: ["test"] },
      body: "list test body",
    });
    const result = await invoke<{ notes: { filename: string }[] }>(
      "list_notes",
      { days: 1 }
    );
    const found = result.notes.some((n) => n.filename === filename);
    expect(found).toBe(true);
  });
});
