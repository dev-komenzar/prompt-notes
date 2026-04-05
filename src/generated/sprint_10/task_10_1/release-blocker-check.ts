// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:10 task:10-1 module:ci-pipeline
// Design refs: test:acceptance_criteria §3, design:system-design §1
// Convention: All release-blocking constraints must be verified in CI

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { ReleaseBlocker, ReleaseBlockerResult } from "./types";

function fileContains(filePath: string, pattern: RegExp): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, "utf-8");
  return pattern.test(content);
}

function fileNotContains(filePath: string, pattern: RegExp): boolean {
  if (!existsSync(filePath)) return true;
  const content = readFileSync(filePath, "utf-8");
  return !pattern.test(content);
}

function findFilesRecursive(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      results.push(...findFilesRecursive(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

export function createReleaseBlockers(projectRoot: string): readonly ReleaseBlocker[] {
  const srcDir = join(projectRoot, "src");
  const srcTauriDir = join(projectRoot, "src-tauri");

  return [
    {
      id: "RBC-TAURI-FRAMEWORK",
      description: "Application must be built with Tauri (Rust + WebView). Electron is prohibited.",
      module: "framework",
      check: async (): Promise<ReleaseBlockerResult> => {
        const cargoToml = join(srcTauriDir, "Cargo.toml");
        const hasTauri = fileContains(cargoToml, /tauri/);
        const packageJson = join(projectRoot, "package.json");
        const hasElectron = fileContains(packageJson, /"electron"/);
        const passed = hasTauri && !hasElectron;
        return {
          id: "RBC-TAURI-FRAMEWORK",
          passed,
          message: passed
            ? "Tauri framework confirmed. No Electron dependency detected."
            : "FAIL: Tauri framework not found or Electron dependency detected.",
        };
      },
    },
    {
      id: "RBC-CODEMIRROR6",
      description: "Editor engine must be CodeMirror 6. Monaco/Ace/ProseMirror are prohibited.",
      module: "editor",
      check: async (): Promise<ReleaseBlockerResult> => {
        const packageJson = join(projectRoot, "package.json");
        const hasCM6 = fileContains(packageJson, /@codemirror/);
        const hasMonaco = fileContains(packageJson, /monaco-editor/);
        const hasAce = fileContains(packageJson, /"ace-builds"/);
        const hasProseMirror = fileContains(packageJson, /prosemirror/);
        const passed = hasCM6 && !hasMonaco && !hasAce && !hasProseMirror;
        return {
          id: "RBC-CODEMIRROR6",
          passed,
          message: passed
            ? "CodeMirror 6 confirmed. No prohibited editor engines detected."
            : "FAIL: CodeMirror 6 missing or prohibited editor engine found.",
        };
      },
    },
    {
      id: "RBC-NO-TITLE-INPUT",
      description: "Editor screen must not contain a title input field.",
      module: "editor",
      check: async (): Promise<ReleaseBlockerResult> => {
        const svelteFiles = findFilesRecursive(srcDir, ".svelte");
        const tsxFiles = findFilesRecursive(srcDir, ".tsx");
        const editorFiles = [...svelteFiles, ...tsxFiles].filter(
          (f) => f.toLowerCase().includes("editor")
        );
        for (const file of editorFiles) {
          if (fileContains(file, /title[_-]?input|titleInput|<input[^>]*title/i)) {
            return {
              id: "RBC-NO-TITLE-INPUT",
              passed: false,
              message: `FAIL: Potential title input field detected in ${file}`,
            };
          }
        }
        return {
          id: "RBC-NO-TITLE-INPUT",
          passed: true,
          message: "No title input field detected in editor components.",
        };
      },
    },
    {
      id: "RBC-NO-MARKDOWN-PREVIEW",
      description: "Markdown preview (HTML rendering) is prohibited.",
      module: "editor",
      check: async (): Promise<ReleaseBlockerResult> => {
        const packageJson = join(projectRoot, "package.json");
        const hasMarkdownIt = fileContains(packageJson, /markdown-it/);
        const hasRemark = fileContains(packageJson, /"remark"/);
        const hasMarked = fileContains(packageJson, /"marked"/);
        if (hasMarkdownIt || hasRemark || hasMarked) {
          return {
            id: "RBC-NO-MARKDOWN-PREVIEW",
            passed: false,
            message:
              "FAIL: Markdown rendering library detected. Preview/rendering is prohibited.",
          };
        }
        const allSrcFiles = [
          ...findFilesRecursive(srcDir, ".svelte"),
          ...findFilesRecursive(srcDir, ".ts"),
          ...findFilesRecursive(srcDir, ".tsx"),
        ];
        for (const file of allSrcFiles) {
          if (fileContains(file, /innerHTML.*markdown|dangerouslySetInnerHTML|{@html/)) {
            return {
              id: "RBC-NO-MARKDOWN-PREVIEW",
              passed: false,
              message: `FAIL: Potential markdown HTML rendering detected in ${file}`,
            };
          }
        }
        return {
          id: "RBC-NO-MARKDOWN-PREVIEW",
          passed: true,
          message: "No markdown preview/rendering detected.",
        };
      },
    },
    {
      id: "RBC-FILENAME-FORMAT",
      description: "File naming must follow YYYY-MM-DDTHHMMSS.md format.",
      module: "storage",
      check: async (): Promise<ReleaseBlockerResult> => {
        const rustFiles = findFilesRecursive(srcTauriDir, ".rs");
        let foundTimestampFormat = false;
        for (const file of rustFiles) {
          if (fileContains(file, /%Y-%m-%dT%H%M%S|YYYY-MM-DDTHHMMSS/)) {
            foundTimestampFormat = true;
            break;
          }
        }
        return {
          id: "RBC-FILENAME-FORMAT",
          passed: foundTimestampFormat,
          message: foundTimestampFormat
            ? "Timestamp filename format YYYY-MM-DDTHHMMSS.md found in Rust backend."
            : "FAIL: Timestamp filename format not found in Rust backend.",
        };
      },
    },
    {
      id: "RBC-AUTOSAVE",
      description: "Auto-save must be implemented. No manual save button.",
      module: "storage",
      check: async (): Promise<ReleaseBlockerResult> => {
        const allFrontendFiles = [
          ...findFilesRecursive(srcDir, ".svelte"),
          ...findFilesRecursive(srcDir, ".ts"),
          ...findFilesRecursive(srcDir, ".tsx"),
        ];
        let hasDebounce = false;
        let hasUpdateListener = false;
        for (const file of allFrontendFiles) {
          if (fileContains(file, /debounce/i)) hasDebounce = true;
          if (fileContains(file, /updateListener|docChanged/)) hasUpdateListener = true;
        }
        const passed = hasDebounce && hasUpdateListener;
        return {
          id: "RBC-AUTOSAVE",
          passed,
          message: passed
            ? "Auto-save mechanism (debounce + updateListener) detected."
            : `FAIL: Auto-save incomplete. debounce=${hasDebounce}, updateListener=${hasUpdateListener}`,
        };
      },
    },
    {
      id: "RBC-LOCAL-STORAGE-ONLY",
      description: "Data must be stored as local .md files only. No DB or cloud sync.",
      module: "storage",
      check: async (): Promise<ReleaseBlockerResult> => {
        const packageJson = join(projectRoot, "package.json");
        const hasSqlite = fileContains(packageJson, /sqlite|better-sqlite/i);
        const hasPrisma = fileContains(packageJson, /prisma/i);
        const hasIndexedDb = fileContains(packageJson, /idb|dexie|localforage/i);
        if (hasSqlite || hasPrisma || hasIndexedDb) {
          return {
            id: "RBC-LOCAL-STORAGE-ONLY",
            passed: false,
            message: "FAIL: Database dependency detected. Only local .md files allowed.",
          };
        }
        return {
          id: "RBC-LOCAL-STORAGE-ONLY",
          passed: true,
          message: "No database dependencies detected. Local .md storage confirmed.",
        };
      },
    },
    {
      id: "RBC-NO-AI-CALLS",
      description: "AI calling functionality is prohibited.",
      module: "framework",
      check: async (): Promise<ReleaseBlockerResult> => {
        const packageJson = join(projectRoot, "package.json");
        const hasOpenAI = fileContains(packageJson, /openai/i);
        const hasAnthropic = fileContains(packageJson, /anthropic|claude/i);
        const hasLangchain = fileContains(packageJson, /langchain/i);
        if (hasOpenAI || hasAnthropic || hasLangchain) {
          return {
            id: "RBC-NO-AI-CALLS",
            passed: false,
            message: "FAIL: AI/LLM library dependency detected. AI calls are prohibited.",
          };
        }
        return {
          id: "RBC-NO-AI-CALLS",
          passed: true,
          message: "No AI/LLM dependencies detected.",
        };
      },
    },
    {
      id: "RBC-NO-CLOUD-SYNC",
      description: "Cloud sync is prohibited.",
      module: "framework",
      check: async (): Promise<ReleaseBlockerResult> => {
        const packageJson = join(projectRoot, "package.json");
        const hasAwsSdk = fileContains(packageJson, /aws-sdk|@aws-sdk/);
        const hasFirebase = fileContains(packageJson, /firebase/);
        const hasSupabase = fileContains(packageJson, /supabase/);
        if (hasAwsSdk || hasFirebase || hasSupabase) {
          return {
            id: "RBC-NO-CLOUD-SYNC",
            passed: false,
            message: "FAIL: Cloud service dependency detected. Cloud sync is prohibited.",
          };
        }
        return {
          id: "RBC-NO-CLOUD-SYNC",
          passed: true,
          message: "No cloud sync dependencies detected.",
        };
      },
    },
    {
      id: "RBC-COPY-BUTTON",
      description: "1-click copy button is core UX. Must exist in editor.",
      module: "editor",
      check: async (): Promise<ReleaseBlockerResult> => {
        const allFiles = [
          ...findFilesRecursive(srcDir, ".svelte"),
          ...findFilesRecursive(srcDir, ".ts"),
          ...findFilesRecursive(srcDir, ".tsx"),
        ];
        let hasCopyButton = false;
        let hasClipboardWrite = false;
        for (const file of allFiles) {
          if (fileContains(file, /CopyButton|copy[_-]?button|copyButton/i)) hasCopyButton = true;
          if (fileContains(file, /navigator\.clipboard\.writeText|clipboard\.writeText/))
            hasClipboardWrite = true;
        }
        const passed = hasCopyButton && hasClipboardWrite;
        return {
          id: "RBC-COPY-BUTTON",
          passed,
          message: passed
            ? "Copy button component and clipboard.writeText() detected."
            : `FAIL: Copy button incomplete. component=${hasCopyButton}, clipboardAPI=${hasClipboardWrite}`,
        };
      },
    },
    {
      id: "RBC-NEW-NOTE-KEYBIND",
      description: "Cmd+N / Ctrl+N must create a new note immediately.",
      module: "editor",
      check: async (): Promise<ReleaseBlockerResult> => {
        const allFiles = [
          ...findFilesRecursive(srcDir, ".svelte"),
          ...findFilesRecursive(srcDir, ".ts"),
          ...findFilesRecursive(srcDir, ".tsx"),
        ];
        let hasModN = false;
        for (const file of allFiles) {
          if (fileContains(file, /Mod-n|Cmd-n|Ctrl-n|mod-n/i)) {
            hasModN = true;
            break;
          }
        }
        return {
          id: "RBC-NEW-NOTE-KEYBIND",
          passed: hasModN,
          message: hasModN
            ? "Cmd+N / Ctrl+N keybinding detected."
            : "FAIL: New note keybinding (Mod-n) not found.",
        };
      },
    },
    {
      id: "RBC-GRID-DEFAULT-7DAYS",
      description: "Grid view must default to showing notes from the last 7 days.",
      module: "grid",
      check: async (): Promise<ReleaseBlockerResult> => {
        const allFiles = [
          ...findFilesRecursive(srcDir, ".svelte"),
          ...findFilesRecursive(srcDir, ".ts"),
          ...findFilesRecursive(srcDir, ".tsx"),
        ];
        let hasSevenDayFilter = false;
        for (const file of allFiles) {
          if (
            fileContains(file, /7\s*\*?\s*24|setDate.*-\s*7|7\s*days?|sevenDaysAgo|seven_days/i)
          ) {
            hasSevenDayFilter = true;
            break;
          }
        }
        return {
          id: "RBC-GRID-DEFAULT-7DAYS",
          passed: hasSevenDayFilter,
          message: hasSevenDayFilter
            ? "Default 7-day filter logic detected."
            : "FAIL: Default 7-day filter not found in grid components.",
        };
      },
    },
    {
      id: "RBC-GRID-FULLTEXT-SEARCH",
      description: "Full-text search via file scan must be implemented.",
      module: "grid",
      check: async (): Promise<ReleaseBlockerResult> => {
        const rustFiles = findFilesRecursive(srcTauriDir, ".rs");
        let hasSearchImpl = false;
        for (const file of rustFiles) {
          if (fileContains(file, /contains|search_notes|to_lowercase/)) {
            hasSearchImpl = true;
            break;
          }
        }
        return {
          id: "RBC-GRID-FULLTEXT-SEARCH",
          passed: hasSearchImpl,
          message: hasSearchImpl
            ? "Full-text search implementation detected in Rust backend."
            : "FAIL: Full-text search implementation not found in Rust backend.",
        };
      },
    },
    {
      id: "RBC-IPC-BOUNDARY",
      description:
        "All file operations must go through Tauri IPC. No direct fs access from frontend.",
      module: "shell",
      check: async (): Promise<ReleaseBlockerResult> => {
        const frontendFiles = [
          ...findFilesRecursive(srcDir, ".svelte"),
          ...findFilesRecursive(srcDir, ".ts"),
          ...findFilesRecursive(srcDir, ".tsx"),
        ];
        const violations: string[] = [];
        for (const file of frontendFiles) {
          if (file.includes("api.ts") || file.includes("generated")) continue;
          if (
            fileContains(file, /require\(['"]fs['"]\)|from\s+['"]fs['"]/) ||
            fileContains(file, /fetch\(['"]file:\/\//)
          ) {
            violations.push(file);
          }
        }
        const passed = violations.length === 0;
        return {
          id: "RBC-IPC-BOUNDARY",
          passed,
          message: passed
            ? "No direct filesystem access from frontend detected."
            : `FAIL: Direct fs access detected in: ${violations.join(", ")}`,
        };
      },
    },
  ];
}

export async function runAllReleaseBlockerChecks(
  projectRoot: string
): Promise<{ passed: boolean; results: ReleaseBlockerResult[] }> {
  const blockers = createReleaseBlockers(projectRoot);
  const results: ReleaseBlockerResult[] = [];

  for (const blocker of blockers) {
    const result = await blocker.check();
    results.push(result);
  }

  const passed = results.every((r) => r.passed);
  return { passed, results };
}
