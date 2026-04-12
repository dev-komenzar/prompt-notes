// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd implement --sprint 47
// sprint-47 verification target: confirm absence of localStorage / sessionStorage / IndexedDB
// writes in all frontend source files.
//
// Usage (Node.js, run from repo root):
//   npx tsx src/generated/sprint_47/module_settings/storage-api-guard.ts
//
// Exit code 0 = clean, 1 = violations found.

import * as fs from 'fs';
import * as path from 'path';

// Patterns that indicate forbidden browser storage access.
// Writing OR reading is flagged — settings must go through Rust backend exclusively.
const FORBIDDEN_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\blocalStorage\s*\[|\blocalStorage\s*\./g, label: 'localStorage' },
  { pattern: /\bsessionStorage\s*\[|\bsessionStorage\s*\./g, label: 'sessionStorage' },
  { pattern: /\bindexedDB\s*\[|\bindexedDB\s*\./g, label: 'indexedDB' },
  { pattern: /\bwindow\.localStorage\b/g, label: 'window.localStorage' },
  { pattern: /\bwindow\.sessionStorage\b/g, label: 'window.sessionStorage' },
  { pattern: /\bwindow\.indexedDB\b/g, label: 'window.indexedDB' },
  { pattern: /\bnew\s+IDBFactory\b/g, label: 'new IDBFactory' },
  { pattern: /\.setItem\s*\(/g, label: '.setItem() [potential Storage write]' },
  { pattern: /\.createObjectStore\s*\(/g, label: '.createObjectStore() [IndexedDB write]' },
];

// File extensions to scan in the frontend source tree.
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.svelte', '.js', '.mjs']);

// Directories to skip.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'target',
  'src-tauri',
  // skip this generated file's own directory to avoid self-match on pattern literals
  path.relative(process.cwd(), path.dirname(__filename)),
]);

interface Violation {
  file: string;
  line: number;
  column: number;
  label: string;
  text: string;
}

function scanFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];

    // Skip single-line comments
    const trimmed = lineText.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }

    for (const { pattern, label } of FORBIDDEN_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        violations.push({
          file: filePath,
          line: lineIdx + 1,
          column: match.index + 1,
          label,
          text: lineText.trim(),
        });
      }
    }
  }

  return violations;
}

function scanDirectory(dir: string): Violation[] {
  const violations: Violation[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(process.cwd(), fullPath);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !SKIP_DIRS.has(relative)) {
        violations.push(...scanDirectory(fullPath));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCAN_EXTENSIONS.has(ext)) {
        violations.push(...scanFile(fullPath));
      }
    }
  }

  return violations;
}

function main(): void {
  const srcDir = path.resolve(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) {
    console.error(`[storage-api-guard] src/ directory not found: ${srcDir}`);
    process.exit(1);
  }

  console.log(`[storage-api-guard] Scanning ${srcDir} for forbidden browser storage APIs...`);
  const violations = scanDirectory(srcDir);

  if (violations.length === 0) {
    console.log('[storage-api-guard] ✓ No localStorage / sessionStorage / IndexedDB usage detected.');
    process.exit(0);
  }

  console.error(`[storage-api-guard] ✗ ${violations.length} violation(s) found:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.column}  [${v.label}]`);
    console.error(`    ${v.text}\n`);
  }

  console.error(
    '[storage-api-guard] All settings persistence must go through invoke("set_config") via the Rust backend.',
  );
  process.exit(1);
}

main();
