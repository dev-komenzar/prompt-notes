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
// @codd-source: docs/requirements/requirements.md, docs/design/system_design.md § 2.9

import * as fs from 'fs';
import * as path from 'path';
import { APP_NAME, FLATPAK_APP_ID } from './build_config';

interface DesktopEntry {
  Name: string;
  Comment: string;
  Exec: string;
  Icon: string;
  Type: string;
  Categories: string;
  StartupNotify: string;
  StartupWMClass: string;
}

function formatDesktopEntry(entry: DesktopEntry): string {
  const lines = ['[Desktop Entry]'];
  for (const [key, value] of Object.entries(entry)) {
    lines.push(`${key}=${value}`);
  }
  return lines.join('\n') + '\n';
}

export function generateDesktopEntry(): string {
  const entry: DesktopEntry = {
    Name: APP_NAME,
    Comment: 'Quickly capture prompts for AI — no title, just content',
    Exec: 'promptnotes',
    Icon: FLATPAK_APP_ID,
    Type: 'Application',
    Categories: 'Utility;TextEditor;',
    StartupNotify: 'true',
    StartupWMClass: 'promptnotes',
  };
  return formatDesktopEntry(entry);
}

export function writeDesktopEntry(outputDir: string): void {
  const content = generateDesktopEntry();
  const outputPath = path.join(outputDir, `${FLATPAK_APP_ID}.desktop`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`Desktop entry written to: ${outputPath}`);
}

if (require.main === module) {
  const outputDir =
    process.argv[2] ?? path.resolve(__dirname, '../../../../packaging/linux');
  writeDesktopEntry(outputDir);
}
