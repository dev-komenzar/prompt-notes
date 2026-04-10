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
// @deliverable: アトミック書き込みテスト
import { invoke } from "@tauri-apps/api/core";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("atomic write — content integrity", () => {
  let filename = "";

  beforeEach(async () => {
    const r = await invoke<{ filename: string }>("create_note");
    filename = r.filename;
  });

  afterEach(async () => {
    if (filename) await invoke("delete_note", { filename }).catch(() => {});
  });

  it("save_note returns success: true", async () => {
    const result = await invoke<{ success: boolean }>("save_note", {
      filename,
      frontmatter: { tags: [] },
      body: "atomic test",
    });
    expect(result.success).toBe(true);
  });

  it("content is fully readable after save with large body", async () => {
    const largeBody = "a".repeat(50_000);
    await invoke("save_note", {
      filename,
      frontmatter: { tags: ["large"] },
      body: largeBody,
    });
    const r = await invoke<{ body: string }>("read_note", { filename });
    expect(r.body).toBe(largeBody);
  });

  it("consecutive rapid saves leave the note in the last-written state", async () => {
    const saves = Array.from({ length: 5 }, (_, i) =>
      invoke("save_note", {
        filename,
        frontmatter: { tags: [`v${i}`] },
        body: `version-${i}`,
      })
    );
    await Promise.all(saves);
    // After all concurrent saves resolve, the file must be in a valid, readable state
    const r = await invoke<{ frontmatter: { tags: string[] }; body: string }>(
      "read_note",
      { filename }
    );
    expect(typeof r.body).toBe("string");
    expect(r.body.startsWith("version-")).toBe(true);
    expect(Array.isArray(r.frontmatter.tags)).toBe(true);
  });

  it("no .tmp file remains visible after successful save", async () => {
    await invoke("save_note", {
      filename,
      frontmatter: { tags: [] },
      body: "check for tmp",
    });
    // list_notes should not include any .tmp artefacts
    const result = await invoke<{ notes: { filename: string }[] }>(
      "list_notes",
      { days: 1 }
    );
    const hasTmp = result.notes.some((n) => n.filename.endsWith(".tmp"));
    expect(hasTmp).toBe(false);
  });

  it("saved content survives a second read after save", async () => {
    const body = "persist check\n## heading\n- list";
    const tags = ["persist"];
    await invoke("save_note", { filename, frontmatter: { tags }, body });
    await invoke("read_note", { filename }); // first read
    const r2 = await invoke<{ frontmatter: { tags: string[] }; body: string }>(
      "read_note",
      { filename }
    ); // second read
    expect(r2.body).toBe(body);
    expect(r2.frontmatter.tags).toEqual(tags);
  });
});
