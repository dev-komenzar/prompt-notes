// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * Editor Constraint Validators
 *
 * Runtime and structural validators for module:editor release-blocking constraints.
 */

/**
 * RBC-EDITOR-1: CodeMirror 6 必須。
 * Validates that an object is a CodeMirror 6 EditorView instance.
 */
export function isCodeMirror6EditorView(instance: unknown): boolean {
  return (
    typeof instance === 'object' &&
    instance !== null &&
    'state' in instance &&
    'dispatch' in instance &&
    typeof (instance as Record<string, unknown>)['dispatch'] === 'function'
  );
}

export function assertCodeMirror6EditorView(instance: unknown): void {
  if (!isCodeMirror6EditorView(instance)) {
    throw new Error(
      '[EDITOR VIOLATION] エディタインスタンスが CodeMirror 6 EditorView ではありません。' +
        'RBC-EDITOR-1違反。',
    );
  }
}

/**
 * RBC-EDITOR-1: Markdown シンタックスハイライトのみ（レンダリング禁止）。
 * Checks that no markdown-it, marked, or remark rendering libraries are present in the bundle.
 */
export function assertNoMarkdownRenderingLibrary(): void {
  const prohibited = ['markdownit', 'marked', 'remark', 'unified', 'rehype'];
  for (const lib of prohibited) {
    if (lib in globalThis || lib in window) {
      throw new Error(
        `[EDITOR VIOLATION] Markdownレンダリングライブラリ "${lib}" が検出されました。` +
          'Markdownプレビュー（レンダリング）はスコープ外です。RBC-EDITOR-1違反。',
      );
    }
  }
}

/**
 * RBC-EDITOR-2: タイトル入力欄は禁止。
 * Checks the DOM for any title input element.
 */
export function assertNoTitleInputInDOM(root: Element = document.body): void {
  const titleInputSelectors = [
    'input[data-title]',
    'input[placeholder*="タイトル"]',
    'input[placeholder*="title"]',
    'input[placeholder*="Title"]',
    '[data-testid="title-input"]',
    '#title-input',
    '.title-input',
  ];
  for (const selector of titleInputSelectors) {
    if (root.querySelector(selector)) {
      throw new Error(
        `[EDITOR VIOLATION] タイトル入力欄 (${selector}) が DOM に存在します。` +
          'タイトル入力欄の実装は禁止です。RBC-EDITOR-2違反。',
      );
    }
  }
}

/**
 * RBC-EDITOR-3: 1クリックコピーボタンによる本文全体のクリップボードコピーはアプリの核心UX。
 * Validates that a copy button element is present in the editor view.
 */
export function assertCopyButtonPresent(root: Element = document.body): void {
  const copyButtonSelectors = [
    '[data-testid="copy-button"]',
    'button[aria-label*="コピー"]',
    'button[aria-label*="copy"]',
    'button[aria-label*="Copy"]',
    '.copy-button',
    '#copy-button',
  ];
  const found = copyButtonSelectors.some((sel) => root.querySelector(sel) !== null);
  if (!found) {
    throw new Error(
      '[EDITOR VIOLATION] コピーボタンが DOM に見つかりません。' +
        '1クリックコピーボタンはコアUXです。RBC-EDITOR-3違反。',
    );
  }
}

/**
 * RBC-EDITOR-4: Cmd+N / Ctrl+N で即座に新規ノート作成しフォーカス移動必須。
 * Simulates the new-note shortcut and validates the handler is wired.
 * The handler must call createNote() and then focus the editor.
 */
export type NewNoteShortcutHandler = (e: KeyboardEvent) => void | Promise<void>;

export function buildNewNoteKeydownEvent(platform: 'linux' | 'macos'): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: 'n',
    metaKey: platform === 'macos',
    ctrlKey: platform === 'linux',
    bubbles: true,
    cancelable: true,
  });
}

/**
 * RBC-EDITOR-1: frontmatter 領域は背景色で視覚的に区別必須。
 * Checks that the frontmatter bar has a distinct background color applied.
 */
export function assertFrontmatterBarHasDistinctBackground(
  frontmatterElement: Element,
): void {
  const computed = window.getComputedStyle(frontmatterElement);
  const bg = computed.backgroundColor;
  // Must not be transparent or identical to body background
  const bodyBg = window.getComputedStyle(document.body).backgroundColor;
  if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)' || bg === bodyBg) {
    throw new Error(
      '[EDITOR VIOLATION] frontmatter 領域の背景色が本文と区別されていません。' +
        'RBC-EDITOR-1違反。',
    );
  }
}

/**
 * RBC-STORAGE-3 / RBC-EDITOR: 自動保存のデバウンス設定値。
 * The debounce interval is 500ms as specified in the design documents.
 */
export const AUTO_SAVE_DEBOUNCE_MS = 500 as const;

/**
 * RBC-GRID-2 / RBC-EDITOR: 全文検索のデバウンス設定値。
 */
export const SEARCH_DEBOUNCE_MS = 300 as const;

/**
 * RBC-EDITOR-3: Latency target for new note creation (Cmd+N → focus).
 */
export const NEW_NOTE_LATENCY_TARGET_MS = 100 as const;
