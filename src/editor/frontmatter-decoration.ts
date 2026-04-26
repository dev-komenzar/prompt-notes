import {
  EditorView,
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

const frontmatterDeco = Decoration.line({
  attributes: { class: "cm-frontmatter-line" },
});

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const text = doc.toString();

  // Check if doc starts with ---
  if (!text.startsWith("---\n")) return builder.finish();

  // Find closing ---
  const closeIdx = text.indexOf("\n---\n", 4);
  if (closeIdx < 0) return builder.finish();

  const endPos = closeIdx + 5; // after `\n---\n`

  // Add decoration to each line in frontmatter range
  for (let pos = 0; pos < endPos; ) {
    const line = doc.lineAt(pos);
    builder.add(line.from, line.from, frontmatterDeco);
    pos = line.to + 1;
  }

  return builder.finish();
}

export function frontmatterHighlight() {
  return [
    ViewPlugin.fromClass(
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
        decorations: (v) => v.decorations,
      }
    ),
    EditorView.baseTheme({
      ".cm-frontmatter-line": {
        backgroundColor: "var(--frontmatter-bg)",
      },
    }),
  ];
}
