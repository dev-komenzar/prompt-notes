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
// @deliverable: パス解決テスト
import { invoke } from "@tauri-apps/api/core";
import { describe, it, expect } from "vitest";

describe("path resolution via create_note", () => {
  const created: string[] = [];

  afterEach(async () => {
    for (const f of created) {
      await invoke("delete_note", { filename: f }).catch(() => {});
    }
    created.length = 0;
  });

  it("returned path ends with the returned filename", async () => {
    const r = await invoke<{ filename: string; path: string }>("create_note");
    created.push(r.filename);
    expect(r.path.endsWith(r.filename)).toBe(true);
  });

  it("returned path is absolute (starts with /)", async () => {
    const r = await invoke<{ filename: string; path: string }>("create_note");
    created.push(r.filename);
    expect(r.path.startsWith("/")).toBe(true);
  });

  it("path contains expected platform notes directory segment", async () => {
    const r = await invoke<{ filename: string; path: string }>("create_note");
    created.push(r.filename);
    const containsExpected =
      r.path.includes("promptnotes/notes") ||
      r.path.includes("promptnotes\\notes");
    expect(containsExpected).toBe(true);
  });
});

describe("path resolution after settings update", () => {
  it("get_settings returns notes_dir string", async () => {
    const s = await invoke<{ notes_dir: string }>("get_settings");
    expect(typeof s.notes_dir).toBe("string");
    expect(s.notes_dir.length).toBeGreaterThan(0);
  });

  it("notes_dir from settings matches path prefix of created note", async () => {
    const s = await invoke<{ notes_dir: string }>("get_settings");
    const r = await invoke<{ filename: string; path: string }>("create_note");
    await invoke("delete_note", { filename: r.filename }).catch(() => {});

    // normalize trailing slash
    const dir = s.notes_dir.replace(/\/?$/, "/");
    expect(r.path.startsWith(dir) || r.path.replace(/\\/g, "/").startsWith(dir.replace(/\\/g, "/"))).toBe(true);
  });
});
