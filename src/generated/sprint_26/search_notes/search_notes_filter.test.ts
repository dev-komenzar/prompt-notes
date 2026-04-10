// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `search_notes` のフィルタ組み合わせテスト
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 26

import { invoke } from "@tauri-apps/api/core";
import type { NoteMetadata } from "./types";
import type { SearchParams } from "./types";
import {
  createTestNote,
  deleteTestNote,
  formatDateOffset,
  uniqueTag,
} from "./test_helpers";

// search_notes フィルタ組み合わせテスト
// Tauri IPC invoke('search_notes', ...) を直接呼び出して検証する

describe("search_notes: クエリのみ", () => {
  const tag = uniqueTag("query-only");
  let filename: string;

  beforeAll(async () => {
    filename = await createTestNote({
      tags: [tag],
      body: "This is a unique search phrase for query-only test",
    });
  });

  afterAll(async () => {
    await deleteTestNote(filename);
  });

  it("本文に含まれるクエリで一致するノートを返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: "unique search phrase for query-only",
    } satisfies SearchParams);
    expect(results.some((n) => n.filename === filename)).toBe(true);
  });

  it("本文に含まれないクエリでは空を返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: "XYZZY_NONEXISTENT_STRING_12345",
    } satisfies SearchParams);
    expect(results.every((n) => n.filename !== filename)).toBe(true);
  });

  it("大文字小文字を区別しない", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: "UNIQUE SEARCH PHRASE",
    } satisfies SearchParams);
    expect(results.some((n) => n.filename === filename)).toBe(true);
  });
});

describe("search_notes: タグフィルタのみ", () => {
  const tagA = uniqueTag("tag-a");
  const tagB = uniqueTag("tag-b");
  let filenameA: string;
  let filenameB: string;
  let filenameAB: string;

  beforeAll(async () => {
    filenameA = await createTestNote({ tags: [tagA], body: "note with tag A" });
    filenameB = await createTestNote({ tags: [tagB], body: "note with tag B" });
    filenameAB = await createTestNote({
      tags: [tagA, tagB],
      body: "note with both tags",
    });
  });

  afterAll(async () => {
    await Promise.all([
      deleteTestNote(filenameA),
      deleteTestNote(filenameB),
      deleteTestNote(filenameAB),
    ]);
  });

  it("単一タグで一致するノートのみ返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tagA],
    } satisfies SearchParams);
    const filenames = results.map((n) => n.filename);
    expect(filenames).toContain(filenameA);
    expect(filenames).toContain(filenameAB);
    expect(filenames).not.toContain(filenameB);
  });

  it("AND条件: 両方のタグを持つノートのみ返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tagA, tagB],
    } satisfies SearchParams);
    const filenames = results.map((n) => n.filename);
    expect(filenames).toContain(filenameAB);
    expect(filenames).not.toContain(filenameA);
    expect(filenames).not.toContain(filenameB);
  });

  it("存在しないタグでは空を返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: ["NONEXISTENT_TAG_XYZZY_99999"],
    } satisfies SearchParams);
    expect(results.every((n) => n.filename !== filenameA)).toBe(true);
    expect(results.every((n) => n.filename !== filenameB)).toBe(true);
  });
});

describe("search_notes: 日付フィルタのみ", () => {
  let filenameRecent: string;

  beforeAll(async () => {
    filenameRecent = await createTestNote({
      tags: [],
      body: "recent note for date filter test",
    });
  });

  afterAll(async () => {
    await deleteTestNote(filenameRecent);
  });

  it("date_from〜date_to の範囲内のノートを返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      date_from: formatDateOffset(-1),
      date_to: formatDateOffset(0),
    } satisfies SearchParams);
    expect(results.some((n) => n.filename === filenameRecent)).toBe(true);
  });

  it("範囲外のノートを返さない", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      date_from: formatDateOffset(-30),
      date_to: formatDateOffset(-8),
    } satisfies SearchParams);
    expect(results.every((n) => n.filename !== filenameRecent)).toBe(true);
  });

  it("直近7日間フィルタ: デフォルト想定範囲で本日ノートが含まれる", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      date_from: formatDateOffset(-7),
      date_to: formatDateOffset(0),
    } satisfies SearchParams);
    expect(results.some((n) => n.filename === filenameRecent)).toBe(true);
  });

  it("境界値: ちょうど7日前は含まれ、8日前は含まれない", async () => {
    const boundary7 = formatDateOffset(-7);
    const boundary8 = formatDateOffset(-8);
    const today = formatDateOffset(0);

    const results7: NoteMetadata[] = await invoke("search_notes", {
      date_from: boundary7,
      date_to: today,
    } satisfies SearchParams);

    const results8: NoteMetadata[] = await invoke("search_notes", {
      date_from: boundary8,
      date_to: formatDateOffset(-8),
    } satisfies SearchParams);

    // 7日前から今日の範囲: 本日作成ノートが含まれる
    expect(results7.some((n) => n.filename === filenameRecent)).toBe(true);
    // 8日前の単日: 本日作成ノートは含まれない
    expect(results8.every((n) => n.filename !== filenameRecent)).toBe(true);
  });
});

describe("search_notes: クエリ + タグ 組み合わせ", () => {
  const tag = uniqueTag("combo-qt");
  let filenameMatch: string;
  let filenameTagOnly: string;
  let filenameQueryOnly: string;

  beforeAll(async () => {
    filenameMatch = await createTestNote({
      tags: [tag],
      body: "combo_qt_keyword matching note",
    });
    filenameTagOnly = await createTestNote({
      tags: [tag],
      body: "this note has the tag but not the keyword",
    });
    filenameQueryOnly = await createTestNote({
      tags: [],
      body: "combo_qt_keyword without the tag",
    });
  });

  afterAll(async () => {
    await Promise.all([
      deleteTestNote(filenameMatch),
      deleteTestNote(filenameTagOnly),
      deleteTestNote(filenameQueryOnly),
    ]);
  });

  it("クエリとタグ両方に一致するノートのみ返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: "combo_qt_keyword",
      tags: [tag],
    } satisfies SearchParams);
    const filenames = results.map((n) => n.filename);
    expect(filenames).toContain(filenameMatch);
    expect(filenames).not.toContain(filenameTagOnly);
    expect(filenames).not.toContain(filenameQueryOnly);
  });
});

describe("search_notes: クエリ + 日付 組み合わせ", () => {
  const keyword = "combo_qd_unique_phrase_99";
  let filenameRecent: string;

  beforeAll(async () => {
    filenameRecent = await createTestNote({
      tags: [],
      body: `${keyword} in a recent note`,
    });
  });

  afterAll(async () => {
    await deleteTestNote(filenameRecent);
  });

  it("クエリと日付範囲両方に一致するノートを返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: keyword,
      date_from: formatDateOffset(-1),
      date_to: formatDateOffset(0),
    } satisfies SearchParams);
    expect(results.some((n) => n.filename === filenameRecent)).toBe(true);
  });

  it("日付範囲外ではクエリ一致でも返さない", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: keyword,
      date_from: formatDateOffset(-30),
      date_to: formatDateOffset(-8),
    } satisfies SearchParams);
    expect(results.every((n) => n.filename !== filenameRecent)).toBe(true);
  });
});

describe("search_notes: タグ + 日付 組み合わせ", () => {
  const tag = uniqueTag("combo-td");
  let filenameRecent: string;

  beforeAll(async () => {
    filenameRecent = await createTestNote({
      tags: [tag],
      body: "tag and date combo test note",
    });
  });

  afterAll(async () => {
    await deleteTestNote(filenameRecent);
  });

  it("タグと日付範囲両方に一致するノートを返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
      date_from: formatDateOffset(-1),
      date_to: formatDateOffset(0),
    } satisfies SearchParams);
    expect(results.some((n) => n.filename === filenameRecent)).toBe(true);
  });

  it("日付範囲外ではタグ一致でも返さない", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
      date_from: formatDateOffset(-30),
      date_to: formatDateOffset(-8),
    } satisfies SearchParams);
    expect(results.every((n) => n.filename !== filenameRecent)).toBe(true);
  });
});

describe("search_notes: クエリ + タグ + 日付 全組み合わせ", () => {
  const tag = uniqueTag("combo-all");
  const keyword = "combo_all_unique_phrase_77";
  let filenameAll: string;
  let filenameMissingTag: string;
  let filenameMissingKeyword: string;

  beforeAll(async () => {
    filenameAll = await createTestNote({
      tags: [tag],
      body: `${keyword} full match`,
    });
    filenameMissingTag = await createTestNote({
      tags: [],
      body: `${keyword} no tag`,
    });
    filenameMissingKeyword = await createTestNote({
      tags: [tag],
      body: "has tag but not the keyword",
    });
  });

  afterAll(async () => {
    await Promise.all([
      deleteTestNote(filenameAll),
      deleteTestNote(filenameMissingTag),
      deleteTestNote(filenameMissingKeyword),
    ]);
  });

  it("全条件に一致するノートのみ返す", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      query: keyword,
      tags: [tag],
      date_from: formatDateOffset(-1),
      date_to: formatDateOffset(0),
    } satisfies SearchParams);
    const filenames = results.map((n) => n.filename);
    expect(filenames).toContain(filenameAll);
    expect(filenames).not.toContain(filenameMissingTag);
    expect(filenames).not.toContain(filenameMissingKeyword);
  });
});

describe("search_notes: 結果の順序", () => {
  const tag = uniqueTag("order");
  const filenames: string[] = [];

  beforeAll(async () => {
    // 順次作成して created_at 順序を保証
    for (let i = 0; i < 3; i++) {
      const fn = await createTestNote({
        tags: [tag],
        body: `order test note ${i}`,
      });
      filenames.push(fn);
      await new Promise((r) => setTimeout(r, 1100)); // 1秒以上待機してタイムスタンプを分離
    }
  }, 30000);

  afterAll(async () => {
    await Promise.all(filenames.map(deleteTestNote));
  });

  it("created_at 降順で返される", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
    } satisfies SearchParams);
    const matched = results.filter((n) => filenames.includes(n.filename));
    expect(matched.length).toBe(3);
    for (let i = 0; i < matched.length - 1; i++) {
      expect(matched[i].created_at >= matched[i + 1].created_at).toBe(true);
    }
  });
});

describe("search_notes: NoteMetadata の構造検証", () => {
  const tag = uniqueTag("meta-check");
  let filename: string;

  beforeAll(async () => {
    filename = await createTestNote({
      tags: [tag, "extra-tag"],
      body: "metadata structure verification note",
    });
  });

  afterAll(async () => {
    await deleteTestNote(filename);
  });

  it("NoteMetadata の必須フィールドが揃っている", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
    } satisfies SearchParams);
    const note = results.find((n) => n.filename === filename);
    expect(note).toBeDefined();
    expect(typeof note!.filename).toBe("string");
    expect(Array.isArray(note!.tags)).toBe(true);
    expect(typeof note!.created_at).toBe("string");
    expect(typeof note!.body_preview).toBe("string");
  });

  it("ファイル名が YYYY-MM-DDTHHMMSS.md 形式である", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
    } satisfies SearchParams);
    const note = results.find((n) => n.filename === filename);
    expect(note!.filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}\.md$/);
  });

  it("tags フィールドに frontmatter のタグが含まれる", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
    } satisfies SearchParams);
    const note = results.find((n) => n.filename === filename);
    expect(note!.tags).toContain(tag);
    expect(note!.tags).toContain("extra-tag");
  });

  it("body_preview が空でない", async () => {
    const results: NoteMetadata[] = await invoke("search_notes", {
      tags: [tag],
    } satisfies SearchParams);
    const note = results.find((n) => n.filename === filename);
    expect(note!.body_preview.length).toBeGreaterThan(0);
  });
});
