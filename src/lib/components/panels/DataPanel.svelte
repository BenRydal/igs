<script lang="ts">
  import type { Component } from 'svelte'
  import MdVideocam from '~icons/mdi/video'
  import MdFileUploadOutline from '~icons/mdi/file-upload-outline'
  import MdRoute from '~icons/mdi/routes'
  import MdMuseum from '~icons/mdi/bank'
  import MdTeacher from '~icons/mdi/human-male-board'
  import MdWalk from '~icons/mdi/walk'
  import MdVideo from '~icons/mdi/video-vintage'
  import MdShapeOutline from '~icons/mdi/shape-outline'
  import MdMagnify from '~icons/mdi/magnify'
  import MdMapMarkerPath from '~icons/mdi/map-marker-path'
  import MdMessageText from '~icons/mdi/message-text-outline'
  import MdTagOutline from '~icons/mdi/tag-outline'
  import MdStar from '~icons/mdi/star-outline'
  import MdChevronDown from '~icons/mdi/chevron-down'
  import MdChevronRight from '~icons/mdi/chevron-right'
  import MdClose from '~icons/mdi/close'
  import {
    EXAMPLE_COLLECTIONS,
    COLLECTIONS,
    VISIBLE_EXAMPLES,
    FEATURED_EXAMPLE,
    type CollectionId,
    type ExampleEntry,
  } from '#lib/core/example-datasets.ts'
  import {
    workspace,
    expandedCollections,
    loadExample,
    clearAll,
    clearMovement,
    clearConversation,
    clearCodes,
  } from '#lib/workspace/workspace.svelte.ts'
  import { icon, panelSection } from '#lib/components/panels/PanelRows.svelte'
  import UserStore from '../../../stores/userStore.ts'
  import CodeStore from '../../../stores/codeStore.ts'
  import VideoStore, { reset as resetVideo } from '../../../stores/videoStore.ts'
  import GPSStore from '../../../stores/gpsStore.ts'

  const collectionIcons: Record<CollectionId, Component> = {
    timss: MdVideo,
    tau: MdTeacher,
    tours: MdWalk,
    museums: MdMuseum,
    other: MdShapeOutline,
  }

  const normalizedFilter = $derived(workspace.exampleFilter.trim().toLowerCase())

  const filteredExamples = $derived(
    normalizedFilter
      ? VISIBLE_EXAMPLES.filter((entry) => {
          const collection = COLLECTIONS.find((c) => c.id === entry.collection)
          return (
            entry.label.toLowerCase().includes(normalizedFilter) ||
            (collection?.label.toLowerCase().includes(normalizedFilter) ?? false)
          )
        })
      : []
  )

  function toggleCollection(id: CollectionId) {
    if (expandedCollections.has(id)) {
      expandedCollections.delete(id)
    } else {
      expandedCollections.add(id)
    }
  }

  function collectionLabel(id: CollectionId) {
    return COLLECTIONS.find((c) => c.id === id)?.label ?? ''
  }

  type DataKind = {
    key: string
    label: string
    icon: Component
    detail: string
    clear: () => void
  }

  const loadedData = $derived.by<DataKind[]>(() => {
    const users = $UserStore
    const speakers = users.filter((u) => u.conversationIsLoaded).length
    const codes = $CodeStore.length
    const videoType = $VideoStore.source.type
    const isGPS = $GPSStore.isGPSMode

    return [
      {
        key: 'movement',
        label: isGPS ? 'Movement (GPS)' : 'Movement',
        icon: MdRoute,
        detail: users.length ? `${users.length} ${users.length === 1 ? 'person' : 'people'}` : '',
        clear: clearMovement,
      },
      {
        key: 'conversation',
        label: 'Conversation',
        icon: MdMessageText,
        detail: speakers ? `${speakers} ${speakers === 1 ? 'speaker' : 'speakers'}` : '',
        clear: clearConversation,
      },
      {
        key: 'codes',
        label: 'Codes',
        icon: MdTagOutline,
        detail: codes ? `${codes} ${codes === 1 ? 'code' : 'codes'}` : '',
        clear: clearCodes,
      },
      {
        key: 'video',
        label: 'Video',
        icon: MdVideocam,
        detail: videoType === 'youtube' ? 'YouTube' : videoType === 'file' ? 'File' : '',
        clear: resetVideo,
      },
    ]
  })

  const hasAnyData = $derived(loadedData.some((d) => d.detail !== ''))
</script>

{#snippet capability(Icon: Component, title: string)}
  <span class="w-3.5 h-3.5 opacity-45 shrink-0" {title} aria-hidden="true"><Icon /></span>
{/snippet}

{#snippet exampleRow(entry: ExampleEntry, showCollection: boolean, featured = false)}
  {@const isSelected = workspace.selectedExampleId === entry.id}
  <li>
    <button
      onclick={() => loadExample(entry.id)}
      aria-current={isSelected ? 'true' : undefined}
      class="flex items-start gap-2 w-full cursor-pointer {isSelected
        ? 'bg-primary/20 text-base-content font-medium'
        : ''}"
    >
      {#if featured}
        <span class="w-4 h-4 mt-0.5 text-primary shrink-0"><MdStar /></span>
      {/if}
      <span class="flex flex-col gap-0.5 min-w-0 flex-1">
        <span class="flex items-center gap-2 min-w-0">
          <span class="truncate flex-1 text-left">{entry.label}</span>
          <span class="text-xs opacity-70 shrink-0 tabular-nums">{entry.duration}</span>
        </span>
        <span class="flex items-center gap-1.5 text-xs opacity-70">
          {#if featured}<span class="text-primary">Start here</span>{/if}
          {#if showCollection}<span class="truncate">{collectionLabel(entry.collection)}</span>{/if}
          {#if entry.videoId}{@render capability(MdVideocam, 'Has video')}{/if}
          {#if entry.isGPS}{@render capability(MdMapMarkerPath, 'GPS data')}{/if}
          {#if entry.hasTranscript}{@render capability(MdMessageText, 'Has transcript')}{/if}
          {#if entry.hasCodes}{@render capability(MdTagOutline, 'Has codes')}{/if}
        </span>
      </span>
    </button>
  </li>
{/snippet}

<div class="flex flex-col gap-6 px-3 py-4">
  {#snippet yourDataBody()}
    {#if hasAnyData}
      <ul class="flex flex-col gap-0.5">
        {#each loadedData as kind (kind.key)}
          {@const loaded = kind.detail !== ''}
          <li
            class="flex items-center gap-2 rounded-lg px-2 py-1 text-sm {loaded
              ? ''
              : 'opacity-40'}"
          >
            {@render icon(kind.icon)}
            <span class="flex-1 truncate">{kind.label}</span>
            <span class="text-xs opacity-70 shrink-0">{loaded ? kind.detail : 'None'}</span>
            <button
              class="btn btn-ghost btn-xs btn-square shrink-0"
              onclick={kind.clear}
              disabled={!loaded}
              aria-label="Clear {kind.label.toLowerCase()}"
              title="Clear {kind.label.toLowerCase()}"
            >
              {@render icon(MdClose)}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-xs opacity-70 px-2">
        Nothing loaded yet — import your own files, or pick an example below.
      </p>
    {/if}

    <div class="flex items-center gap-2">
      <button
        id="btn-import-files"
        class="btn btn-sm btn-primary gap-2 flex-1"
        onclick={() => (workspace.importOpen = true)}
      >
        {@render icon(MdFileUploadOutline)}
        Import files
      </button>
      {#if hasAnyData}
        <button class="btn btn-sm btn-ghost text-error" onclick={clearAll}> Clear all </button>
      {/if}
    </div>
  {/snippet}
  {@render panelSection('Your data', yourDataBody)}

  {#snippet examplesBody()}
    <label class="input input-sm input-bordered flex items-center gap-2 w-full">
      {@render icon(MdMagnify)}
      <input
        type="search"
        class="grow min-w-0"
        placeholder="Filter examples"
        aria-label="Filter examples"
        bind:value={workspace.exampleFilter}
      />
    </label>

    {#if normalizedFilter}
      {#if filteredExamples.length}
        <ul class="menu w-full p-0">
          {#each filteredExamples as entry (entry.id)}
            {@render exampleRow(entry, true)}
          {/each}
        </ul>
      {:else}
        <p class="text-xs opacity-70 px-2 py-3">No examples match “{workspace.exampleFilter}”.</p>
      {/if}
    {:else}
      {#if FEATURED_EXAMPLE}
        <ul class="menu w-full p-0">
          {@render exampleRow(FEATURED_EXAMPLE, false, true)}
        </ul>
      {/if}

      <ul class="menu w-full p-0">
        {#each EXAMPLE_COLLECTIONS as collection (collection.id)}
          {@const isOpen = expandedCollections.has(collection.id)}
          <li>
            <button
              class="flex items-center gap-2 w-full cursor-pointer"
              onclick={() => toggleCollection(collection.id)}
              aria-expanded={isOpen}
              aria-controls="collection-{collection.id}"
            >
              {@render icon(isOpen ? MdChevronDown : MdChevronRight)}
              {@render icon(collectionIcons[collection.id])}
              <span class="flex-1 truncate text-left">{collection.label}</span>
              <span class="text-xs opacity-70 shrink-0 tabular-nums">
                {collection.items.length}
              </span>
            </button>

            <ul id="collection-{collection.id}" class="pl-2" hidden={!isOpen}>
              {#each collection.items as entry (entry.id)}
                {@render exampleRow(entry, false)}
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
  <div id="examples-list">{@render panelSection('Examples', examplesBody)}</div>
</div>
