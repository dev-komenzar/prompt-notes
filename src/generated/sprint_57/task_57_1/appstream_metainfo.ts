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
// @codd-source: docs/requirements/requirements.md (AC-DIST-01)

import * as fs from 'fs';
import * as path from 'path';
import { APP_NAME, APP_VERSION, FLATPAK_APP_ID } from './build_config';

export function generateMetainfo(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${FLATPAK_APP_ID}</id>
  <name>${APP_NAME}</name>
  <summary>Quickly capture prompts for AI — no title, just content</summary>
  <metadata_license>MIT</metadata_license>
  <project_license>MIT</project_license>
  <description>
    <p>
      PromptNotes is a local desktop note app for quickly writing down prompts
      to pass to AI. No title required — just start writing. Review your notes
      in a Pinterest-style grid view.
    </p>
    <ul>
      <li>Title-free editor powered by CodeMirror 6</li>
      <li>One-click clipboard copy for pasting into terminals or IDEs</li>
      <li>Cmd+N / Ctrl+N for instant new note creation</li>
      <li>Notes saved as local Markdown files (.md)</li>
      <li>Grid view with tag, date, and full-text search</li>
    </ul>
  </description>
  <url type="homepage">https://github.com/dev-komenzar/promptnotes</url>
  <url type="bugtracker">https://github.com/dev-komenzar/promptnotes/issues</url>
  <launchable type="desktop-id">${FLATPAK_APP_ID}.desktop</launchable>
  <provides>
    <binary>promptnotes</binary>
  </provides>
  <releases>
    <release version="${APP_VERSION}" date="2026-04-12"/>
  </releases>
  <content_rating type="oars-1.1"/>
  <supports>
    <control>keyboard</control>
    <control>pointing</control>
  </supports>
</component>
`;
}

export function writeMetainfo(outputDir: string): void {
  const content = generateMetainfo();
  const outputPath = path.join(outputDir, `${FLATPAK_APP_ID}.metainfo.xml`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`AppStream metainfo written to: ${outputPath}`);
}

if (require.main === module) {
  const outputDir =
    process.argv[2] ?? path.resolve(__dirname, '../../../../packaging/linux');
  writeMetainfo(outputDir);
}
