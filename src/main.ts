Not needed for SvelteKit — the framework handles bootstrapping. This file can be removed.

---

Here's the final summary of the assembled project structure:

```
promptnotes/
├── package.json
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
├── src/
│   ├── app.html
│   ├── app.css
│   ├── lib/
│   │   ├── types.ts               # NoteEntry, Config, CreateNoteResult, ReadNoteResult, ListNotesParams, SearchNotesParams
│   │   ├── api.ts                 # IPC wrappers: createNote, saveNote, readNote, listNotes, searchNotes, deleteNote, getSettings, updateSettings
│   │   ├── stores.ts             # currentView, currentFilename, config, notes, loading, searchQuery, selectedTags, allTags, toasts + navigation helpers
│   │   ├── debounce.ts           # debounce with flush/cancel/pending
│   │   ├── clipboard.ts          # copyToClipboard, copyNoteBody
│   │   ├── frontmatter.ts        # generateFrontmatter, generateNoteContent, extractBody, detectFrontmatterRange, parseFrontmatterTags
│   │   ├── date-utils.ts         # formatDateParam, getDefaultDateRange, formatCreatedAt, formatRelativeTime
│   │   ├── editor/
│   │   │   ├── create-editor.ts   # createEditor (CodeMirror 6 setup)
│   │   │   ├── autosave.ts        # autosaveExtension (500ms debounce)
│   │   │   ├── keybindings.ts     # Mod-n keybinding
│   │   │   └── frontmatter-decoration.ts  # CM ViewPlugin for frontmatter background
│   │   └── components/
│   │       ├── Header.svelte      # App header with nav + New Note button
│   │       ├── ToastContainer.svelte  # Toast notifications
│   │       ├── EditorPage.svelte  # Editor with CodeMirror, auto-save, copy button
│   │       ├── GridView.svelte    # Masonry grid with CSS columns
│   │       ├── NoteCard.svelte    # Individual note card
│   │       ├── FilterBar.svelte   # Search + date + tag filters
│   │       └── SettingsPage.svelte  # Directory picker settings
│   └── routes/
│       ├── +layout.ts            # ssr=false, prerender=false
│       ├── +layout.svelte        # Root layout with Header + ToastContainer
│       ├── +page.svelte          # Grid view (default route /)
│       ├── new/
│       │   └── +page.svelte      # New note editor
│       ├── edit/
│       │   └── [filename]/
│       │       └── +page.svelte  # Edit existing note
│       └── settings/
│           └── +page.svelte      # Settings page
└── src-tauri/                    # Rust backend (existing, not modified)
```

Key design decisions made during assembly:

1. **SvelteKit routing** (not svelte-spa-router) — matches the existing `vite.config.ts` with `sveltekit()` and `@sveltejs/adapter-static`
2. **`filename`-based types** matching the existing `src/lib/types.ts` and `src/lib/api.ts` which align with the Rust backend
3. **Svelte 5 runes** (`$props`, `$state`, `$derived`) in all components
4. **CSS columns masonry** for the grid view — `columns: 3 280px` with `break-inside: avoid` on cards
5. **Store-based view state** coexisting with SvelteKit file-based routing
6. **Auto-save** via `EditorView.updateListener` with 500ms debounce
7. **Cmd+N** keybinding via CodeMirror keymap (`Mod-n`)
8. **1-click copy** strips frontmatter via `extractBody()` before `navigator.clipboard.writeText()`
9. **Default 7-day filter** via `getDefaultDateRange(7)`
10. **Search debounce** 300ms in grid page
