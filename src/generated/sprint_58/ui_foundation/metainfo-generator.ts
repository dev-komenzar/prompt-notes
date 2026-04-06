// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 58 — Linux バイナリビルド（.AppImage, .deb）
// CoDD trace: plan:implementation_plan > task:58-1
// Convention: platform:linux — AppStream metainfo for Linux package managers

import { APP_METADATA } from './app-metadata';

export function generateMetainfoXml(): string {
  const id = APP_METADATA.identifier;
  const name = APP_METADATA.productName;
  const version = APP_METADATA.version;
  const description = APP_METADATA.description;
  const homepage = APP_METADATA.homepage;
  const license = APP_METADATA.license;

  return `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${escapeXml(id)}</id>
  <name>${escapeXml(name)}</name>
  <summary>${escapeXml(description)}</summary>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>${escapeXml(license)}</project_license>
  <description>
    <p>
      ${escapeXml(name)} is a local-first note app for quickly jotting down prompts
      to pass to AI. No title needed — just write and copy.
    </p>
    <p>
      Features include a CodeMirror 6 Markdown editor with syntax highlighting,
      a Pinterest-style grid view for browsing notes, one-click copy to clipboard,
      and automatic saving to local .md files.
    </p>
    <p>
      Notes are stored as standard Markdown files with YAML frontmatter,
      compatible with Obsidian, VS Code, and Git version control.
    </p>
  </description>
  <url type="homepage">${escapeXml(homepage)}</url>
  <url type="bugtracker">${escapeXml(homepage)}/issues</url>
  <url type="vcs-browser">${escapeXml(homepage)}</url>
  <launchable type="desktop-id">${escapeXml(id)}.desktop</launchable>
  <provides>
    <binary>${escapeXml(APP_METADATA.name)}</binary>
    <mediatype>text/markdown</mediatype>
    <mediatype>text/x-markdown</mediatype>
    <mediatype>text/plain</mediatype>
  </provides>
  <requires>
    <display_length compare="ge">640</display_length>
  </requires>
  <categories>
    <category>Utility</category>
    <category>TextEditor</category>
    <category>Office</category>
  </categories>
  <keywords>
    <keyword>notes</keyword>
    <keyword>prompt</keyword>
    <keyword>markdown</keyword>
    <keyword>editor</keyword>
    <keyword>local-first</keyword>
  </keywords>
  <releases>
    <release version="${escapeXml(version)}" date="${getCurrentDate()}">
      <description>
        <p>Initial release of ${escapeXml(name)}.</p>
      </description>
    </release>
  </releases>
  <content_rating type="oars-1.1" />
</component>
`;
}

export function validateMetainfoXml(content: string): MetainfoValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.includes('<?xml')) {
    errors.push('Missing XML declaration.');
  }

  if (!content.includes('<component type="desktop-application">')) {
    errors.push('Missing or incorrect component type. Must be "desktop-application".');
  }

  const requiredElements = ['<id>', '<name>', '<summary>', '<description>', '<metadata_license>', '<project_license>'];
  for (const element of requiredElements) {
    if (!content.includes(element)) {
      errors.push(`Required element ${element} is missing.`);
    }
  }

  if (!content.includes('<releases>')) {
    warnings.push('No <releases> section found. Recommended for package manager display.');
  }

  if (!content.includes('<launchable')) {
    warnings.push('No <launchable> element found. Recommended for desktop integration.');
  }

  if (!content.includes('<content_rating')) {
    warnings.push('No <content_rating> element found. Required for Flathub submission.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export interface MetainfoValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
