// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: Linux と macOS の両ターゲットで `cargo build` + `npm run build` が通る
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 9
// @task: 9-1
// @deliverable: Linux と macOS の両ターゲットで cargo build + npm run build が通る

import {
  CI_WORKFLOW_NAME,
  RUNNER_MAP,
  RUST_TOOLCHAIN,
  NODE_VERSION,
  BUILD_COMMANDS,
  WORKFLOW_TRIGGERS,
} from './ci-config';
import type {
  WorkflowDefinition,
  WorkflowStep,
} from './workflow-schema';

/**
 * Constructs the canonical set of build steps for the CI workflow.
 * Platform-specific steps (e.g. Linux system deps) are conditionally included.
 */
function buildSteps(): readonly WorkflowStep[] {
  return [
    {
      name: 'Checkout repository',
      uses: 'actions/checkout@v4',
    },
    {
      name: 'Install Linux system dependencies',
      if: "runner.os == 'Linux'",
      run: [
        'sudo apt-get update',
        'sudo apt-get install -y',
        '  libwebkit2gtk-4.1-dev',
        '  libappindicator3-dev',
        '  librsvg2-dev',
        '  patchelf',
        '  libgtk-3-dev',
        '  libsoup-3.0-dev',
        '  libjavascriptcoregtk-4.1-dev',
      ].join(' \\\n'),
    },
    {
      name: 'Setup Rust toolchain',
      uses: 'dtolnay/rust-toolchain@stable',
      with: {
        toolchain: RUST_TOOLCHAIN,
      },
    },
    {
      name: 'Cache Cargo registry and target',
      uses: 'actions/cache@v4',
      with: {
        path: [
          '~/.cargo/bin/',
          '~/.cargo/registry/index/',
          '~/.cargo/registry/cache/',
          '~/.cargo/git/db/',
          'src-tauri/target/',
        ].join('\n'),
        key: "cargo-${{ runner.os }}-${{ hashFiles('**/Cargo.lock') }}",
        'restore-keys': 'cargo-${{ runner.os }}-',
      },
    },
    {
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': NODE_VERSION,
        cache: 'npm',
      },
    },
    {
      name: 'Install npm dependencies',
      run: 'npm ci',
    },
    {
      name: 'Run cargo build',
      run: BUILD_COMMANDS.cargo,
      env: {
        CARGO_TERM_COLOR: 'always',
      },
    },
    {
      name: 'Run npm build',
      run: BUILD_COMMANDS.npm,
    },
  ];
}

/**
 * Generates the complete workflow definition for the CI build pipeline.
 * Targets both Linux (ubuntu-latest) and macOS (macos-latest) runners.
 */
export function generateWorkflowDefinition(): WorkflowDefinition {
  return {
    name: CI_WORKFLOW_NAME,
    on: WORKFLOW_TRIGGERS,
    jobs: {
      build: {
        name: 'Build (${{ matrix.os }})',
        'runs-on': '${{ matrix.os }}',
        strategy: {
          matrix: {
            os: [RUNNER_MAP.linux, RUNNER_MAP.macos],
          },
          'fail-fast': false,
        },
        steps: buildSteps(),
      },
    },
  };
}

/**
 * Serializes the workflow definition to YAML-compatible string.
 * Used for programmatic generation of .github/workflows/build.yml.
 */
export function serializeWorkflowToYaml(def: WorkflowDefinition): string {
  const lines: string[] = [];

  lines.push(`name: ${def.name}`);
  lines.push('');
  lines.push('on:');
  if (def.on.push) {
    lines.push('  push:');
    lines.push(`    branches: [${def.on.push.branches.join(', ')}]`);
  }
  if (def.on.pull_request) {
    lines.push('  pull_request:');
    lines.push(`    branches: [${def.on.pull_request.branches.join(', ')}]`);
  }
  lines.push('');
  lines.push('jobs:');

  for (const [jobId, job] of Object.entries(def.jobs)) {
    lines.push(`  ${jobId}:`);
    lines.push(`    name: ${job.name}`);
    lines.push(`    runs-on: ${job['runs-on']}`);

    if (job.strategy) {
      lines.push('    strategy:');
      lines.push(`      fail-fast: ${job.strategy['fail-fast']}`);
      lines.push('      matrix:');
      lines.push(`        os: [${job.strategy.matrix.os.join(', ')}]`);
    }

    lines.push('    steps:');
    for (const step of job.steps) {
      lines.push(`      - name: ${step.name}`);
      if (step.if) {
        lines.push(`        if: ${step.if}`);
      }
      if (step.uses) {
        lines.push(`        uses: ${step.uses}`);
      }
      if (step.with) {
        lines.push('        with:');
        for (const [k, v] of Object.entries(step.with)) {
          if (v.includes('\n')) {
            lines.push(`          ${k}: |`);
            for (const line of v.split('\n')) {
              lines.push(`            ${line}`);
            }
          } else {
            lines.push(`          ${k}: ${v}`);
          }
        }
      }
      if (step.run) {
        if (step.run.includes('\n')) {
          lines.push('        run: |');
          for (const line of step.run.split('\n')) {
            lines.push(`          ${line}`);
          }
        } else {
          lines.push(`        run: ${step.run}`);
        }
      }
      if (step.env) {
        lines.push('        env:');
        for (const [k, v] of Object.entries(step.env)) {
          lines.push(`          ${k}: ${v}`);
        }
      }
    }
  }

  return lines.join('\n') + '\n';
}
