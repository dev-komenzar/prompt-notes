// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 53
import { Page } from '@playwright/test';

/** macOS: Cmd+N、Linux: Ctrl+N を送出する (RB-1: AC-EDIT-03) */
export async function pressNewNote(page: Page): Promise<void> {
  const key = process.platform === 'darwin' ? 'Meta+n' : 'Control+n';
  await page.keyboard.press(key);
}

/** macOS: Cmd+Z、Linux: Ctrl+Z を送出する */
export async function pressUndo(page: Page): Promise<void> {
  const key = process.platform === 'darwin' ? 'Meta+z' : 'Control+z';
  await page.keyboard.press(key);
}

/**
 * CodeMirror 6 の編集可能エリア (.cm-content) にテキストを入力する。
 * CodeMirror 6 は contenteditable="true" の div を持つ。
 */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.type(text);
}

/** CodeMirror 6 エディタの現在のドキュメント内容を取得する */
export async function getEditorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const editorEl = document.querySelector('.cm-editor') as HTMLElement & { __cm?: { state: { doc: { toString(): string } } } };
    // CodeMirror 6 は EditorView インスタンスを DOM 要素に保持する
    const view = (editorEl as unknown as { __cm_view?: { state: { doc: { toString(): string } } } }).__cm_view;
    if (view) return view.state.doc.toString();
    // フォールバック: contenteditable の innerText
    const content = document.querySelector('.cm-content');
    return content ? (content as HTMLElement).innerText : '';
  });
}
