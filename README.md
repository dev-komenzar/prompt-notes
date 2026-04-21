# PromptNotes

> A notes app for rapidly capturing prompts to feed into AI tools. No title, just body. Write, then move on.

<!-- R-ABOUT-07 -->
<!-- TODO: screenshot pending -->
<img src="docs/images/main-view.png" width="720" alt="PromptNotes main view — top feed of recent notes">

## About

<!-- R-ABOUT-01 -->
PromptNotes is a desktop notes app for rapidly capturing prompts you hand off to AI tools. There is no title field — just body. Write a prompt, move on, and come back to past prompts when you need them.

<!-- R-ABOUT-02 -->
It is built for developers who paste prompts into terminals, IDEs, or chat UIs and want a dedicated place to draft, reuse, and look back at them. PromptNotes intentionally has no AI-calling capability — it is a place for prompts, not a client for running them.

<!-- R-ABOUT-03 -->
Core UX:

- **`Cmd+N` / `Ctrl+N`** instantly creates a new note and drops you into the editor.
- **One-click copy** places the entire body on your clipboard, ready to paste into the tool of your choice.
- **Top feed** shows your recent notes so you can scan, filter, and reopen past prompts.

<!-- R-ABOUT-04 -->
**Markdown files, anywhere you want them.** Every note is a plain `.md` file with a standard YAML frontmatter block. Point PromptNotes at a subdirectory inside your Obsidian vault and the same notes open in both apps — edit tags in Obsidian, write prompts in PromptNotes, and version them with Git. Nothing is locked inside a proprietary store.

<!-- R-ABOUT-05 -->
Built on Tauri (Rust + WebView) with Svelte and CodeMirror 6 — a small binary and a light memory footprint compared with Electron-based alternatives.

<!-- R-ABOUT-06 -->
**Out of scope (intentionally):** no AI invocation, no cloud sync, no title field, no Markdown rendering or preview, no mobile support.

## Install

<!-- R-INSTALL-01 -->
### Installing prebuilt binaries

🚧 **Not yet published.** Tracked in the roadmap below. Once GitHub Releases are available, this section will link to `.AppImage` (Linux) and `.dmg` (macOS) downloads.

<!-- R-INSTALL-02 -->
### Flatpak (Flathub)

Planned. See [`docs/requirements/requirements.md`](docs/requirements/requirements.md) §配布方式.

<!-- R-INSTALL-03 -->
### Homebrew Cask

Planned.

<!-- R-INSTALL-04 -->
### Nix (NixOS / flake)

Planned.

<!-- R-INSTALL-05 -->
### Building from source

**Prerequisites**

- Rust stable toolchain (via [rustup](https://rustup.rs/))
- Node.js 20 or newer
- npm
- System libraries required by Tauri v2 — see the [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform (e.g. `webkit2gtk`, `libsoup` on Linux; Xcode Command Line Tools on macOS).

**Build**

```sh
git clone https://github.com/dev-komenzar/promptnotes.git
cd promptnotes
npm install
npm run tauri build
```

The bundled binaries land under `src-tauri/target/release/bundle/`:

- Linux: `bundle/appimage/PromptNotes_<version>_amd64.AppImage`, `bundle/deb/...`
- macOS: `bundle/macos/PromptNotes.app`, `bundle/dmg/...`

Run the unbundled release binary directly with `./src-tauri/target/release/promptnotes`.

<!-- R-INSTALL-06 -->
### Running in development

```sh
npm run tauri dev
```

This starts Vite + Tauri with hot reload for the frontend and `cargo run` for the Rust side.

## Usage

<!-- R-USAGE-01 -->
### Quick start

1. Launch PromptNotes.
2. Press **`Cmd+N`** (macOS) or **`Ctrl+N`** (Linux) to create a new note. No filename, no title — just start typing.
3. The note is saved automatically as you write.
4. Click the **copy** button to send the full body to your clipboard, then paste it into your AI tool.
5. Hit `Cmd+N` / `Ctrl+N` again and move on.

<!-- R-USAGE-02 -->
### Keyboard shortcuts

**Creating a note**

| Shortcut | Action |
| --- | --- |
| `Cmd+N` (macOS) / `Ctrl+N` (Linux) | Create a new note |

**Feed navigation** — active when a card is focused or when nothing is focused

| Shortcut | Action |
| --- | --- |
| `↑` / `↓` | Move focus to the adjacent card. From the no-focus state, either key focuses the newest card at the top of the feed. Pressing `↓` at the bottom loads older notes (no-op if there are none). |
| `Enter` | Enter edit mode on the focused card |
| `Esc` (card focused) | Clear the card focus |
| `c` | Copy the focused card's body to the clipboard (same as the Copy button) |
| `d` or `Delete` | Delete the focused note immediately, without a confirmation dialog. Focus moves to the next card below, or above if there is none; when everything is deleted, focus is cleared. |

**Leaving edit mode**

| Shortcut | Action |
| --- | --- |
| `Esc` (in edit mode) | Auto-save and return to view mode. Focus stays on that card. |

Arrow keys drive card navigation only while a card is focused or nothing is focused. In edit mode they move the CodeMirror cursor, and while the search bar has focus they operate on the text input and filters.

Additional shortcuts will be listed here only after they are added to `docs/requirements/requirements.md`.

<!-- R-USAGE-03 -->
### Top feed

The top feed lists your recent notes in reverse chronological order. By default it shows the last 7 days. From the feed you can:

- Filter by **tag**.
- Filter by **date**.
- **Full-text search** across every note (PromptNotes walks the directory on each query — fast enough for typical prompt volumes).
- Click a note to jump straight back into the editor.

<!-- R-USAGE-04 -->
### Note file format and Obsidian

Each note is stored as a single `.md` file:

```
~/.local/share/com.promptnotes/notes/
└── 2026-04-19T143205.md
```

File name format: `YYYY-MM-DDTHHMMSS.md` — the creation timestamp is the identity; there is no separate title field.

File contents:

```markdown
---
tags: [gpt, coding]
---

Write your prompt body here...
```

The frontmatter is standard YAML. `tags` is the only metadata stored there — the creation time is derived from the filename.

**Obsidian workflow.** Point the save directory (see below) at a subfolder of your Obsidian vault, for example `~/ObsidianVault/PromptNotes/`. Both apps read and write the same `.md` files, so you can edit tags from Obsidian, write prompts in PromptNotes, and version both in Git.

<!-- R-USAGE-05 -->
<!-- TODO: screenshot pending -->
<img src="docs/images/editor.png" width="720" alt="PromptNotes editor — frontmatter area highlighted above the body">

## Configuration

<!-- R-CONFIG-01 -->
### Changing the save directory

Open the in-app settings screen and pick a new save directory. The change takes effect immediately; future notes are written to the new location.

<!-- R-CONFIG-02 -->
### Default save paths

| OS | Default directory |
| --- | --- |
| Linux | `~/.local/share/com.promptnotes/notes/` |
| macOS | `~/Library/Application Support/com.promptnotes/notes/` |

These paths are derived from Tauri's `app_data_dir()` API combined with the bundle identifier `com.promptnotes` (fixed by ADR-010).

<!-- R-CONFIG-03 -->
### Using an Obsidian vault as the save directory

A common setup is to point PromptNotes at a subdirectory of an existing Obsidian vault:

```
~/ObsidianVault/PromptNotes/
```

This lets you write prompts in PromptNotes, browse them inside Obsidian's graph / tag views, and commit the vault to Git without adding another tool to your workflow.

<!-- R-CONFIG-04 -->
### Where settings live

PromptNotes keeps its data under Tauri's per-platform application data directory:

| OS | Application data directory |
| --- | --- |
| Linux | `~/.local/share/com.promptnotes/` |
| macOS | `~/Library/Application Support/com.promptnotes/` |

The `notes/` subfolder inside this directory is the default location described above; any supporting files the app creates live alongside it.

<!-- R-CONFIG-05 -->
> **Note.** Only settings that appear in the product specification are documented here. Configuration items that are not part of the spec — such as global shortcut bindings, editor themes, fonts, or per-editor preferences — are intentionally omitted, even if they exist in the implementation. If you need one of those, please update the spec first and this section will follow.

---

🇯🇵 日本語版: [README_ja.md](README_ja.md)
