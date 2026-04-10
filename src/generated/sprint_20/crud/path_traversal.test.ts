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
// @deliverable: パストラバーサル拒否テスト
import { invoke } from "@tauri-apps/api/core";
import { describe, it, expect } from "vitest";

const TRAVERSAL_FILENAMES = [
  "../evil.md",
  "../../etc/passwd",
  "subdir/note.md",
  "note.md/../../../etc/shadow",
  "2026-01-01T000000.md/../../secret",
  "%2F%2Fetc%2Fpasswd",
  "2026-01-01T000000.md\x00evil",
];

describe("path traversal rejection — read_note", () => {
  for (const filename of TRAVERSAL_FILENAMES) {
    it(`rejects filename: ${JSON.stringify(filename)}`, async () => {
      await expect(invoke("read_note", { filename })).rejects.toBeTruthy();
    });
  }
});

describe("path traversal rejection — save_note", () => {
  for (const filename of TRAVERSAL_FILENAMES) {
    it(`rejects filename: ${JSON.stringify(filename)}`, async () => {
      await expect(
        invoke("save_note", { filename, frontmatter: { tags: [] }, body: "x" })
      ).rejects.toBeTruthy();
    });
  }
});

describe("path traversal rejection — delete_note", () => {
  for (const filename of TRAVERSAL_FILENAMES) {
    it(`rejects filename: ${JSON.stringify(filename)}`, async () => {
      await expect(invoke("delete_note", { filename })).rejects.toBeTruthy();
    });
  }
});

describe("valid filename format is accepted by create_note", () => {
  it("filename returned by create_note passes read_note without traversal error", async () => {
    const { filename } = await invoke<{ filename: string }>("create_note");
    // must not throw a traversal-related error
    const r = await invoke<{ body: string }>("read_note", { filename });
    expect(typeof r.body).toBe("string");
    await invoke("delete_note", { filename }).catch(() => {});
  });
});
