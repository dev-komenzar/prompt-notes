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
// @deliverable: frontmatter パーステスト（IPC ラウンドトリップ検証）
import { invoke } from "@tauri-apps/api/core";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("frontmatter round-trip via save_note / read_note", () => {
  let filename = "";

  beforeEach(async () => {
    const r = await invoke<{ filename: string }>("create_note");
    filename = r.filename;
  });

  afterEach(async () => {
    if (filename) await invoke("delete_note", { filename }).catch(() => {});
  });

  it("serializes and deserializes an empty tags array", async () => {
    await invoke("save_note", {
      filename,
      frontmatter: { tags: [] },
      body: "",
    });
    const r = await invoke<{ frontmatter: { tags: string[] } }>("read_note", {
      filename,
    });
    expect(r.frontmatter.tags).toEqual([]);
  });

  it("preserves multiple tags in order", async () => {
    const tags = ["alpha", "beta", "gamma"];
    await invoke("save_note", { filename, frontmatter: { tags }, body: "" });
    const r = await invoke<{ frontmatter: { tags: string[] } }>("read_note", {
      filename,
    });
    expect(r.frontmatter.tags).toEqual(tags);
  });

  it("handles tags containing special characters", async () => {
    const tags = ["日本語", "prompt-design", "GPT4"];
    await invoke("save_note", { filename, frontmatter: { tags }, body: "" });
    const r = await invoke<{ frontmatter: { tags: string[] } }>("read_note", {
      filename,
    });
    expect(r.frontmatter.tags).toEqual(tags);
  });

  it("does not inject extra fields beyond tags", async () => {
    await invoke("save_note", {
      filename,
      frontmatter: { tags: ["only"] },
      body: "content",
    });
    const r = await invoke<{ frontmatter: Record<string, unknown> }>(
      "read_note",
      { filename }
    );
    const keys = Object.keys(r.frontmatter).filter((k) => k !== "tags");
    // serde flatten may carry extra user fields; core auto-injected keys must be absent
    expect(keys).not.toContain("title");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("updated_at");
    expect(keys).not.toContain("id");
  });

  it("body is separated from frontmatter on round-trip", async () => {
    const body = "This is the body\n# heading\n- item";
    await invoke("save_note", {
      filename,
      frontmatter: { tags: ["sep"] },
      body,
    });
    const r = await invoke<{ body: string }>("read_note", { filename });
    expect(r.body).toBe(body);
    expect(r.body).not.toContain("---");
    expect(r.body).not.toContain("tags:");
  });

  it("empty body is stored and returned as empty string", async () => {
    await invoke("save_note", {
      filename,
      frontmatter: { tags: [] },
      body: "",
    });
    const r = await invoke<{ body: string }>("read_note", { filename });
    expect(r.body).toBe("");
  });
});
