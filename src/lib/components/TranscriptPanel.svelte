<script lang="ts">
  import { onMount } from 'svelte'
  import UserStore from '../../stores/userStore'
  import HoveredConversationStore from '../../stores/interactionStore'
  import ConfigStore from '../../stores/configStore'
  import { requestSeek, hasVideoSource } from '../../stores/videoStore'
  import TimelineStore from '../../stores/timelineStore'
  import P5Store from '../../stores/p5Store'
  import { formatTime, parseTime } from '../utils/format'
  import MdClose from '~icons/mdi/close'
  import MdPencil from '~icons/mdi/pencil'

  interface TranscriptEntry {
    time: number
    speaker: string
    text: string
    color: string
    userIndex: number
    pointIndex: number
  }

  // Props
  let { isVisible = $bindable(false) }: { isVisible?: boolean } = $props()

  // Search state - derived from ConfigStore (single source of truth)
  let searchQuery = $derived($ConfigStore.wordToSearch)

  // Panel dimensions
  const MIN_WIDTH = 280
  const MIN_HEIGHT = 200
  const DEFAULT_WIDTH = 320
  const DEFAULT_HEIGHT = 400

  // Panel state
  let posX = $state(20)
  let posY = $state(80)
  let width = $state(DEFAULT_WIDTH)
  let height = $state(DEFAULT_HEIGHT)

  // Drag state
  let isDragging = $state(false)
  let dragStartX = 0
  let dragStartY = 0
  let dragStartPosX = 0
  let dragStartPosY = 0

  // Resize state
  let isResizing = $state(false)
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeStartWidth = 0
  let resizeStartHeight = 0

  // Edit state
  let editingIndex = $state<number | null>(null)
  let editTime = $state('')
  let editTimeError = $state('')
  let editText = $state('')

  // Scroll container ref
  let scrollContainer: HTMLDivElement | undefined = $state()

  // Store subscriptions
  let hoveredConversation = $derived($HoveredConversationStore)
  let timelineCurrTime = $derived($TimelineStore.getCurrTime())

  // Current time: hover takes priority, otherwise timeline
  let currentTime = $derived(hoveredConversation?.turns[0]?.time ?? timelineCurrTime)

  // Build sorted transcript entries using flatMap
  let allEntries = $derived.by(() => {
    return $UserStore
      .flatMap((user, userIndex) =>
        user.conversationIsLoaded
          ? user.dataTrail
              .map((point, pointIndex) => ({
                time: point.time,
                speaker: user.name,
                text: point.speech,
                color: user.color,
                userIndex,
                pointIndex
              }))
              .filter((entry): entry is TranscriptEntry =>
                entry.text != null && entry.text.trim() !== '' && entry.time != null
              )
          : []
      )
      .sort((a, b) => a.time - b.time)
  })

  // Filter entries based on search query (text only, matches visualization)
  let transcriptEntries = $derived.by(() => {
    if (!searchQuery) return allEntries
    const query = searchQuery.toLowerCase()
    return allEntries.filter(entry => entry.text.toLowerCase().includes(query))
  })

  // Update search query in ConfigStore (trim to avoid whitespace-only searches)
  function setSearch(value: string) {
    ConfigStore.update(config => ({ ...config, wordToSearch: value.trim() }))
    $P5Store?.loop()
  }

  // Highlight matching text in search results
  function highlightMatch(text: string): string {
    if (!searchQuery) return text
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
  }

  // Find active entry (closest to current time, not exceeding it)
  let activeEntryIndex = $derived.by(() => {
    let lastIndex = -1
    for (let i = 0; i < transcriptEntries.length; i++) {
      if (transcriptEntries[i].time <= currentTime) {
        lastIndex = i
      } else {
        break
      }
    }
    return lastIndex
  })

  // Auto-scroll to active entry
  let prevActiveIndex = $state(-1)
  $effect(() => {
    if (activeEntryIndex >= 0 && activeEntryIndex !== prevActiveIndex && scrollContainer) {
      prevActiveIndex = activeEntryIndex
      const activeElement = scrollContainer.querySelector(`[data-index="${activeEntryIndex}"]`)
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })

  function handleEntryClick(entry: TranscriptEntry) {
    if (editingIndex !== null) return

    TimelineStore.update(timeline => {
      timeline.setCurrTime(entry.time)
      return timeline
    })

    if (hasVideoSource()) {
      requestSeek(entry.time)
    }

    $P5Store?.loop()
  }

  function startEditing(entry: TranscriptEntry, index: number, e: MouseEvent) {
    e.stopPropagation()
    editingIndex = index
    editTime = formatTime(entry.time)
    editText = entry.text
  }

  function deleteEntry(entry: TranscriptEntry) {
    UserStore.update(users => {
      users[entry.userIndex].dataTrail[entry.pointIndex].speech = ''
      return users
    })
    $P5Store?.loop()
    cancelEditing()
  }

  function cancelEditing() {
    editingIndex = null
    editTime = ''
    editTimeError = ''
    editText = ''
  }

  function saveEditing(entry: TranscriptEntry) {
    const newTime = parseTime(editTime)
    if (newTime === null) {
      editTimeError = 'Invalid format (use M:SS)'
      return
    }

    UserStore.update(users => {
      const point = users[entry.userIndex].dataTrail[entry.pointIndex]
      point.time = newTime
      point.speech = editText
      return users
    })

    $P5Store?.loop()
    cancelEditing()
  }

  function handleDragStart(e: MouseEvent) {
    if (isResizing) return
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragStartPosX = posX
    dragStartPosY = posY
    e.preventDefault()
  }

  function handleResizeStart(e: MouseEvent) {
    isResizing = true
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeStartWidth = width
    resizeStartHeight = height
    e.preventDefault()
    e.stopPropagation()
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDragging) {
      // Keep at least 50px visible so panel is always recoverable
      const margin = 50
      posX = Math.max(-width + margin, Math.min(dragStartPosX + e.clientX - dragStartX, window.innerWidth - margin))
      posY = Math.max(0, Math.min(dragStartPosY + e.clientY - dragStartY, window.innerHeight - margin))
    }
    if (isResizing) {
      width = Math.max(MIN_WIDTH, resizeStartWidth + (e.clientX - resizeStartX))
      height = Math.max(MIN_HEIGHT, resizeStartHeight + (e.clientY - resizeStartY))
    }
  }

  function handleMouseUp() {
    isDragging = false
    isResizing = false
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  })
</script>

{#if isVisible}
  <div
    class="transcript-panel"
    style="left: {posX}px; top: {posY}px; width: {width}px; height: {height}px;"
  >
    <div
      class="panel-header"
      class:dragging={isDragging}
      onmousedown={handleDragStart}
      role="button"
      tabindex="0"
      aria-label="Drag to move transcript panel"
    >
      <span class="panel-title">Transcript</span>
      <button
        class="icon-btn"
        onclick={() => isVisible = false}
        aria-label="Close transcript"
      >
        <MdClose />
      </button>
    </div>

    <!-- Search bar -->
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search transcript..."
        value={searchQuery}
        oninput={(e) => setSearch((e.target as HTMLInputElement).value)}
        class="search-input"
      />
      {#if searchQuery}
        <button class="icon-btn" onclick={() => setSearch('')} aria-label="Clear search">
          <MdClose />
        </button>
        <span class="search-count">{transcriptEntries.length}/{allEntries.length}</span>
      {/if}
    </div>

    <div class="transcript-content" bind:this={scrollContainer}>
      {#if allEntries.length === 0}
        <div class="empty-state">No conversation data loaded.</div>
      {:else if transcriptEntries.length === 0}
        <div class="empty-state">No matches found for "{searchQuery}"</div>
      {:else}
        {#each transcriptEntries as entry, index}
          {#if editingIndex === index}
            <div class="transcript-entry editing" data-index={index}>
              <div class="edit-row">
                <div class="time-field">
                  <input
                    type="text"
                    class="edit-time"
                    class:error={editTimeError}
                    bind:value={editTime}
                    oninput={() => editTimeError = ''}
                    placeholder="0:00"
                  />
                  {#if editTimeError}
                    <span class="time-error">{editTimeError}</span>
                  {/if}
                </div>
                <span class="edit-speaker-label" style="color: {entry.color}">{entry.speaker}</span>
              </div>
              <textarea
                class="edit-text"
                bind:value={editText}
                rows="3"
              ></textarea>
              <div class="edit-actions">
                <button class="btn-delete" onclick={() => deleteEntry(entry)}>Delete</button>
                <button class="btn-cancel" onclick={cancelEditing}>Cancel</button>
                <button class="btn-save" onclick={() => saveEditing(entry)}>Save</button>
              </div>
            </div>
          {:else}
            <div
              class="transcript-entry"
              class:active={index === activeEntryIndex}
              style="--speaker-color: {entry.color}"
              data-index={index}
              onclick={() => handleEntryClick(entry)}
              onkeydown={(e) => e.key === 'Enter' && handleEntryClick(entry)}
              role="button"
              tabindex="0"
            >
              <div class="entry-header">
                <span class="entry-time">{formatTime(entry.time)}</span>
                <span class="entry-speaker" style="color: {entry.color}">{entry.speaker}</span>
                <button
                  class="icon-btn edit-btn"
                  onclick={(e) => startEditing(entry, index, e)}
                  aria-label="Edit entry"
                >
                  <MdPencil />
                </button>
              </div>
              <div class="entry-text">{@html highlightMatch(entry.text)}</div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>

    <button
      class="resize-handle"
      onmousedown={handleResizeStart}
      aria-label="Resize panel"
    ></button>
  </div>
{/if}

<style>
  .transcript-panel {
    position: fixed;
    z-index: 100;
    background: #fefefe;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 16px rgba(0, 0, 0, 0.08),
      0 16px 32px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    height: 28px;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    user-select: none;
    flex-shrink: 0;
  }

  .panel-header.dragging {
    cursor: grabbing;
    background: #ebebeb;
  }

  .panel-title {
    font-size: 12px;
    font-weight: 600;
    color: #333;
  }

  .icon-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: #888;
  }

  .icon-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #555;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;
  }

  .search-input {
    flex: 1;
    padding: 5px 8px;
    font-size: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #2196f3;
  }

  .search-count {
    font-size: 11px;
    color: #888;
    white-space: nowrap;
  }

  .transcript-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .empty-state {
    color: #999;
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }

  .transcript-entry {
    padding: 8px 10px;
    margin-bottom: 4px;
    border-radius: 6px;
    background: #f8f9fa;
    border-left: 3px solid var(--speaker-color, #666);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .transcript-entry:hover {
    background: #f0f1f2;
  }

  .transcript-entry.active {
    background: color-mix(in srgb, var(--speaker-color) 12%, white);
    box-shadow: inset 0 0 0 1px var(--speaker-color);
  }

  .transcript-entry.editing {
    background: #fff;
    border-color: #2196f3;
    padding: 10px;
    cursor: default;
  }

  .entry-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .entry-time {
    font-size: 10px;
    color: #888;
    font-family: ui-monospace, 'SF Mono', Monaco, monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 5px;
    border-radius: 3px;
  }

  .entry-speaker {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .edit-btn {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .transcript-entry:hover .edit-btn {
    opacity: 1;
  }

  .entry-text {
    font-size: 13px;
    color: #444;
    line-height: 1.5;
  }

  .entry-text :global(mark) {
    background: #fff59d;
    color: inherit;
    padding: 0 2px;
    border-radius: 2px;
  }

  .edit-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .time-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .edit-time {
    width: 60px;
    padding: 4px 6px;
    font-size: 12px;
    font-family: monospace;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .edit-time.error {
    border-color: #c00;
    background: #fff5f5;
  }

  .time-error {
    font-size: 10px;
    color: #c00;
  }

  .edit-speaker-label {
    font-size: 12px;
    font-weight: 600;
    align-self: center;
  }

  .edit-text {
    width: 100%;
    padding: 6px 8px;
    font-size: 13px;
    font-family: inherit;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    min-height: 60px;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    justify-content: flex-end;
  }

  .btn-save, .btn-cancel, .btn-delete {
    padding: 4px 12px;
    font-size: 12px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-delete {
    background: white;
    color: #c00;
    border: 1px solid #fcc;
    margin-right: auto;
  }

  .btn-delete:hover {
    background: #fee;
    border-color: #c00;
  }

  .btn-save {
    background: #2196f3;
    color: white;
    border: none;
  }

  .btn-save:hover {
    background: #1976d2;
  }

  .btn-cancel {
    background: white;
    color: #666;
    border: 1px solid #ccc;
  }

  .btn-cancel:hover {
    background: #f5f5f5;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: se-resize;
    background: linear-gradient(135deg, transparent 50%, #ccc 50%);
    border: none;
    border-radius: 0 0 8px 0;
  }

  .resize-handle:hover {
    background: linear-gradient(135deg, transparent 50%, #999 50%);
  }
</style>
