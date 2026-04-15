<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { EditorView, keymap } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { defaultKeymap } from "@codemirror/commands";
  import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
  import { frontmatterDecoration } from "./frontmatter-decoration";

  export let content: string;
  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let editorView: EditorView | null = null;

  export function getContent(): string {
    return editorView?.state.doc.toString() ?? "";
  }

  onMount(() => {
    editorView = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          syntaxHighlighting(defaultHighlightStyle),
          keymap.of(defaultKeymap),
          frontmatterDecoration(),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },
            ".cm-content": { fontFamily: "'SF Mono', 'Fira Code', monospace", padding: "12px" },
            ".cm-focused": { outline: "none" },
          }),
          EditorView.lineWrapping,
        ],
      }),
      parent: container,
    });
    editorView.focus();
    dispatch("ready");
  });

  onDestroy(() => {
    editorView?.destroy();
    editorView = null;
  });
</script>

<div class="note-editor" bind:this={container}></div>

<style>
  .note-editor {
    min-height: 180px;
  }
</style>
