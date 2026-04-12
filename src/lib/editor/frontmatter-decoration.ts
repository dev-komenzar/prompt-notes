import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const frontmatterLineDecoration = Decoration.line({
  attributes: { class: 'cm-frontmatter-line' }
});

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  if (doc.lines < 1) return builder.finish();

  const firstLine = doc.line(1);
  if (firstLine.text !== '---') return builder.finish();

  builder.add(firstLine.from, firstLine.from, frontmatterLineDecoration);

  for (let i = 2; i <= doc.lines; i++) {
    const line = doc.line(i);
    builder.add(line.from, line.from, frontmatterLineDecoration);
    if (line.text === '---') {
      break;
    }
  }

  return builder.finish();
}

export const frontmatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations
  }
);
