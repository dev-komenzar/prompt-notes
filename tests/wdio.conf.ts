import * as path from 'path';
import * as os from 'os';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function resolveTauriBinary(): string {
  const platform = os.platform();
  if (platform === 'linux') {
    return path.join(projectRoot, 'src-tauri', 'target', 'release', 'promptnotes');
  }
  if (platform === 'darwin') {
    return path.join(
      projectRoot, 'src-tauri', 'target', 'release', 'bundle',
      'macos', 'PromptNotes.app', 'Contents', 'MacOS', 'PromptNotes',
    );
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

let tauriDriver: ChildProcess;

export const config: WebdriverIO.Config = {
  // _precheck.spec.ts runs first. If it detects the devUrl fallback (broken
  // production build), it calls process.exit(1) to abort the entire run so
  // no subsequent spec wastes time on cascading failures. We do NOT set
  // `bail: 1` globally — legitimate feature-test failures should not cancel
  // sibling specs.
  specs: [
    path.join(__dirname, 'e2e/_precheck.spec.ts'),
    path.join(__dirname, 'e2e/**/!(_precheck).spec.ts'),
  ],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: resolveTauriBinary(),
      },
    } as any,
  ],
  hostname: '127.0.0.1',
  port: 4444,
  runner: 'local',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60_000,
  },
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,

  onPrepare() {
    tauriDriver = spawn('tauri-driver', [], {
      stdio: [null, process.stdout, process.stderr],
    });
  },

  onComplete() {
    tauriDriver?.kill();
  },
};
