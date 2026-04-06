// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan > design:system-design > req:promptnotes-requirements
// Module: ui_foundation | Platform: linux

import type { AppStreamMetadata, AppStreamRelease, AppStreamScreenshot } from './types';
import {
  FLATPAK_APP_ID,
  APP_NAME,
  APP_SUMMARY,
  APP_DEVELOPER_NAME,
  APP_LICENSE,
  APP_HOMEPAGE,
  APP_BUGTRACKER,
  APP_BINARY_NAME,
} from './types';

/**
 * Generate AppStream metainfo XML for Flathub submission.
 *
 * AppStream metadata is required for all Flathub applications.
 * Spec: https://www.freedesktop.org/software/appstream/docs/
 *
 * The file is installed as:
 *   /app/share/metainfo/io.github.promptnotes.PromptNotes.metainfo.xml
 */
export function generateAppStreamMetadata(
  releases: readonly AppStreamRelease[],
  screenshots: readonly AppStreamScreenshot[]
): AppStreamMetadata {
  return {
    id: FLATPAK_APP_ID,
    name: APP_NAME,
    summary: APP_SUMMARY,
    description: [
      'PromptNotes is a local-first note app designed for quickly writing and organizing AI prompts.',
      'Write a note, copy it to your clipboard with one click, and paste it into your terminal or IDE.',
      'No title fields, no cloud sync, no AI calls — just fast, plain Markdown notes with automatic saving.',
      'Features include a Pinterest-style grid view with tag and date filters, full-text search, and CodeMirror 6 editor with Markdown syntax highlighting.',
      'Notes are stored as standard .md files compatible with Obsidian, VS Code, and Git version control.',
    ],
    developerName: APP_DEVELOPER_NAME,
    projectLicense: APP_LICENSE,
    metadataLicense: 'CC0-1.0',
    url: {
      homepage: APP_HOMEPAGE,
      bugtracker: APP_BUGTRACKER,
    },
    launchable: `${FLATPAK_APP_ID}.desktop`,
    categories: ['Utility', 'TextEditor'],
    keywords: ['notes', 'prompt', 'markdown', 'editor', 'clipboard', 'local'],
    contentRating: 'oars-1.1',
    releases,
    screenshots,
    provides: [APP_BINARY_NAME],
  };
}

/**
 * Serialize AppStreamMetadata to XML format.
 * Follows the AppStream metainfo specification for type="desktop-application".
 */
export function serializeAppStreamXml(metadata: AppStreamMetadata): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<component type="desktop-application">');
  lines.push(`  <id>${escapeXml(metadata.id)}</id>`);
  lines.push(`  <name>${escapeXml(metadata.name)}</name>`);
  lines.push(`  <summary>${escapeXml(metadata.summary)}</summary>`);
  lines.push(`  <developer_name>${escapeXml(metadata.developerName)}</developer_name>`);
  lines.push(`  <project_license>${escapeXml(metadata.projectLicense)}</project_license>`);
  lines.push(`  <metadata_license>${escapeXml(metadata.metadataLicense)}</metadata_license>`);

  lines.push('  <description>');
  for (const paragraph of metadata.description) {
    lines.push(`    <p>${escapeXml(paragraph)}</p>`);
  }
  lines.push('  </description>');

  lines.push(`  <launchable type="desktop-id">${escapeXml(metadata.launchable)}</launchable>`);

  lines.push('  <url type="homepage">' + escapeXml(metadata.url.homepage) + '</url>');
  lines.push('  <url type="bugtracker">' + escapeXml(metadata.url.bugtracker) + '</url>');

  lines.push('  <categories>');
  for (const category of metadata.categories) {
    lines.push(`    <category>${escapeXml(category)}</category>`);
  }
  lines.push('  </categories>');

  lines.push('  <keywords>');
  for (const keyword of metadata.keywords) {
    lines.push(`    <keyword>${escapeXml(keyword)}</keyword>`);
  }
  lines.push('  </keywords>');

  lines.push(`  <content_rating type="${escapeXml(metadata.contentRating)}" />`);

  lines.push('  <provides>');
  for (const binary of metadata.provides) {
    lines.push(`    <binary>${escapeXml(binary)}</binary>`);
  }
  lines.push('  </provides>');

  if (metadata.screenshots.length > 0) {
    lines.push('  <screenshots>');
    for (const screenshot of metadata.screenshots) {
      lines.push(`    <screenshot type="${screenshot.type}">`);
      lines.push(`      <caption>${escapeXml(screenshot.caption)}</caption>`);
      lines.push(`      <image type="source" width="${screenshot.width}" height="${screenshot.height}">${escapeXml(screenshot.imageUrl)}</image>`);
      lines.push('    </screenshot>');
    }
    lines.push('  </screenshots>');
  }

  if (metadata.releases.length > 0) {
    lines.push('  <releases>');
    for (const release of metadata.releases) {
      lines.push(`    <release version="${escapeXml(release.version)}" date="${escapeXml(release.date)}">`);
      lines.push('      <description>');
      lines.push(`        <p>${escapeXml(release.description)}</p>`);
      lines.push('      </description>');
      lines.push('    </release>');
    }
    lines.push('  </releases>');
  }

  lines.push('</component>');

  return lines.join('\n') + '\n';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate AppStream metadata against Flathub requirements.
 */
export function validateAppStreamMetadata(metadata: AppStreamMetadata): {
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const appIdPattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*){2,}$/;
  if (!appIdPattern.test(metadata.id)) {
    errors.push('App ID must be in reverse-DNS format with at least 3 components');
  }

  if (!metadata.name || metadata.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!metadata.summary || metadata.summary.trim().length === 0) {
    errors.push('Summary is required');
  }

  if (metadata.summary.length > 100) {
    warnings.push('Summary should be less than 100 characters');
  }

  if (metadata.description.length === 0) {
    errors.push('At least one description paragraph is required');
  }

  if (metadata.description.length < 2) {
    warnings.push('Flathub recommends at least 2-3 description paragraphs');
  }

  if (!metadata.projectLicense || metadata.projectLicense.trim().length === 0) {
    errors.push('Project license is required');
  }

  if (metadata.metadataLicense !== 'CC0-1.0' && metadata.metadataLicense !== 'FSFAP') {
    warnings.push('Metadata license should be CC0-1.0 or FSFAP for Flathub');
  }

  if (!metadata.launchable.endsWith('.desktop')) {
    errors.push('Launchable must reference a .desktop file');
  }

  if (metadata.screenshots.length === 0) {
    errors.push('At least one screenshot is required for Flathub');
  }

  if (metadata.releases.length === 0) {
    warnings.push('At least one release entry is recommended');
  }

  const hasDefaultScreenshot = metadata.screenshots.some((s) => s.type === 'default');
  if (metadata.screenshots.length > 0 && !hasDefaultScreenshot) {
    errors.push('At least one screenshot must have type="default"');
  }

  if (metadata.categories.length === 0) {
    warnings.push('Categories are recommended for discoverability');
  }

  return { valid: errors.length === 0, errors, warnings };
}
