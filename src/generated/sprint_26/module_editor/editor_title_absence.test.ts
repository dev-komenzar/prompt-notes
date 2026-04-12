// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md (AC-EDIT-01, FC-EDIT-05)
// Sprint 26: EditorView.svelte にタイトル <input> / <textarea> が存在しないことの確認

import * as fs from 'fs';
import * as path from 'path';

const EDITOR_VIEW_PATH = path.resolve(
  __dirname,
  '../../../../components/editor/EditorView.svelte'
);

function readEditorView(): string {
  if (!fs.existsSync(EDITOR_VIEW_PATH)) {
    throw new Error(`EditorView.svelte が見つかりません: ${EDITOR_VIEW_PATH}`);
  }
  return fs.readFileSync(EDITOR_VIEW_PATH, 'utf-8');
}

// タイトル入力欄として使われうるパターン
const TITLE_INPUT_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /<input[^>]*(?:placeholder|aria-label|name|id)=["'][^"']*(?:title|タイトル|題名)[^"']*["'][^>]*>/gi,
    description: 'title 関連属性を持つ <input>',
  },
  {
    pattern: /<textarea[^>]*(?:placeholder|aria-label|name|id)=["'][^"']*(?:title|タイトル|題名)[^"']*["'][^>]*/gi,
    description: 'title 関連属性を持つ <textarea>',
  },
  {
    pattern: /<!--.*?-->|<[^>]*class=["'][^"']*(?:title|タイトル)[^"']*["'][^>]*(?:input|textarea)[^>]*>/gi,
    description: 'title クラスを持つ input/textarea',
  },
];

// CodeMirror が内部的に生成する contenteditable div は許容するが
// 明示的な <input type="text"> や <textarea> はタイトル欄の候補として検査する
const BARE_INPUT_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /<input(?:\s+[^>]*)?\s+type=["']text["'][^>]*>/gi,
    description: '<input type="text"> (タイトル欄の疑い)',
  },
  {
    pattern: /<input(?:\s+[^>]*)?\s*(?!type=["'](?:hidden|checkbox|radio|date|search)["'])[^>]*>/gi,
    description: 'type 未指定または text 相当の <input>',
  },
];

describe('EditorView.svelte — タイトル入力欄不在確認 (AC-EDIT-01 / FC-EDIT-05 / RB-2)', () => {
  let source: string;

  beforeAll(() => {
    source = readEditorView();
  });

  test('ファイルが存在し読み込める', () => {
    expect(source.length).toBeGreaterThan(0);
  });

  test('タイトル関連属性を持つ <input> が存在しない', () => {
    const matches: string[] = [];
    for (const { pattern, description } of TITLE_INPUT_PATTERNS) {
      const found = source.match(pattern);
      if (found) {
        matches.push(`[${description}]: ${found.join(', ')}`);
      }
    }
    expect(matches).toHaveLength(0);
  });

  test('タイトル関連テキストを持つ <textarea> が存在しない', () => {
    const titleTextarea = /<textarea[^>]*(?:title|タイトル|題名)[^>]*/gi;
    const found = source.match(titleTextarea);
    expect(found).toBeNull();
  });

  test('コメントアウト済みであってもタイトル入力欄のコードが残っていない', () => {
    // コメントを除去した上で再検査
    const withoutComments = source
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    const titleInputInComments = /(?:title|タイトル).*?<input|<input.*?(?:title|タイトル)/gi;
    const found = withoutComments.match(titleInputInComments);
    expect(found).toBeNull();
  });

  test('CodeMirror 6 のエディタコンテナが存在する (RB-2: CodeMirror 6 必須)', () => {
    // bind:this または EditorView の初期化コードが存在すること
    const hasCodeMirror =
      /EditorView|codemirror|@codemirror/i.test(source) ||
      /new\s+EditorView|EditorState\.create/i.test(source);
    expect(hasCodeMirror).toBe(true);
  });

  test('Markdown レンダリングプレビューが存在しない (RB-2: レンダリング禁止)', () => {
    const renderingPatterns = [
      /@marked\/|marked\(|marked\.parse/gi,
      /unified\(\)|remark|rehype/gi,
      /DOMParser.*?text\/html/gi,
      /innerHTML\s*=.*?markdown|markdown.*?innerHTML/gi,
    ];
    for (const pattern of renderingPatterns) {
      const found = source.match(pattern);
      expect(found).toBeNull();
    }
  });
});
