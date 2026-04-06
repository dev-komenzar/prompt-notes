// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — Tauri WebDriver ヘルパー
import { type ChildProcess, spawn } from 'child_process';
import { resolvePlatformConfig, type PlatformConfig } from './platform';

export interface TauriAppHandle {
  process: ChildProcess;
  webviewUrl: string;
  pid: number;
  config: PlatformConfig;
}

const STARTUP_TIMEOUT_MS = 15_000;
const WEBVIEW_PORT = 9222; // Chrome DevTools Protocol port for WebView debugging

export async function launchTauriApp(
  env?: Record<string, string>,
): Promise<TauriAppHandle> {
  const config = resolvePlatformConfig();
  const binaryPath = config.tauriBinaryPath;

  const mergedEnv: Record<string, string> = {
    ...process.env as Record<string, string>,
    WEBKIT_DISABLE_COMPOSITING_MODE: '1',
    PROMPTNOTES_E2E: '1',
    ...env,
  };

  const child = spawn(binaryPath, [], {
    env: mergedEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const pid = child.pid;
  if (!pid) {
    throw new Error('Failed to spawn Tauri application process');
  }

  await waitForWebViewReady(child);

  return {
    process: child,
    webviewUrl: `http://localhost:${WEBVIEW_PORT}`,
    pid,
    config,
  };
}

export async function closeTauriApp(handle: TauriAppHandle): Promise<void> {
  if (handle.process.killed) return;

  handle.process.kill('SIGTERM');

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (!handle.process.killed) {
        handle.process.kill('SIGKILL');
      }
      resolve();
    }, 5_000);

    handle.process.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function waitForWebViewReady(child: ChildProcess): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Tauri app did not become ready within ${STARTUP_TIMEOUT_MS}ms`));
    }, STARTUP_TIMEOUT_MS);

    let stdoutBuffer = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString();
      // Tauri emits a ready signal on stdout when WebView is initialized
      if (
        stdoutBuffer.includes('Tauri application ready') ||
        stdoutBuffer.includes('Running on') ||
        stdoutBuffer.includes('WebView ready')
      ) {
        clearTimeout(timeout);
        resolve();
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Tauri process error: ${err.message}`));
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== null && code !== 0) {
        reject(new Error(`Tauri process exited prematurely with code ${code}`));
      }
    });
  });
}

export function buildTestEnvWithNotesDir(notesDir: string): Record<string, string> {
  return {
    PROMPTNOTES_TEST_NOTES_DIR: notesDir,
  };
}
