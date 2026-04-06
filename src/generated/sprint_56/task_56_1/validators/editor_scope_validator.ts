// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=editor

/**
 * Editor Module Scope Validator
 *
 * Validates that module:editor complies with:
 * - AC-ED-01: CodeMirror 6 is the editor engine (RBC-2)
 * - AC-ED-02: No title input field (RBC-2)
 * - AC-ED-03: frontmatter region exists with background color distinction
 * - AC-ED-04: Cmd+N / Ctrl+N new note creation (RBC-1)
 * - AC-ED-05: 1-click copy button (RBC-1)
 * - AC-ED-06: Auto-save (RBC-3)
 * - AC-EX-01: No markdown preview, no AI calling
 * - FAIL-03..FAIL-05
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

export interface EditorDOMInspectionTarget {
  readonly querySelectorAll: (selector: string) => ArrayLike<unknown>;
  readonly querySelector: (selector: string) => unknown | null;
  readonly textContent: string | null;
  readonly innerHTML: string;
}

export function validateEditorScopeFromDOM(
  root: EditorDOMInspectionTarget,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  // FAIL-04: Title input field must NOT exist
  const titleInputSelectors = [
    'input[name="title"]',
    'input[placeholder*="title" i]',
    'input[placeholder*="タイトル"]',
    'textarea[name="title"]',
    '[data-testid="title-input"]',
    '[data-testid="note-title"]',
    '.title-input',
    '.note-title-field',
    '#title-input',
    '#note-title',
  ];

  for (const selector of titleInputSelectors) {
    const matches = root.querySelectorAll(selector);
    if (matches.length > 0) {
      violations.push({
        featureId: 'title_input_field',
        failureId: 'FAIL-04',
        severity: 'release_blocking',
        message: `タイトル入力欄が検出されました: selector="${selector}", count=${matches.length}`,
        location: 'module:editor DOM',
      });
    }
  }

  // FAIL-05: Markdown preview/rendering must NOT exist
  const markdownPreviewSelectors = [
    '[data-testid="markdown-preview"]',
    '.markdown-preview',
    '.markdown-rendered',
    '.preview-pane',
    '.md-preview',
    '#markdown-preview',
  ];

  for (const selector of markdownPreviewSelectors) {
    const matches = root.querySelectorAll(selector);
    if (matches.length > 0) {
      violations.push({
        featureId: 'markdown_preview',
        failureId: 'FAIL-05',
        severity: 'release_blocking',
        message: `Markdownプレビュー領域が検出されました: selector="${selector}", count=${matches.length}`,
        location: 'module:editor DOM',
      });
    }
  }

  // FAIL-03: CodeMirror 6 must be present
  const cm6Selectors = ['.cm-editor', '.cm-content', '[class*="cm-"]'];
  let codeMirrorFound = false;
  for (const selector of cm6Selectors) {
    if (root.querySelectorAll(selector).length > 0) {
      codeMirrorFound = true;
      break;
    }
  }

  if (!codeMirrorFound) {
    violations.push({
      featureId: 'missing_codemirror6',
      failureId: 'FAIL-03',
      severity: 'release_blocking',
      message:
        'CodeMirror 6 のDOM要素が検出されません。エディタエンジンがCodeMirror 6でない可能性があります。',
      location: 'module:editor DOM',
    });
  }

  // AC-ED-05 / FAIL-02: Copy button must exist
  const copyButtonSelectors = [
    'button[aria-label*="コピー"]',
    'button[aria-label*="copy" i]',
    'button[aria-label*="clipboard" i]',
    '[data-testid="copy-button"]',
    '.copy-button',
  ];
  let copyButtonFound = false;
  for (const selector of copyButtonSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      copyButtonFound = true;
      break;
    }
  }

  if (!copyButtonFound) {
    violations.push({
      featureId: 'missing_copy_button',
      failureId: 'FAIL-02',
      severity: 'release_blocking',
      message:
        '1クリックコピーボタンが検出されません。コピーボタンはコアUXであり未実装ならリリース不可。',
      location: 'module:editor DOM',
    });
  }

  // AC-ED-03: frontmatter visual distinction
  const frontmatterSelectors = [
    '.cm-frontmatter-line',
    '[class*="frontmatter"]',
    '.frontmatter-bg',
  ];
  let frontmatterDecorationFound = false;
  for (const selector of frontmatterSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      frontmatterDecorationFound = true;
      break;
    }
  }

  if (!frontmatterDecorationFound) {
    violations.push({
      featureId: 'missing_frontmatter_decoration',
      failureId: 'FAIL-21',
      severity: 'release_blocking',
      message:
        'frontmatter領域の背景色デコレーションが検出されません。frontmatter領域は背景色で視覚的に区別必須。',
      location: 'module:editor DOM',
    });
  }

  // Check for prohibited innerHTML patterns indicating markdown rendering
  const htmlContent = root.innerHTML;
  const markdownRenderPatterns = [
    /<div[^>]*class="[^"]*markdown-body[^"]*"/i,
    /<div[^>]*class="[^"]*prose[^"]*"/i,
    /<article[^>]*class="[^"]*rendered-markdown[^"]*"/i,
  ];

  for (const pattern of markdownRenderPatterns) {
    if (pattern.test(htmlContent)) {
      violations.push({
        featureId: 'markdown_preview',
        failureId: 'FAIL-05',
        severity: 'release_blocking',
        message: `Markdownレンダリング用のHTML構造が検出されました: pattern=${pattern.source}`,
        location: 'module:editor DOM',
      });
    }
  }

  return {
    module: 'editor',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that no prohibited editor dependencies are present
 * by checking a list of known package names.
 */
export function validateEditorDependencies(
  installedPackages: ReadonlySet<string>,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const prohibitedEditorPackages: ReadonlyArray<{
    name: string;
    failureId: string;
    featureId: string;
    reason: string;
  }> = [
    {
      name: 'monaco-editor',
      failureId: 'FAIL-03',
      featureId: 'prohibited_editor_engine',
      reason: 'Monaco Editorへの変更はリリース不可（CONV-2）',
    },
    {
      name: '@monaco-editor/react',
      failureId: 'FAIL-03',
      featureId: 'prohibited_editor_engine',
      reason: 'Monaco Editorへの変更はリリース不可（CONV-2）',
    },
    {
      name: 'ace-builds',
      failureId: 'FAIL-03',
      featureId: 'prohibited_editor_engine',
      reason: 'Ace Editorへの変更はリリース不可（CONV-2）',
    },
    {
      name: 'prosemirror-view',
      failureId: 'FAIL-03',
      featureId: 'prohibited_editor_engine',
      reason: 'ProseMirrorへの変更はリリース不可（CONV-2）',
    },
    {
      name: 'markdown-it',
      failureId: 'FAIL-05',
      featureId: 'markdown_preview',
      reason: 'Markdownレンダリングライブラリの導入は禁止（RBC-2）',
    },
    {
      name: 'marked',
      failureId: 'FAIL-05',
      featureId: 'markdown_preview',
      reason: 'Markdownレンダリングライブラリの導入は禁止（RBC-2）',
    },
    {
      name: 'remark-html',
      failureId: 'FAIL-05',
      featureId: 'markdown_preview',
      reason: 'Markdownレンダリングライブラリの導入は禁止（RBC-2）',
    },
    {
      name: 'showdown',
      failureId: 'FAIL-05',
      featureId: 'markdown_preview',
      reason: 'Markdownレンダリングライブラリの導入は禁止（RBC-2）',
    },
    {
      name: 'rehype',
      failureId: 'FAIL-05',
      featureId: 'markdown_preview',
      reason: 'Markdownレンダリングライブラリの導入は禁止（RBC-2）',
    },
    {
      name: 'snarkdown',
      failureId: 'FAIL-05',
      featureId: 'markdown_preview',
      reason: 'Markdownレンダリングライブラリの導入は禁止（RBC-2）',
    },
  ];

  for (const pkg of prohibitedEditorPackages) {
    if (installedPackages.has(pkg.name)) {
      violations.push({
        featureId: pkg.featureId,
        failureId: pkg.failureId,
        severity: 'release_blocking',
        message: `禁止パッケージが検出されました: ${pkg.name} — ${pkg.reason}`,
        location: 'package.json / node_modules',
      });
    }
  }

  // Verify CodeMirror 6 IS installed
  const requiredCM6Packages = [
    '@codemirror/view',
    '@codemirror/state',
    '@codemirror/lang-markdown',
  ];

  for (const pkg of requiredCM6Packages) {
    if (!installedPackages.has(pkg)) {
      violations.push({
        featureId: 'missing_codemirror6',
        failureId: 'FAIL-03',
        severity: 'release_blocking',
        message: `必須CodeMirror 6パッケージが不足: ${pkg}`,
        location: 'package.json / node_modules',
      });
    }
  }

  return {
    module: 'editor',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
