// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=60, task=60-1, module=ui_foundation
// Dependency: detail:component_architecture — module:shell, framework:tauri
// Convention: platform:linux — Linux distribution required

import type { NixDesktopIntegration } from './nix-package-config';
import { packageMeta } from './package-meta';

export interface DesktopEntry {
  readonly type: 'Application';
  readonly name: string;
  readonly genericName: string;
  readonly comment: string;
  readonly exec: string;
  readonly icon: string;
  readonly terminal: boolean;
  readonly categories: readonly string[];
  readonly mimeTypes: readonly string[];
  readonly startupWmClass: string;
  readonly keywords: readonly string[];
  readonly startupNotify: boolean;
}

export function createDesktopEntry(
  integration: NixDesktopIntegration,
): DesktopEntry {
  return {
    type: 'Application',
    name: integration.desktopName,
    genericName: 'Note Editor',
    comment: packageMeta.description,
    exec: `${packageMeta.name} %U`,
    icon: packageMeta.name,
    terminal: false,
    categories: [...integration.categories],
    mimeTypes: [...integration.mimeTypes],
    startupWmClass: packageMeta.name,
    keywords: ['notes', 'prompt', 'markdown', 'editor', 'clipboard'],
    startupNotify: true,
  };
}

export function serializeDesktopEntry(entry: DesktopEntry): string {
  const lines: string[] = ['[Desktop Entry]'];

  lines.push(`Type=${entry.type}`);
  lines.push(`Name=${entry.name}`);
  lines.push(`GenericName=${entry.genericName}`);
  lines.push(`Comment=${entry.comment}`);
  lines.push(`Exec=${entry.exec}`);
  lines.push(`Icon=${entry.icon}`);
  lines.push(`Terminal=${entry.terminal ? 'true' : 'false'}`);
  lines.push(`Categories=${entry.categories.join(';')};`);

  if (entry.mimeTypes.length > 0) {
    lines.push(`MimeType=${entry.mimeTypes.join(';')};`);
  }

  lines.push(`StartupWMClass=${entry.startupWmClass}`);
  lines.push(`StartupNotify=${entry.startupNotify ? 'true' : 'false'}`);

  if (entry.keywords.length > 0) {
    lines.push(`Keywords=${entry.keywords.join(';')};`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates an AppStream metainfo XML for the Linux package.
 * Required for Flathub and NixOS packaging metadata.
 */
export function generateAppStreamMetainfo(): string {
  const id = `${packageMeta.identifier}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${id}</id>
  <name>${packageMeta.displayName}</name>
  <summary>${packageMeta.description}</summary>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>MIT</project_license>
  <url type="homepage">${packageMeta.homepage}</url>
  <url type="bugtracker">${packageMeta.repository}/issues</url>
  <url type="vcs-browser">${packageMeta.repository}</url>
  <developer id="${id}">
    <name>${packageMeta.author}</name>
  </developer>
  <description>
    <p>
      PromptNotes is a local-first note app for quickly jotting down prompts.
      No title required — just write and move on. Review your notes in a
      Pinterest-style grid view. Copy any note to clipboard with a single click.
    </p>
    <p>Features:</p>
    <ul>
      <li>CodeMirror 6 editor with Markdown syntax highlighting</li>
      <li>One-click copy button for pasting into terminals and IDEs</li>
      <li>Cmd+N / Ctrl+N instant new note creation</li>
      <li>Auto-save with no manual save required</li>
      <li>Pinterest-style masonry grid for browsing notes</li>
      <li>Tag and date filtering with full-text search</li>
      <li>Local .md files compatible with Obsidian and VSCode</li>
    </ul>
  </description>
  <launchable type="desktop-id">${packageMeta.name}.desktop</launchable>
  <content_rating type="oars-1.1" />
  <provides>
    <binary>${packageMeta.name}</binary>
  </provides>
  <categories>
    <category>Utility</category>
    <category>TextEditor</category>
    <category>Office</category>
  </categories>
  <supports>
    <control>pointing</control>
    <control>keyboard</control>
  </supports>
  <requires>
    <display_length compare="ge">640</display_length>
  </requires>
</component>
`;
}
