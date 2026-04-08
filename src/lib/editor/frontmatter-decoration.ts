// Sprint 8/20/66 – CM6 StateField + Decoration for frontmatter background
// OQ-002 resolution: StateField approach (not ViewPlugin) for reliable decoration
import {
  StateField,
  type Extension,
  type Transaction,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
} from "@codemirror/view";
import { detectFrontmatterRange } from "../frontmatter";

/** CSS class applied to frontmatter line decorations */
const FRONTMATTER_LINE_CLASS = "cm-frontmatter-line";

/**
 * Create line decorations for all lines within the frontmatter range.
 */
function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc.toString();
  const range = detectFrontmatterRange(doc);
  if (!range) return Decoration.none;

  const decorations: any[] = [];
  const lineDeco = Decoration.line({ class: FRONTMATTER_LINE_CLASS });

  for (let pos = range.from; pos < range.to; ) {
    const line = view.state.doc.lineAt(pos);
    decorations.push(lineDeco.range(line.from));
    pos = line.to + 1;
  }

  return Decoration.set(decorations);
}

/**
 * StateField that tracks frontmatter decoration ranges.
 * Rebuilds decorations whenever the document changes.
 */
const frontmatterField = StateField.define<DecorationSet>({
  create(state) {
    // Build initial decorations using a temporary approach
    // We need an EditorView but don't have one during create,
    // so we detect the range directly from state.doc
    const doc = state.doc.toString();
    const range = detectFrontmatterRange(doc);
    if (!range) return Decoration.none;

    const decorations: any[] = [];
    const lineDeco = Decoration.line({ class: FRONTMATTER_LINE_CLASS });

    for (let pos = range.from; pos < range.to; ) {
      const line = state.doc.lineAt(pos);
      decorations.push(lineDeco.range(line.from));
      pos = line.to + 1;
    }
    return Decoration.set(decorations);
  },
  update(decos: DecorationSet, tr: Transaction) {
    if (!tr.docChanged) return decos;
    // Rebuild on any doc change
    const doc = tr.state.doc.toString();
    const range = detectFrontmatterRange(doc);
    if (!range) return Decoration.none;

    const decorations: any[] = [];
    const lineDeco = Decoration.line({ class: FRONTMATTER_LINE_CLASS });

    for (let pos = range.from; pos < range.to; ) {
      const line = tr.state.doc.lineAt(pos);
      decorations.push(lineDeco.range(line.from));
      pos = line.to + 1;
    }
    return Decoration.set(decorations);
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * Extension that applies a background style to the YAML frontmatter block.
 * Uses StateField + Decoration per OQ-002 resolution.
 */
export function frontmatterDecoration(): Extension {
  return [
    frontmatterField,
    EditorView.baseTheme({
      [`.${FRONTMATTER_LINE_CLASS}`]: {
        backgroundColor: "rgba(128, 128, 128, 0.08)",
      },
    }),
  ];
}
