// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Dependency: all design + requirement documents

import type { ReleaseNote, FeatureEntry, PlatformTarget } from './types';
import { formatPlatformMatrix } from './platform_matrix';
import { formatTechStackTable } from './tech_stack';
import { formatFeatureList, getFeaturesByModule } from './feature_manifest';
import { formatIpcCommandTable, IPC_COMMANDS } from './ipc_command_reference';

export function generateReleaseNoteMarkdown(release: ReleaseNote): string {
  const sections: string[] = [];

  sections.push(renderHeader(release));
  sections.push(renderSummary(release));
  sections.push(renderPlatformSupport(release));
  sections.push(renderTechStack(release));
  sections.push(renderFeatures(release));
  sections.push(renderIpcReference());
  sections.push(renderFileFormat());
  sections.push(renderKnownLimitations(release));
  sections.push(renderScopeExclusions(release));
  sections.push(renderUpgradeNotes(release));

  return sections.join('\n\n---\n\n');
}

function renderHeader(release: ReleaseNote): string {
  return [
    `# ${release.codename} ${release.version.label} Release Notes`,
    '',
    `**Release Date:** ${release.releaseDate}`,
  ].join('\n');
}

function renderSummary(release: ReleaseNote): string {
  return ['## Summary', '', release.summary].join('\n');
}

function renderPlatformSupport(release: ReleaseNote): string {
  const lines: string[] = [];
  lines.push('## Platform Support');
  lines.push('');
  lines.push(formatPlatformMatrix(release.platforms));
  lines.push('');
  lines.push('### Keyboard Shortcuts');
  lines.push('');
  lines.push('| Action | Linux | macOS |');
  lines.push('|--------|-------|-------|');
  lines.push('| New Note | Ctrl+N | Cmd+N |');
  lines.push('| Copy (OS standard) | Ctrl+C | Cmd+C |');
  return lines.join('\n');
}

function renderTechStack(release: ReleaseNote): string {
  return ['## Technology Stack', '', formatTechStackTable(release.techStack)].join('\n');
}

function renderFeatures(release: ReleaseNote): string {
  const modules: FeatureEntry['module'][] = ['editor', 'grid', 'storage', 'settings', 'shell'];
  const lines: string[] = [];
  lines.push('## Features');

  for (const mod of modules) {
    const features = getFeaturesByModule(mod);
    if (features.length === 0) continue;
    lines.push('');
    lines.push(`### module:${mod}`);
    lines.push('');
    lines.push(formatFeatureList(features));
  }

  return lines.join('\n');
}

function renderIpcReference(): string {
  return [
    '## IPC Command Reference',
    '',
    'All frontend-to-backend communication uses Tauri IPC `invoke()`. Direct filesystem access from the WebView is prohibited.',
    '',
    formatIpcCommandTable(IPC_COMMANDS),
  ].join('\n');
}

function renderFileFormat(): string {
  return [
    '## File Format',
    '',
    '### Note File Structure',
    '',
    '```markdown',
    '---',
    'tags: [tag1, tag2]',
    '---',
    '',
    'Note body in Markdown plain text...',
    '```',
    '',
    '| Property | Specification |',
    '|----------|--------------|',
    '| Filename | `YYYY-MM-DDTHHMMSS.md` (e.g., `2026-04-04T143052.md`) |',
    '| Encoding | UTF-8 |',
    '| Frontmatter | YAML format, `tags` field only |',
    '| Created date | Derived from filename (not stored in frontmatter) |',
    '| Storage | OS standard data directory or user-configured path |',
    '',
    '### Configuration File',
    '',
    '```json',
    '{',
    '  "notes_dir": "/path/to/notes/"',
    '}',
    '```',
    '',
    '| Platform | Config Path |',
    '|----------|------------|',
    '| Linux | `~/.local/share/promptnotes/config.json` |',
    '| macOS | `~/Library/Application Support/promptnotes/config.json` |',
  ].join('\n');
}

function renderKnownLimitations(release: ReleaseNote): string {
  const lines: string[] = [];
  lines.push('## Known Limitations');
  lines.push('');
  lines.push('| ID | Description | Threshold | Mitigation |');
  lines.push('|----|-----------|-----------|-----------|');
  for (const lim of release.knownLimitations) {
    lines.push(
      `| ${lim.id} | ${lim.description} | ${lim.threshold} | ${lim.mitigation} |`
    );
  }
  return lines.join('\n');
}

function renderScopeExclusions(release: ReleaseNote): string {
  const lines: string[] = [];
  lines.push('## Scope Exclusions (Not Implemented — By Design)');
  lines.push('');
  lines.push('The following features are explicitly **out of scope** and their presence would block release:');
  lines.push('');
  lines.push('| Excluded Item | Reason |');
  lines.push('|--------------|--------|');
  for (const ex of release.exclusions) {
    lines.push(`| ${ex.item} | ${ex.reason} |`);
  }
  return lines.join('\n');
}

function renderUpgradeNotes(release: ReleaseNote): string {
  const lines: string[] = [];
  lines.push('## Upgrade Notes');
  lines.push('');
  if (release.breakingChanges.length > 0) {
    lines.push('### Breaking Changes');
    lines.push('');
    for (const bc of release.breakingChanges) {
      lines.push(`- ${bc}`);
    }
    lines.push('');
  }
  for (const note of release.upgradeNotes) {
    lines.push(`- ${note}`);
  }
  return lines.join('\n');
}
