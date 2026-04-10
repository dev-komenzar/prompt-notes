<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEditor, type EditorOptions } from '../editor/create-editor';
  import type { EditorView } from '@codemirror/view';

  interface Props {
    content: string;
    onSave: (content: string) => void;
    onNewNote: () => boolean;
  }

  let { content, onSave, onNewNote }: Props = $props();

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;

  onMount(() => {
    view = createEditor({
      parent: editorContainer,
      content,
      onSave,
      onNewNote
    });
  });

  onDestroy(() => {
    view?.destroy();
  });

  export function getContent(): string {
    return view?.state.doc.toString() ?? content;
  }
</script>

<div class="editor-wrapper" bind:this={editorContainer}></div>

<style>
  .editor-wrapper {
    flex: 1;
    overflow: auto;
  }

  .editor-wrapper :global(.cm-editor) {
    height: 100%;
  }

  .editor-wrapper :global(.cm-scroller) {
    overflow: auto;
  }
</style>
