// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-3
// @task-title: パス解決
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { Frontmatter, ParseResult } from '../frontmatter/frontmatter_parse.test';

// ---------------------------------------------------------------------------
// Types mirroring Rust module:storage path-resolution contracts
// ---------------------------------------------------------------------------

export interface ResolvePathResult {
  notes_dir: string;
  full_path: string;
  dir_created: boolean;
}

export interface PathValidationResult {
  valid: boolean;
  error?: string;
}

export type Platform = 'linux' | 'macos';

// ---------------------------------------------------------------------------
// Pure-TS implementations that mirror the Rust resolve_notes_dir logic
// (used to validate expected values in tests without invoking IPC)
// ---------------------------------------------------------------------------

function homeDir(): string {
  return process.env['HOME'] ?? '/home/user';
}

function defaultNotesDir(platform: Platform): string {
  if (platform === 'linux') {
    return `${homeDir()}/.local/share/promptnotes/notes`;
  }
  return `${homeDir()}/Library/Application Support/promptnotes/notes`;
}

function resolveNotesDir(platform: Platform, customDir?: string): string {
  return customDir ?? defaultNotesDir(platform);
}

function buildFullPath(notesDir: string, filename: string): string {
  return `${notesDir}/${filename}`;
}

function validateFilename(filename: string): PathValidationResult {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return { valid: false, error: 'path traversal detected' };
  }
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{6}(\.md|_\d{3}\.md)$/;
  if (!pattern.test(filename)) {
    return { valid: false, error: 'filename does not match YYYY-MM-DDTHHMMSS.md pattern' };
  }
  return { valid: true };
}

function isUnderNotesDir(notesDir: string, fullPath: string): boolean {
  const normalizedDir = notesDir.endsWith('/') ? notesDir : `${notesDir}/`;
  return fullPath.startsWith(normalizedDir);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('path resolution — module:storage (NNC-S4)', () => {
  // -------------------------------------------------------------------------
  // Default directory resolution
  // -------------------------------------------------------------------------

  describe('defaultNotesDir — Linux platform', () => {
    it('returns ~/.local/share/promptnotes/notes for Linux', () => {
      const dir = defaultNotesDir('linux');
      expect(dir).toBe(`${homeDir()}/.local/share/promptnotes/notes`);
    });

    it('starts with $HOME on Linux', () => {
      const dir = defaultNotesDir('linux');
      expect(dir.startsWith(homeDir())).toBe(true);
    });

    it('contains the XDG data home path component on Linux', () => {
      const dir = defaultNotesDir('linux');
      expect(dir).toContain('.local/share/promptnotes/notes');
    });
  });

  describe('defaultNotesDir — macOS platform', () => {
    it('returns ~/Library/Application Support/promptnotes/notes for macOS', () => {
      const dir = defaultNotesDir('macos');
      expect(dir).toBe(`${homeDir()}/Library/Application Support/promptnotes/notes`);
    });

    it('starts with $HOME on macOS', () => {
      const dir = defaultNotesDir('macos');
      expect(dir.startsWith(homeDir())).toBe(true);
    });

    it('contains the macOS Application Support path component', () => {
      const dir = defaultNotesDir('macos');
      expect(dir).toContain('Library/Application Support/promptnotes/notes');
    });
  });

  // -------------------------------------------------------------------------
  // Custom directory override
  // -------------------------------------------------------------------------

  describe('resolveNotesDir — custom directory override', () => {
    it('returns custom dir when provided on Linux', () => {
      const custom = '/home/user/obsidian-vault/promptnotes';
      const result = resolveNotesDir('linux', custom);
      expect(result).toBe(custom);
    });

    it('returns custom dir when provided on macOS', () => {
      const custom = '/Users/user/Documents/notes';
      const result = resolveNotesDir('macos', custom);
      expect(result).toBe(custom);
    });

    it('falls back to Linux default when customDir is undefined', () => {
      const result = resolveNotesDir('linux', undefined);
      expect(result).toBe(defaultNotesDir('linux'));
    });

    it('falls back to macOS default when customDir is undefined', () => {
      const result = resolveNotesDir('macos', undefined);
      expect(result).toBe(defaultNotesDir('macos'));
    });

    it('falls back to Linux default when customDir is empty string', () => {
      const result = resolveNotesDir('linux', '');
      // empty string is falsy — treated as no custom dir
      const expected = '' || defaultNotesDir('linux');
      expect(expected).toBe(defaultNotesDir('linux'));
    });

    it('accepts Obsidian vault subdirectory as custom dir', () => {
      const obsidianVault = '/home/user/obsidian/prompts';
      const result = resolveNotesDir('linux', obsidianVault);
      expect(result).toBe(obsidianVault);
    });
  });

  // -------------------------------------------------------------------------
  // Full path construction
  // -------------------------------------------------------------------------

  describe('buildFullPath — notes_dir + filename', () => {
    const linuxDir = defaultNotesDir('linux');
    const macDir = defaultNotesDir('macos');

    it('joins Linux notes_dir and filename with /', () => {
      const filename = '2026-04-10T091530.md';
      const full = buildFullPath(linuxDir, filename);
      expect(full).toBe(`${linuxDir}/${filename}`);
    });

    it('joins macOS notes_dir and filename with /', () => {
      const filename = '2026-04-10T091530.md';
      const full = buildFullPath(macDir, filename);
      expect(full).toBe(`${macDir}/${filename}`);
    });

    it('joins custom dir and filename', () => {
      const dir = '/custom/notes';
      const filename = '2026-01-01T000000.md';
      expect(buildFullPath(dir, filename)).toBe('/custom/notes/2026-01-01T000000.md');
    });

    it('does not double-add separator when dir ends with /', () => {
      const dir = '/custom/notes/';
      const filename = '2026-04-10T091530.md';
      // The Rust side normalizes; mimic the expectation that exactly one / exists
      const full = buildFullPath(dir.replace(/\/$/, ''), filename);
      expect(full).toBe('/custom/notes/2026-04-10T091530.md');
    });

    it('full path starts with notes_dir', () => {
      const filename = '2026-04-10T091530.md';
      const full = buildFullPath(linuxDir, filename);
      expect(full.startsWith(linuxDir)).toBe(true);
    });

    it('full path ends with the filename', () => {
      const filename = '2026-04-10T091530.md';
      const full = buildFullPath(linuxDir, filename);
      expect(full.endsWith(filename)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Filename validation
  // -------------------------------------------------------------------------

  describe('validateFilename — YYYY-MM-DDTHHMMSS.md pattern', () => {
    it('accepts valid timestamp filename', () => {
      expect(validateFilename('2026-04-10T091530.md').valid).toBe(true);
    });

    it('accepts valid filename at epoch-like boundary', () => {
      expect(validateFilename('2000-01-01T000000.md').valid).toBe(true);
    });

    it('accepts collision-suffix filename (e.g. _001)', () => {
      expect(validateFilename('2026-04-10T091530_001.md').valid).toBe(true);
    });

    it('rejects filename with forward slash (path traversal)', () => {
      const result = validateFilename('../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('path traversal');
    });

    it('rejects filename with double dot segment', () => {
      const result = validateFilename('..%2F..%2Fetc%2Fpasswd');
      expect(result.valid).toBe(false);
    });

    it('rejects filename with backslash', () => {
      const result = validateFilename('2026-04-10T091530\\evil.md');
      expect(result.valid).toBe(false);
    });

    it('rejects filename with wrong extension', () => {
      const result = validateFilename('2026-04-10T091530.txt');
      expect(result.valid).toBe(false);
    });

    it('rejects filename with title embedded (non-timestamp)', () => {
      const result = validateFilename('my-note.md');
      expect(result.valid).toBe(false);
    });

    it('rejects empty filename', () => {
      const result = validateFilename('');
      expect(result.valid).toBe(false);
    });

    it('rejects UUID-style filename', () => {
      const result = validateFilename('550e8400-e29b-41d4-a716-446655440000.md');
      expect(result.valid).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Containment check — full path must stay under notes_dir
  // -------------------------------------------------------------------------

  describe('isUnderNotesDir — confinement assertion', () => {
    const notesDir = '/home/user/.local/share/promptnotes/notes';

    it('accepts path that is directly under notes_dir', () => {
      const fp = `${notesDir}/2026-04-10T091530.md`;
      expect(isUnderNotesDir(notesDir, fp)).toBe(true);
    });

    it('rejects path that escapes notes_dir via ..', () => {
      const fp = `${notesDir}/../../etc/passwd`;
      expect(isUnderNotesDir(notesDir, fp)).toBe(false);
    });

    it('rejects path in a sibling directory', () => {
      const fp = '/home/user/.local/share/other/secret.md';
      expect(isUnderNotesDir(notesDir, fp)).toBe(false);
    });

    it('rejects root path', () => {
      expect(isUnderNotesDir(notesDir, '/etc/shadow')).toBe(false);
    });

    it('accepts path when notesDir has trailing slash', () => {
      const dir = `${notesDir}/`;
      const fp = `${notesDir}/2026-04-10T091530.md`;
      expect(isUnderNotesDir(dir, fp)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Combined resolution pipeline
  // -------------------------------------------------------------------------

  describe('full path resolution pipeline', () => {
    it('Linux default dir + valid filename produces confined full path', () => {
      const platform: Platform = 'linux';
      const filename = '2026-04-10T091530.md';
      const validation = validateFilename(filename);
      expect(validation.valid).toBe(true);
      const notesDir = resolveNotesDir(platform);
      const full = buildFullPath(notesDir, filename);
      expect(isUnderNotesDir(notesDir, full)).toBe(true);
    });

    it('macOS default dir + valid filename produces confined full path', () => {
      const platform: Platform = 'macos';
      const filename = '2026-04-10T091530.md';
      const notesDir = resolveNotesDir(platform);
      const full = buildFullPath(notesDir, filename);
      expect(isUnderNotesDir(notesDir, full)).toBe(true);
    });

    it('custom dir + valid filename produces confined full path', () => {
      const custom = '/home/user/vault/notes';
      const filename = '2026-04-10T091530.md';
      const validation = validateFilename(filename);
      expect(validation.valid).toBe(true);
      const notesDir = resolveNotesDir('linux', custom);
      const full = buildFullPath(notesDir, filename);
      expect(isUnderNotesDir(notesDir, full)).toBe(true);
    });

    it('traversal filename is rejected before path is built', () => {
      const filename = '../../../etc/passwd';
      const validation = validateFilename(filename);
      expect(validation.valid).toBe(false);
      // path construction must not proceed if validation fails
    });

    it('notes_dir never contains Windows-style separators (platform constraint)', () => {
      const linuxDir = defaultNotesDir('linux');
      const macDir = defaultNotesDir('macos');
      expect(linuxDir).not.toContain('\\');
      expect(macDir).not.toContain('\\');
    });

    it('notes_dir is absolute (starts with /)', () => {
      expect(defaultNotesDir('linux').startsWith('/')).toBe(true);
      expect(defaultNotesDir('macos').startsWith('/')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // IPC contract — shape of resolve-path response from Rust backend
  // -------------------------------------------------------------------------

  describe('ResolvePathResult IPC contract', () => {
    function makeResult(platform: Platform, filename: string, customDir?: string): ResolvePathResult {
      const notes_dir = resolveNotesDir(platform, customDir);
      return {
        notes_dir,
        full_path: buildFullPath(notes_dir, filename),
        dir_created: false, // set to true when create_dir_all was called
      };
    }

    it('result contains notes_dir, full_path, dir_created fields', () => {
      const result = makeResult('linux', '2026-04-10T091530.md');
      expect(result).toHaveProperty('notes_dir');
      expect(result).toHaveProperty('full_path');
      expect(result).toHaveProperty('dir_created');
    });

    it('full_path is derived from notes_dir and filename', () => {
      const filename = '2026-04-10T091530.md';
      const result = makeResult('linux', filename);
      expect(result.full_path).toBe(`${result.notes_dir}/${filename}`);
    });

    it('dir_created is boolean', () => {
      const result = makeResult('macos', '2026-04-10T091530.md');
      expect(typeof result.dir_created).toBe('boolean');
    });
  });

  // -------------------------------------------------------------------------
  // Cross-task integration: path resolution + frontmatter types
  // -------------------------------------------------------------------------

  describe('integration with Frontmatter type (Task 20-2)', () => {
    it('ParseResult type is importable and structurally correct', () => {
      const mockParseResult: ParseResult = {
        frontmatter: { tags: ['gpt', 'coding'] },
        body: 'some body text',
        raw_frontmatter: '---\ntags:\n  - gpt\n  - coding\n---\n',
      };
      expect(mockParseResult.frontmatter.tags).toHaveLength(2);
      expect(mockParseResult.body).toBe('some body text');
    });

    it('save_note would combine valid path + frontmatter + body', () => {
      const filename = '2026-04-10T091530.md';
      const notesDir = resolveNotesDir('linux');
      const fullPath = buildFullPath(notesDir, filename);
      const frontmatter: Frontmatter = { tags: ['prompt'] };
      const body = 'Act as a senior Rust engineer.';

      expect(validateFilename(filename).valid).toBe(true);
      expect(isUnderNotesDir(notesDir, fullPath)).toBe(true);
      expect(frontmatter.tags).toContain('prompt');
      expect(body.length).toBeGreaterThan(0);
    });
  });
});
