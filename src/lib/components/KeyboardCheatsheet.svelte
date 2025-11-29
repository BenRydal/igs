<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { registry } from '$lib/keyboard'
  import type { ShortcutCategory, KeyboardShortcut } from '$lib/keyboard'
  import { Z_INDEX } from '$lib/styles/z-index'

  interface Props {
    isOpen: boolean
    onClose: () => void
  }

  let { isOpen = false, onClose }: Props = $props()

  // State
  let modalBoxRef: HTMLDivElement | null = $state(null)
  let firstFocusableElement: HTMLElement | null = null
  let lastFocusableElement: HTMLElement | null = null
  let previouslyFocusedElement: HTMLElement | null = null
  let categories = $state<ShortcutCategory[]>([])

  /**
   * Format key combination for display
   * @param key The keyboard key
   * @param modifiers Optional modifier keys
   * @returns Formatted string for display
   */
  function formatKey(
    key: string,
    modifiers?: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
  ): string {
    const isMac = navigator.platform.includes('Mac')
    const parts: string[] = []

    if (modifiers?.meta || modifiers?.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl')
    }
    if (modifiers?.alt) parts.push(isMac ? '⌥' : 'Alt')
    if (modifiers?.shift) parts.push('⇧')

    // Format special keys
    const keyDisplay: Record<string, string> = {
      ' ': 'Space',
      ArrowLeft: '←',
      ArrowRight: '→',
      ArrowUp: '↑',
      ArrowDown: '↓',
      Escape: 'Esc',
      Home: 'Home',
      End: 'End',
    }

    const displayKey = keyDisplay[key] || key.toUpperCase()
    parts.push(displayKey)

    return parts.join('+')
  }

  /**
   * Format category label for display
   * @param category The category object
   * @returns Capitalized category label
   */
  function formatCategoryLabel(category: ShortcutCategory): string {
    return category.label.toUpperCase()
  }

  /**
   * Load shortcuts from registry
   */
  function loadShortcuts() {
    categories = registry.getCategories()
  }

  /**
   * Handle keyboard events
   * @param event Keyboard event
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      handleClose()
    }

    // Handle focus trap
    if (event.key === 'Tab' && modalBoxRef) {
      const focusableElements = modalBoxRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      firstFocusableElement = focusableElements[0]
      lastFocusableElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault()
          lastFocusableElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault()
          firstFocusableElement?.focus()
        }
      }
    }
  }

  /**
   * Handle backdrop click
   * @param event Mouse event
   */
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  /**
   * Close handler with focus restoration
   */
  function handleClose() {
    onClose()

    // Return focus to previously focused element
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
      previouslyFocusedElement = null
    }
  }

  // Load shortcuts when modal opens
  $effect(() => {
    if (isOpen) {
      loadShortcuts()
    }
  })

  // Set up keyboard listener
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
    }
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  // Focus first element when modal opens and store previously focused element
  $effect(() => {
    if (isOpen && modalBoxRef) {
      // Store previously focused element
      previouslyFocusedElement = document.activeElement as HTMLElement

      const focusableElements = modalBoxRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  })
</script>

{#if isOpen}
  <div
    class="modal modal-open"
    style="z-index: {Z_INDEX.MODAL}"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="keyboard-cheatsheet-title"
  >
    <div class="modal-box w-11/12 max-w-3xl max-h-[80vh] flex flex-col" bind:this={modalBoxRef}>
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 flex-shrink-0">
        <h3 id="keyboard-cheatsheet-title" class="font-bold text-lg">Keyboard Shortcuts</h3>
        <button
          class="btn btn-circle btn-sm"
          onclick={handleClose}
          aria-label="Close keyboard shortcuts"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="overflow-y-auto flex-1 min-h-0">
        <!-- Shortcuts Grid -->
        {#if categories.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {#each categories as category (category.id)}
              <div class="flex flex-col space-y-3">
                <!-- Category Header -->
                <h4 class="text-sm font-bold tracking-wider opacity-60">
                  {formatCategoryLabel(category)}
                </h4>

                <!-- Shortcuts List -->
                <div class="flex flex-col space-y-2">
                  {#each category.shortcuts as shortcut (shortcut.id)}
                    {#if shortcut.enabled !== false}
                      <div class="flex justify-between items-center gap-4">
                        <span class="text-sm">{shortcut.label}</span>
                        <kbd class="kbd kbd-sm">{formatKey(shortcut.key, shortcut.modifiers)}</kbd>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-base-content/60">
            <p>No keyboard shortcuts registered.</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex justify-center pt-4 border-t border-base-300 flex-shrink-0">
        <p class="text-sm text-base-content/60">
          Press <kbd class="kbd kbd-sm">?</kbd> anytime to show this dialog
        </p>
      </div>

      <!-- Modal Actions -->
      <div class="modal-action flex-shrink-0">
        <button class="btn" onclick={handleClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .kbd {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
  }
</style>
