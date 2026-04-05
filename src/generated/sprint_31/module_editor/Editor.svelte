<!-- @codd:generated sprint_31 task_31-1 module:editor -->
<!-- CodeMirror 6 editor component.  No title input field. No Markdown preview. -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorController } from './editor-controller';
  import CopyButton from './CopyButton.svelte';

  /** Filename of an existing note to load.  If empty a new note is created. */
  export let filename = '';

  let editorContainer: HTMLElement;
  let controller: EditorController;
  let ready = false;

  function getBodyText(): string {
    if (!controller) return '';
    return controller.getBodyText();
  }

  function handleBeforeUnload(): void {
    if (controller) {
      controller.flushPendingSave();
    }
  }

  onMount(async () => {
    controller = new EditorController();
    controller.mount(editorContainer);

    if (filename) {
      await controller.loadNote(filename);
    } else {
      await controller.handleCreateNewNote();
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    ready = true;
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    if (controller) {
      controller.destroy();
    }
  });
</script>

<div class="editor-screen">
  <div class="editor-toolbar">
    {#if ready}
      <CopyButton getTextFn={getBodyText} />
    {/if}
  </div>
  <div class="editor-container" bind:this={editorContainer}></div>
</div>

<style>
  .editor-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .editor-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 4px 8px;
    flex-shrink: 0;
  }

  .editor-container {
    flex: 1;
    overflow: auto;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .editor-container :global(.cm-scroller) {
    overflow: auto;
  }
</style>
