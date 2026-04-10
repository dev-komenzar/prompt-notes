// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md (sprint 51)
// Serialises the TypeScript workflow definitions to YAML and writes them
// to .github/workflows/.  Run from the repository root:
//   npx ts-node src/generated/sprint_51/github_actions/generate.ts

import * as fs from 'fs';
import * as path from 'path';
import { releaseWorkflow } from './release-workflow';
import type { Workflow, Job, JobStep, WorkflowTrigger } from './types';

// ── minimal YAML serialiser (no runtime dependency on js-yaml) ────────────

function indent(n: number): string {
  return ' '.repeat(n);
}

function serializeValue(value: unknown, level: number): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      const lines = value.split('\n');
      return '|\n' + lines.map((l) => indent(level + 2) + l).join('\n');
    }
    if (/[:{}\[\],&*?|<>=!%@`]/.test(value) || value.includes("'")) {
      return JSON.stringify(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '\n' + value.map((v) => indent(level) + '- ' + serializeValue(v, level + 2)).join('\n');
  }
  if (typeof value === 'object' && value !== null) {
    return serializeObject(value as Record<string, unknown>, level);
  }
  return String(value);
}

function serializeObject(obj: Record<string, unknown>, level: number): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    const serialized = serializeValue(val, level + 2);
    if (serialized.startsWith('\n') || serialized.startsWith('|')) {
      lines.push(indent(level) + key + ': ' + serialized);
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      lines.push(indent(level) + key + ':');
      lines.push(serializeObject(val as Record<string, unknown>, level + 2));
    } else {
      lines.push(indent(level) + key + ': ' + serialized);
    }
  }
  return lines.join('\n');
}

function workflowToYaml(workflow: Workflow): string {
  const parts: string[] = [];
  parts.push(`name: ${workflow.name}`);
  parts.push('');

  // on:
  parts.push('on:');
  const trigger = workflow.on as Record<string, unknown>;
  for (const [event, config] of Object.entries(trigger)) {
    if (config === undefined || (typeof config === 'object' && config !== null && Object.keys(config).length === 0)) {
      parts.push(`  ${event}:`);
    } else {
      parts.push(`  ${event}:`);
      parts.push(serializeObject(config as Record<string, unknown>, 4));
    }
  }
  parts.push('');

  if (workflow.env) {
    parts.push('env:');
    parts.push(serializeObject(workflow.env, 2));
    parts.push('');
  }

  parts.push('jobs:');
  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    parts.push(`  ${jobId}:`);
    if (job.name) parts.push(`    name: ${job.name}`);
    parts.push(`    runs-on: ${job['runs-on']}`);
    if (job.needs) {
      const needs = Array.isArray(job.needs) ? job.needs : [job.needs];
      parts.push(`    needs: [${needs.join(', ')}]`);
    }
    if (job.env) {
      parts.push('    env:');
      parts.push(serializeObject(job.env, 6));
    }
    parts.push('    steps:');
    for (const step of job.steps) {
      const stepLines = stepToYaml(step);
      parts.push(...stepLines);
    }
    parts.push('');
  }

  return parts.join('\n');
}

function stepToYaml(step: JobStep): string[] {
  const lines: string[] = [];
  const prefix = '      - ';
  const continuation = '        ';

  let first = true;
  const append = (key: string, value: unknown) => {
    const serialized = serializeValue(value, 10);
    if (first) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        lines.push(serializeObject(value as Record<string, unknown>, 10));
      } else if (serialized.startsWith('|')) {
        lines.push(`${prefix}${key}: ${serialized}`);
      } else {
        lines.push(`${prefix}${key}: ${serialized}`);
      }
      first = false;
    } else {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(`${continuation}${key}:`);
        lines.push(serializeObject(value as Record<string, unknown>, 10));
      } else if (serialized.startsWith('|')) {
        lines.push(`${continuation}${key}: ${serialized}`);
      } else {
        lines.push(`${continuation}${key}: ${serialized}`);
      }
    }
  };

  if (step.name) append('name', step.name);
  if (step.uses) append('uses', step.uses);
  if (step.if) append('if', step.if);
  if (step.with) append('with', step.with);
  if (step.env) append('env', step.env);
  if (step.run) append('run', step.run);

  return lines;
}

// ── write files ───────────────────────────────────────────────────────────

function writeWorkflow(filename: string, workflow: Workflow): void {
  const repoRoot = path.resolve(__dirname, '../../../../..');
  const workflowsDir = path.join(repoRoot, '.github', 'workflows');

  fs.mkdirSync(workflowsDir, { recursive: true });

  const outPath = path.join(workflowsDir, filename);
  const yaml = workflowToYaml(workflow);
  fs.writeFileSync(outPath, yaml, 'utf-8');
  console.log(`Written: ${outPath}`);
}

writeWorkflow('release.yml', releaseWorkflow);
