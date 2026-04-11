import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { frontmatterDecorationPlugin } from './frontmatter-decoration';
import { autosaveExtension, type SaveCallback } from './autosave';
import { editorKeymap, type KeybindingAction } from './keybindings';

export interface EditorOptions {
  parent: HTMLElement;
  content: string;
  onSave: SaveCallback;
  onNewNote: KeybindingAction;
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'var(--color-bg)'
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    caretColor: 'var(--color-primary)',
    padding: '16px 0'
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-muted)',
    border: 'none',
    minWidth: '48px'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--color-bg-secondary)'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(69, 71, 90, 0.3)'
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-primary)'
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(137, 180, 250, 0.2) !important'
  },
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--color-frontmatter-bg)',
    opacity: '0.7'
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(137, 180, 250, 0.3) !important'
  }
});

export function createEditor(options: EditorOptions): EditorView {
  const { parent, content, onSave, onNewNote } = options;

  const state = EditorState.create({
    doc: content,
    selection: { anchor: content.length },
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      markdown(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      editorKeymap({ newNote: onNewNote }),
      frontmatterDecorationPlugin,
      autosaveExtension(onSave),
      editorTheme,
      EditorView.lineWrapping
    ]
  });

  const view = new EditorView({ state, parent });
  view.focus();
  return view;
}
