// Sprint 11/23 – Full CM6 editor setup combining all extensions
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { keymap } from "@codemirror/view";
import { frontmatterDecoration } from "./frontmatter-decoration";
import { autosaveExtension } from "./autosave";
import { newNoteKeymap } from "./keymaps";

export interface EditorSetupOptions {
  /** Initial document content */
  doc?: string;
  /** Parent element to mount the editor into */
  parent: HTMLElement;
  /** Auto-save callback (receives full doc text) */
  onSave: (content: string) => void | Promise<void>;
  /** New note callback (Mod-n) */
  onNewNote: () => void;
  /** Additional extensions */
  extraExtensions?: Extension[];
}

/**
 * Create and mount a fully-configured CM6 EditorView.
 */
export function createEditor(options: EditorSetupOptions): EditorView {
  const {
    doc = "",
    parent,
    onSave,
    onNewNote,
    extraExtensions = [],
  } = options;

  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    bracketMatching(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    markdown(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
    frontmatterDecoration(),
    autosaveExtension(onSave),
    newNoteKeymap(onNewNote),
    EditorView.lineWrapping,
    // Custom base theme for the editor
    EditorView.baseTheme({
      "&": {
        height: "100%",
        fontSize: "14px",
      },
      ".cm-scroller": {
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        overflow: "auto",
      },
      ".cm-content": {
        padding: "8px 0",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "var(--accent-color, #4a9eff)",
      },
    }),
    ...extraExtensions,
  ];

  const state = EditorState.create({ doc, extensions });

  return new EditorView({ state, parent });
}
