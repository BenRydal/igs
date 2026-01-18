<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { fade, slide } from 'svelte/transition'
  import { closeModal, activeModal } from '../../../stores/modalStore'
  import { Z_INDEX } from '$lib/styles/z-index'
  import type { Command, HighlightSegment } from './types'
  import { searchCommands, getHighlightSegments } from './fuzzy-search'
  import { getCommands, getCategoryLabel } from '$lib/app-actions'
  import { getRecentCommands, addRecentCommand, type RecentCommandEntry } from './recent-commands'
  import P5Store from '../../../stores/p5Store'
  import CommandButton from './CommandButton.svelte'

  // Props
  interface Props {
    isOpen?: boolean
  }

  let { isOpen = $bindable(false) }: Props = $props()

  // State
  let searchQuery = $state('')
  let selectedIndex = $state(0)
  let searchInputRef = $state<HTMLInputElement | null>(null)
  let commandListRef = $state<HTMLDivElement | null>(null)
  let previouslyFocusedElement: HTMLElement | null = null

  // Get all commands
  const allCommands = getCommands()

  // Derived state for search results
  let searchResults = $derived.by(() => {
    if (!searchQuery.trim()) {
      return []
    }
    return searchCommands(searchQuery, allCommands)
  })

  // Get recent commands
  let recentCommandEntries = $state<RecentCommandEntry[]>([])
  let recentCommands = $derived.by(() => {
    return recentCommandEntries
      .map((entry) => allCommands.find((cmd) => cmd.id === entry.id))
      .filter((cmd): cmd is Command => cmd !== undefined)
  })

  // Helper to group commands by category
  function groupByCategory(commands: Command[]) {
    const groups = new Map<string, Command[]>()
    for (const command of commands) {
      const category = command.category
      const existing = groups.get(category) || []
      existing.push(command)
      groups.set(category, existing)
    }
    return Array.from(groups.entries()).map(([category, cmds]) => ({
      category,
      label: getCategoryLabel(category as Command['category']),
      commands: cmds,
    }))
  }

  // Get grouped commands for current view
  let groupedCommands = $derived.by(() => {
    if (searchQuery.trim()) {
      return groupByCategory(searchResults.map((r) => r.command))
    }
    return groupByCategory(allCommands)
  })

  // Flat list for keyboard navigation
  let displayCommands = $derived.by(() => {
    if (searchQuery.trim()) {
      return searchResults.map((r) => r.command)
    }
    // When not searching, include recent commands first, then all commands
    return [...recentCommands, ...allCommands]
  })

  // Reset state when modal opens/closes
  $effect(() => {
    if (isOpen) {
      // Store previously focused element
      previouslyFocusedElement = document.activeElement as HTMLElement

      // Load recent commands
      recentCommandEntries = getRecentCommands()
      searchQuery = ''
      selectedIndex = 0

      // Focus search input
      setTimeout(() => {
        searchInputRef?.focus()
      }, 100)
    }
  })

  // Handle keyboard navigation
  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) return

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        handleClose()
        break

      case 'ArrowDown':
        event.preventDefault()
        selectedIndex = Math.min(selectedIndex + 1, displayCommands.length - 1)
        scrollToSelected()
        break

      case 'ArrowUp':
        event.preventDefault()
        selectedIndex = Math.max(selectedIndex - 1, 0)
        scrollToSelected()
        break

      case 'Enter':
        event.preventDefault()
        if (displayCommands[selectedIndex]) {
          executeCommand(displayCommands[selectedIndex])
        }
        break

      case 'Tab':
        event.preventDefault()
        if (event.shiftKey) {
          selectedIndex = Math.max(selectedIndex - 1, 0)
        } else {
          selectedIndex = Math.min(selectedIndex + 1, displayCommands.length - 1)
        }
        scrollToSelected()
        break
    }
  }

  // Handle global keyboard shortcut (Cmd+K / Ctrl+K)
  function handleGlobalKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      event.stopPropagation()
      isOpen = !isOpen
    }
  }

  // Scroll to selected item
  function scrollToSelected() {
    if (!commandListRef) return

    const selectedElement = commandListRef.querySelector(`[data-index="${selectedIndex}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  // Execute a command
  function executeCommand(command: Command) {
    try {
      // Execute the command action
      command.action()

      // Trigger p5 redraw
      get(P5Store)?.loop()

      // Add to recent commands
      addRecentCommand(command.id)

      // Close the palette
      handleClose()
    } catch (error) {
      console.error('Failed to execute command:', error)
    }
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  // Close the command palette
  function handleClose() {
    isOpen = false
    closeModal('commandPalette')

    // Return focus to previously focused element
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
      previouslyFocusedElement = null
    }
  }

  // Set up keyboard listeners
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeyDown)
    }
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  })

  // Update selected index when search query changes
  $effect(() => {
    searchQuery
    selectedIndex = 0
  })

  // Get highlighted label segments for search results
  function getLabelSegments(command: Command): HighlightSegment[] | undefined {
    if (!searchQuery.trim()) {
      return undefined
    }

    const result = searchResults.find((r) => r.command.id === command.id)
    if (result) {
      return getHighlightSegments(command.label, result.match.indices)
    }

    return undefined
  }
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm"
    style="z-index: {Z_INDEX.COMMAND_PALETTE}"
    onclick={handleBackdropClick}
    onkeydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="command-palette-title"
    tabindex="-1"
    transition:fade={{ duration: 150 }}
  >
    <!-- Command palette container -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <div
        class="bg-base-200/95 backdrop-blur-md rounded-box shadow-2xl border border-base-300 overflow-hidden"
        transition:slide={{ duration: 200 }}
      >
        <!-- Search input -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-300">
          <!-- Search icon -->
          <svg
            class="w-5 h-5 text-base-content/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <!-- Input -->
          <input
            bind:this={searchInputRef}
            bind:value={searchQuery}
            type="text"
            placeholder="Search commands..."
            class="flex-1 bg-transparent outline-none text-base-content placeholder-base-content/50"
            autocomplete="off"
            spellcheck="false"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={displayCommands[selectedIndex]
              ? `command-${displayCommands[selectedIndex].id}`
              : undefined}
          />

          <!-- Esc hint -->
          <kbd class="kbd kbd-sm">Esc</kbd>
        </div>

        <!-- Command list -->
        <div
          bind:this={commandListRef}
          id="command-list"
          class="max-h-96 overflow-y-auto"
          role="listbox"
        >
          {#if searchQuery.trim() && groupedCommands.length === 0}
            <!-- No results -->
            <div class="px-4 py-8 text-center text-base-content/60">
              <svg
                class="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No commands found for "{searchQuery}"</p>
            </div>
          {:else}
            <!-- Recent commands section (only when not searching) -->
            {#if !searchQuery.trim() && recentCommands.length > 0}
              <div class="py-2">
                <div
                  class="px-4 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide"
                >
                  Recent
                </div>
                {#each recentCommands as command, index}
                  <CommandButton
                    {command}
                    {index}
                    {selectedIndex}
                    onExecute={executeCommand}
                    onSelect={(i) => (selectedIndex = i)}
                  />
                {/each}
              </div>
            {/if}

            <!-- Commands grouped by category -->
            {#each groupedCommands as group, groupIndex}
              {@const recentOffset = !searchQuery.trim() ? recentCommands.length : 0}
              <div class="py-2">
                <div
                  class="px-4 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide"
                >
                  {group.label}
                </div>
                {#each group.commands as command, cmdIndex}
                  {@const globalIndex =
                    recentOffset +
                    groupedCommands
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.commands.length, 0) + cmdIndex}
                  <CommandButton
                    {command}
                    index={globalIndex}
                    {selectedIndex}
                    labelSegments={getLabelSegments(command)}
                    onExecute={executeCommand}
                    onSelect={(i) => (selectedIndex = i)}
                  />
                {/each}
              </div>
            {/each}
          {/if}
        </div>

        <!-- Footer -->
        <div
          class="px-4 py-2 border-t border-base-300 bg-base-300/50 text-xs text-base-content/60 flex items-center justify-center gap-4"
        >
          <span class="flex items-center gap-1">
            <kbd class="kbd kbd-xs">↑↓</kbd> Navigate
          </span>
          <span class="flex items-center gap-1">
            <kbd class="kbd kbd-xs">Enter</kbd> Select
          </span>
          <span class="flex items-center gap-1">
            <kbd class="kbd kbd-xs">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Smooth scrolling for command list */
  #command-list {
    scroll-behavior: smooth;
  }

  /* Custom scrollbar styling */
  #command-list::-webkit-scrollbar {
    width: 8px;
  }

  #command-list::-webkit-scrollbar-track {
    background: transparent;
  }

  #command-list::-webkit-scrollbar-thumb {
    background: hsl(var(--bc) / 0.2);
    border-radius: 4px;
  }

  #command-list::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--bc) / 0.3);
  }
</style>
