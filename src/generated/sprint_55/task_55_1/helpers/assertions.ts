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

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 55

import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { FILENAME_REGEX, parseFrontmatter } from './note-factory';

export function assertFilenameFormat(filename: string): void {
  expect(FILENAME_REGEX.test(filename)).toBe(true);
}

export function assertNoteInDir(dir: string, id: string): void {
  const filePath = path.join(dir, `${id}.md`);
  expect(fs.existsSync(filePath)).toBe(true);
}

export function assertNoteNotInDir(dir: string, id: string): void {
  const filePath = path.join(dir, `${id}.md`);
  expect(fs.existsSync(filePath)).toBe(false);
}

export function assertFrontmatterTagsOnly(content: string): void {
  const { tags } = parseFrontmatter(content);
  expect(Array.isArray(tags)).toBe(true);
  // Verify no extra fields beyond tags are present in frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (fmMatch) {
    const yamlLines = fmMatch[1].split('\n').filter(l => l.trim() !== '');
    const nonTagLines = yamlLines.filter(l => !l.startsWith('tags:') && !l.match(/^\s+-\s/));
    expect(nonTagLines.length).toBe(0);
  }
}

export function assertAllFilesInDirHaveValidFormat(dir: string): void {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    assertFilenameFormat(file);
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    assertFrontmatterTagsOnly(content);
  }
}
