// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 62-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 62
// @task: 62-1 全モジュール 非機能要件計測

import type { BenchmarkSuite, BenchmarkResult } from './types';

function statusLabel(passed: boolean): string {
  return passed ? 'PASS' : 'FAIL';
}

function formatRow(r: BenchmarkResult): string {
  const measured = r.measured < 0 ? 'N/A' : `${r.measured} ${r.unit}`;
  return `| ${r.name.padEnd(32)} | ${r.target.padEnd(28)} | ${measured.padEnd(22)} | ${statusLabel(r.passed)} |`;
}

/**
 * Markdown テーブル形式のレポート文字列を生成する。
 * CLAUDE.md のコミットメッセージテンプレートに埋め込むために使用する。
 */
export function generateMarkdownReport(suite: BenchmarkSuite): string {
  const header = [
    `## Sprint 62 非機能要件計測結果`,
    ``,
    `実行日時: ${suite.runAt}`,
    `総合判定: **${suite.allPassed ? 'PASS' : 'FAIL'}**`,
    ``,
    `| 計測項目                         | 目標値                       | 実測値                    | 判定 |`,
    `|----------------------------------|------------------------------|---------------------------|------|`,
  ];

  const rows = suite.results.map(formatRow);
  const footer = [``, `---`, `生成コマンド: codd implement --sprint 62`];

  return [...header, ...rows, ...footer].join('\n');
}

/**
 * JSON 形式で出力する（CI アーティファクト保存用）。
 */
export function generateJsonReport(suite: BenchmarkSuite): string {
  return JSON.stringify(suite, null, 2);
}

/**
 * 失敗した項目のみを抽出して返す。
 */
export function extractFailures(suite: BenchmarkSuite): BenchmarkResult[] {
  return suite.results.filter((r) => !r.passed);
}

/**
 * フロントエンドの DOM に結果を挿入するためのシンプルな HTML 断片を生成する。
 * XSS を避けるためすべての値をエスケープする。
 */
export function generateHtmlSummary(suite: BenchmarkSuite): string {
  function esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const rows = suite.results
    .map((r) => {
      const measured = r.measured < 0 ? 'N/A' : `${r.measured} ${esc(r.unit)}`;
      const cls = r.passed ? 'pass' : 'fail';
      return `<tr class="${cls}"><td>${esc(r.name)}</td><td>${esc(r.target)}</td><td>${measured}</td><td>${statusLabel(r.passed)}</td></tr>`;
    })
    .join('\n');

  const overallCls = suite.allPassed ? 'pass' : 'fail';

  return `
<div class="benchmark-report">
  <h3>Sprint 62 Non-functional Requirements — <span class="${overallCls}">${suite.allPassed ? 'PASS' : 'FAIL'}</span></h3>
  <table>
    <thead><tr><th>Item</th><th>Target</th><th>Measured</th><th>Result</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="run-at">Run at: ${esc(suite.runAt)}</p>
</div>`.trim();
}
