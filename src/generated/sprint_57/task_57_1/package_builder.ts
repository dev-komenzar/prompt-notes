// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 57
// @codd-task: 57-1
// @codd-source: docs/design/system_design.md § 2.9, docs/governance/adr_tech_stack.md ADR-001

import { execSync, ExecSyncOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { writeDesktopEntry } from './desktop_entry';
import { writeManifest } from './flatpak_manifest';
import { writeMetainfo } from './appstream_metainfo';
import { FLATPAK_APP_ID } from './build_config';

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const PACKAGING_DIR = path.join(PROJECT_ROOT, 'packaging');
const FLATPAK_BUILD_DIR = path.join(PACKAGING_DIR, 'flatpak');
const LINUX_ASSETS_DIR = path.join(PACKAGING_DIR, 'linux');

const EXEC_OPTS: ExecSyncOptions = {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  encoding: 'utf-8',
};

function run(command: string, opts: ExecSyncOptions = EXEC_OPTS): void {
  console.log(`\n> ${command}`);
  execSync(command, opts);
}

function checkDependency(bin: string): void {
  try {
    execSync(`which ${bin}`, { stdio: 'ignore' });
  } catch {
    throw new Error(
      `Required dependency not found: ${bin}\n` +
        `Install it before running the Flatpak build.`,
    );
  }
}

function generateSources(): void {
  console.log('\n[1/3] Generating cargo dependency sources for offline build...');
  checkDependency('flatpak-cargo-generator');
  run(
    `flatpak-cargo-generator src-tauri/Cargo.lock -o ${FLATPAK_BUILD_DIR}/cargo-sources.json`,
  );

  console.log('\n[2/3] Generating npm dependency sources for offline build...');
  checkDependency('flatpak-node-generator');
  run(
    `flatpak-node-generator npm package-lock.json -o ${FLATPAK_BUILD_DIR}/npm-sources.json`,
  );
}

function generatePackagingAssets(): void {
  console.log('\n[3/3] Generating packaging assets...');
  writeManifest(FLATPAK_BUILD_DIR);
  writeDesktopEntry(LINUX_ASSETS_DIR);
  writeMetainfo(LINUX_ASSETS_DIR);
}

function buildFlatpak(): void {
  checkDependency('flatpak-builder');
  const repoDir = path.join(PACKAGING_DIR, 'flatpak-repo');
  const buildDir = path.join(PACKAGING_DIR, '.flatpak-build');
  const manifestPath = path.join(FLATPAK_BUILD_DIR, `${FLATPAK_APP_ID}.json`);

  console.log('\nBuilding Flatpak bundle...');
  run(
    `flatpak-builder --repo=${repoDir} --force-clean ${buildDir} ${manifestPath}`,
  );

  console.log('\nCreating Flatpak single-file bundle...');
  run(
    `flatpak build-bundle ${repoDir} ${PACKAGING_DIR}/${FLATPAK_APP_ID}.flatpak ${FLATPAK_APP_ID}`,
  );

  console.log(`\nFlatpak bundle: ${PACKAGING_DIR}/${FLATPAK_APP_ID}.flatpak`);
}

/** Validate generated assets exist before attempting flatpak-builder */
function validateAssets(): void {
  const required = [
    path.join(FLATPAK_BUILD_DIR, `${FLATPAK_APP_ID}.json`),
    path.join(FLATPAK_BUILD_DIR, 'cargo-sources.json'),
    path.join(FLATPAK_BUILD_DIR, 'npm-sources.json'),
    path.join(LINUX_ASSETS_DIR, `${FLATPAK_APP_ID}.desktop`),
    path.join(LINUX_ASSETS_DIR, `${FLATPAK_APP_ID}.metainfo.xml`),
  ];
  const missing = required.filter((p) => !fs.existsSync(p));
  if (missing.length > 0) {
    throw new Error(`Missing required files:\n${missing.map((f) => `  ${f}`).join('\n')}`);
  }
}

export function runFullBuild(): void {
  generateSources();
  generatePackagingAssets();
  validateAssets();
  buildFlatpak();
}

export function runGenerateOnly(): void {
  generateSources();
  generatePackagingAssets();
  validateAssets();
  console.log('\nPackaging assets generated. Run with --build to build the Flatpak bundle.');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const doBuild = args.includes('--build');
  try {
    if (doBuild) {
      runFullBuild();
    } else {
      runGenerateOnly();
    }
  } catch (err) {
    console.error('\nBuild failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
