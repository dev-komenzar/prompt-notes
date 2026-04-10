// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 52-1
// @task-title: Flatpak でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { APP_ID } from "./manifest";

export interface AppStreamRelease {
  version: string;
  date: string;
  description: string;
}

export function renderAppStream(releases: AppStreamRelease[]): string {
  const releaseXml = releases
    .map(
      (r) => `
    <release version="${escapeXml(r.version)}" date="${escapeXml(r.date)}">
      <description>
        <p>${escapeXml(r.description)}</p>
      </description>
    </release>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${APP_ID}</id>
  <metadata_license>MIT</metadata_license>
  <project_license>MIT</project_license>

  <name>PromptNotes</name>
  <summary>Quick note-taking for AI prompts</summary>

  <description>
    <p>
      PromptNotes is a local desktop note-taking app designed for collecting and
      reusing prompts for AI assistants. No title required — just write and go.
    </p>
    <p>Features:</p>
    <ul>
      <li>CodeMirror 6 editor with Markdown syntax highlighting</li>
      <li>One-click copy button to copy note body to clipboard</li>
      <li>Pinterest-style masonry grid view with 7-day default filter</li>
      <li>Tag and date filtering with full-text search</li>
      <li>Auto-save to local .md files — no cloud sync</li>
      <li>Cmd+N / Ctrl+N for instant new note creation</li>
    </ul>
    <p>
      All data is stored locally as Markdown files. No network communication,
      no AI calls, no cloud storage.
    </p>
  </description>

  <launchable type="desktop-id">${APP_ID}.desktop</launchable>

  <url type="homepage">https://github.com/dev-komenzar/promptnotes</url>
  <url type="bugtracker">https://github.com/dev-komenzar/promptnotes/issues</url>

  <provides>
    <binary>promptnotes</binary>
  </provides>

  <screenshots>
    <screenshot type="default">
      <caption>Grid view showing notes in masonry layout</caption>
    </screenshot>
    <screenshot>
      <caption>Editor view with frontmatter region and copy button</caption>
    </screenshot>
  </screenshots>

  <content_rating type="oars-1.1" />

  <releases>
    ${releaseXml.trim()}
  </releases>
</component>
`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
