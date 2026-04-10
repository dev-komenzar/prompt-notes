// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md §2.7
// @generated-by: codd implement --sprint 54

/**
 * Generates the YAML content for GitHub Actions workflow files.
 *
 * Run from the project root:
 *   npx ts-node src/generated/sprint_54/github_actions/generate-workflows.ts
 *
 * This writes:
 *   .github/workflows/build-release.yml
 *   .github/workflows/ci.yml
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GitHubWorkflow, WorkflowJob, WorkflowStep, WorkflowTrigger } from './workflow-types';
import { buildReleaseWorkflow } from './build-release-workflow';
import { ciWorkflow } from './ci-workflow';

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? pad + line : line))
    .join('\n');
}

function yamlString(value: string): string {
  if (/[:\n#\[\]{}|>&!'",%@`?]/.test(value) || value.includes('${{')) {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return value;
}

function yamlValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      return '|\n' + value.split('\n').map((l) => '  ' + l).join('\n');
    }
    return yamlString(value);
  }
  return String(value);
}

function renderMapping(obj: Record<string, unknown>, baseIndent: number): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (v === undefined || v === null) return '';
      if (typeof v === 'object' && !Array.isArray(v)) {
        return `${k}:\n${renderMapping(v as Record<string, unknown>, baseIndent + 2)}`;
      }
      if (Array.isArray(v)) {
        const items = (v as unknown[]).map((item) => {
          if (typeof item === 'object' && item !== null) {
            const rendered = renderMapping(item as Record<string, unknown>, baseIndent + 4);
            const lines = rendered.trimEnd().split('\n');
            return '- ' + lines[0].trimStart() + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '');
          }
          return `- ${yamlValue(item)}`;
        });
        return `${k}:\n${items.map((i) => indent(i, baseIndent + 2)).join('\n')}`;
      }
      return `${k}: ${yamlValue(v)}`;
    })
    .filter(Boolean)
    .map((line) => indent(line, baseIndent))
    .join('\n');
}

function renderStep(step: WorkflowStep): string {
  const parts: string[] = [];
  parts.push(`- name: ${yamlString(step.name)}`);
  if (step.if) parts.push(`  if: ${yamlString(step.if)}`);
  if (step.uses) parts.push(`  uses: ${step.uses}`);
  if (step.run) {
    if (step.run.includes('\n')) {
      parts.push('  run: |');
      step.run.split('\n').forEach((l) => parts.push('    ' + l));
    } else {
      parts.push(`  run: ${yamlString(step.run)}`);
    }
  }
  if (step.with && Object.keys(step.with).length > 0) {
    parts.push('  with:');
    Object.entries(step.with).forEach(([k, v]) => {
      const val = yamlValue(v);
      if (val.startsWith('|')) {
        parts.push(`    ${k}: |`);
        val.slice(2).split('\n').forEach((l) => parts.push('      ' + l));
      } else {
        parts.push(`    ${k}: ${val}`);
      }
    });
  }
  if (step.env && Object.keys(step.env).length > 0) {
    parts.push('  env:');
    Object.entries(step.env).forEach(([k, v]) => {
      parts.push(`    ${k}: ${yamlValue(v)}`);
    });
  }
  return parts.join('\n');
}

function renderTrigger(on: WorkflowTrigger): string {
  const parts: string[] = ['on:'];
  if (on.push) {
    parts.push('  push:');
    if (on.push.tags) {
      parts.push('    tags:');
      on.push.tags.forEach((t) => parts.push(`      - '${t}'`));
    }
    if (on.push.branches) {
      parts.push('    branches:');
      on.push.branches.forEach((b) => parts.push(`      - ${b}`));
    }
  }
  if (on.pull_request) {
    parts.push('  pull_request:');
    if (on.pull_request.branches) {
      parts.push('    branches:');
      on.pull_request.branches.forEach((b) => parts.push(`      - ${b}`));
    }
  }
  if (on.workflow_dispatch !== undefined) {
    parts.push('  workflow_dispatch:');
  }
  return parts.join('\n');
}

function renderJob(name: string, job: WorkflowJob): string {
  const parts: string[] = [`  ${name}:`];
  parts.push(`    name: ${yamlString(job.name)}`);
  parts.push(`    runs-on: ${yamlString(job.runsOn)}`);

  if (job.strategy) {
    parts.push('    strategy:');
    parts.push(`      fail-fast: ${job.strategy.failFast}`);
    parts.push('      matrix:');
    parts.push('        include:');
    job.strategy.matrix.include.forEach((entry) => {
      const keys = Object.keys(entry) as (keyof typeof entry)[];
      const firstKey = keys[0];
      parts.push(`          - ${firstKey}: ${yamlValue(entry[firstKey] as string)}`);
      keys.slice(1).forEach((k) => {
        const val = entry[k];
        if (val === undefined) return;
        if (Array.isArray(val)) {
          parts.push(`            ${k}:`);
          val.forEach((v) => parts.push(`              - ${v}`));
        } else {
          parts.push(`            ${k}: ${yamlValue(val as string)}`);
        }
      });
    });
  }

  parts.push('    steps:');
  job.steps.forEach((step) => {
    const rendered = renderStep(step);
    rendered.split('\n').forEach((line) => parts.push('      ' + line));
  });

  return parts.join('\n');
}

function generateYaml(workflow: GitHubWorkflow): string {
  const lines: string[] = [];
  lines.push(`name: ${workflow.name}`);
  lines.push('');
  lines.push(renderTrigger(workflow.on));
  lines.push('');

  if (workflow.env && Object.keys(workflow.env).length > 0) {
    lines.push('env:');
    Object.entries(workflow.env).forEach(([k, v]) => {
      lines.push(`  ${k}: ${v}`);
    });
    lines.push('');
  }

  lines.push('jobs:');
  Object.entries(workflow.jobs).forEach(([name, job]) => {
    lines.push(renderJob(name, job));
    lines.push('');
  });

  return lines.join('\n');
}

function writeWorkflow(workflow: GitHubWorkflow, filename: string): void {
  const workflowsDir = path.resolve(process.cwd(), '.github', 'workflows');
  fs.mkdirSync(workflowsDir, { recursive: true });

  const outputPath = path.join(workflowsDir, filename);
  const yaml = generateYaml(workflow);
  fs.writeFileSync(outputPath, yaml, 'utf-8');
  console.log(`Written: ${outputPath}`);
}

if (require.main === module) {
  writeWorkflow(buildReleaseWorkflow, 'build-release.yml');
  writeWorkflow(ciWorkflow, 'ci.yml');
  console.log('Done. Review .github/workflows/ before committing.');
}

export { generateYaml };
