// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/acceptance_criteria.md
// @generated-by: codd propagate
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function getDefaultNotesDir(): string {
  if (process.platform === 'linux') {
    return path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function generateFilename(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}T${h}${mi}${s}.md`;
}

export function buildNoteContent(tags: string[], body: string): string {
  const tagsYaml = tags.length > 0 ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}\n` : 'tags: []\n';
  return `---\n${tagsYaml}---\n\n${body}`;
}

export function createTestNote(dir: string, filename: string, tags: string[], body: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buildNoteContent(tags, body), 'utf-8');
  return filepath;
}

export function createNoteWithAge(dir: string, daysAgo: number, tags: string[], body: string): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const filename = generateFilename(date);
  return createTestNote(dir, filename, tags, body);
}

export function deleteTestNote(filepath: string): void {
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}

export function readNoteFile(filepath: string): { frontmatter: Record<string, unknown>; body: string } {
  const content = fs.readFileSync(filepath, 'utf-8');
  return parseNoteContent(content);
}

export function parseNoteContent(content: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!content.startsWith('---\n')) return { frontmatter: {}, body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: content };
  const yamlBlock = content.slice(4, end);
  const body = content.slice(end + 5);
  // minimal YAML parse for tags only
  const frontmatter: Record<string, unknown> = {};
  const tagsMatch = yamlBlock.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsMatch) {
    frontmatter.tags = tagsMatch[1].split(',').map((t) => t.trim()).filter(Boolean);
  } else {
    const listMatch = yamlBlock.match(/^tags:\n((?:\s+- .+\n?)*)/m);
    if (listMatch) {
      frontmatter.tags = listMatch[1].split('\n').map((l) => l.replace(/^\s+-\s+/, '').trim()).filter(Boolean);
    }
  }
  return { frontmatter, body };
}

export function listNotesInDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => FILENAME_REGEX.test(f));
}
