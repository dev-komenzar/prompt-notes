<script lang="ts">
  import { onMount } from 'svelte';
  import GridView from '$lib/components/GridView.svelte';
  import { notes, loading, searchQuery, selectedTags, allTags, addToast } from '$lib/stores';
  import { listNotes, searchNotes } from '$lib/api';
  import { getDefaultDateRange } from '$lib/date-utils';
  import { debounce } from '$lib/debounce';

  let dateRange = $state(getDefaultDateRange());

  const loadNotes = async () => {
    loading.set(true);
    try {
      let query = '';
      searchQuery.subscribe(v => query = v)();
      let tags: string[] = [];
      selectedTags.subscribe(v => tags = v)();

      const params = {
        date_from: dateRange.from,
        date_to: dateRange.to,
        tags: tags.length > 0 ? tags : undefined,
      };

      let result;
      if (query.trim()) {
        result = await searchNotes({ query: query.trim(), ...params });
      } else {
        result = await listNotes(params);
      }
      notes.set(result);

      const tagSet = new Set<string>();
      result.forEach(n => n.tags.forEach(t => tagSet.add(t)));
      allTags.set([...tagSet].sort());
    } catch (err) {
      addToast('error', `ノートの読み込みに失敗しました: ${err}`);
    } finally {
      loading.set(false);
    }
  };

  const debouncedLoad = debounce(loadNotes, 300);

  onMount(() => {
    loadNotes();
    const unsubQuery = searchQuery.subscribe(() => debouncedLoad());
    const unsubTags = selectedTags.subscribe(() => loadNotes());
    return () => {
      unsubQuery();
      unsubTags();
      debouncedLoad.cancel();
    };
  });

  function handleDateChange(from: string, to: string) {
    dateRange = { from, to };
    loadNotes();
  }
</script>

<GridView
  {dateRange}
  onDateChange={handleDateChange}
  onRefresh={loadNotes}
/>
