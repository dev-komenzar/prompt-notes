import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";

const frontmatterMark = Decoration.line({ class: "cm-frontmatter-line" });

class FrontmatterPlugin {
  decorations: DecorationSet;
  constructor(view: EditorView) {
    this.decorations = this.build(view);
  }
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.build(update.view);
    }
  }
  build(view: EditorView): DecorationSet {
    const text = view.state.doc.toString();
    const match = text.match(/^---\n[\s\S]*?\n---/);
    if (!match) return Decoration.none;
    const endPos = match[0].length;
    const decorations: ReturnType<typeof frontmatterMark.range>[] = [];
    for (let pos = 0; pos <= endPos; ) {
      const line = view.state.doc.lineAt(pos);
      decorations.push(frontmatterMark.range(line.from));
      if (line.to >= endPos) break;
      pos = line.to + 1;
    }
    return Decoration.set(decorations);
  }
}

export function frontmatterDecoration() {
  return ViewPlugin.fromClass(FrontmatterPlugin, {
    decorations: (v) => v.decorations,
  });
}
