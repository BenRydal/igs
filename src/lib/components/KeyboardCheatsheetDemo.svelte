<script lang="ts">
  /**
   * Demo component for KeyboardCheatsheet
   * Shows how to integrate the cheatsheet with example shortcuts
   */
  import { onMount, onDestroy } from 'svelte'
  import { registry, attachKeyboardHandler, detachKeyboardHandler } from '$lib/keyboard'
  import KeyboardCheatsheet from './KeyboardCheatsheet.svelte'

  // State
  let isCheatsheetOpen = $state(false)
  let message = $state('')
  let messageTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Show a temporary message
   */
  function showMessage(text: string) {
    message = text
    if (messageTimeout) {
      clearTimeout(messageTimeout)
    }
    messageTimeout = setTimeout(() => {
      message = ''
    }, 2000)
  }

  /**
   * Register demo shortcuts
   */
  function registerDemoShortcuts() {
    // Clear existing shortcuts
    registry.clear()

    // Modal shortcuts
    registry.register({
      id: 'open-cheatsheet',
      key: '?',
      label: 'Show Shortcuts',
      description: 'Display keyboard shortcuts cheatsheet',
      category: 'modal',
      action: () => {
        isCheatsheetOpen = true
      },
    })

    // Playback shortcuts
    registry.registerMany([
      {
        id: 'play-pause',
        key: ' ',
        label: 'Play/Pause',
        description: 'Toggle animation playback',
        category: 'playback',
        action: () => showMessage('Play/Pause toggled'),
      },
      {
        id: 'seek-forward',
        key: 'ArrowRight',
        label: 'Seek Forward',
        description: 'Jump forward 5 seconds',
        category: 'playback',
        action: () => showMessage('Seeking forward'),
      },
      {
        id: 'seek-backward',
        key: 'ArrowLeft',
        label: 'Seek Backward',
        description: 'Jump backward 5 seconds',
        category: 'playback',
        action: () => showMessage('Seeking backward'),
      },
      {
        id: 'jump-start',
        key: 'Home',
        label: 'Jump to Start',
        description: 'Jump to beginning of timeline',
        category: 'playback',
        action: () => showMessage('Jumped to start'),
      },
      {
        id: 'jump-end',
        key: 'End',
        label: 'Jump to End',
        description: 'Jump to end of timeline',
        category: 'playback',
        action: () => showMessage('Jumped to end'),
      },
    ])

    // View shortcuts
    registry.registerMany([
      {
        id: 'toggle-2d-3d',
        key: 'd',
        label: 'Toggle 2D/3D',
        description: 'Switch between 2D and 3D view',
        category: 'view',
        action: () => showMessage('View toggled'),
      },
      {
        id: 'rotate-right',
        key: 'r',
        label: 'Rotate Right',
        description: 'Rotate camera to the right',
        category: 'view',
        action: () => showMessage('Rotated right'),
      },
      {
        id: 'toggle-video',
        key: 'v',
        label: 'Toggle Video',
        description: 'Show/hide video overlay',
        category: 'view',
        action: () => showMessage('Video toggled'),
      },
    ])

    // Selection shortcuts
    registry.registerMany([
      {
        id: 'circle-mode',
        key: '1',
        label: 'Circle Mode',
        description: 'Switch to circle selection mode',
        category: 'selection',
        action: () => showMessage('Circle mode activated'),
      },
      {
        id: 'slice-mode',
        key: '2',
        label: 'Slice Mode',
        description: 'Switch to slice selection mode',
        category: 'selection',
        action: () => showMessage('Slice mode activated'),
      },
      {
        id: 'highlight-mode',
        key: '3',
        label: 'Highlight Mode',
        description: 'Switch to highlight selection mode',
        category: 'selection',
        action: () => showMessage('Highlight mode activated'),
      },
      {
        id: 'clear-selection',
        key: 'Escape',
        label: 'Clear Selection',
        description: 'Clear current selection',
        category: 'selection',
        action: () => showMessage('Selection cleared'),
      },
    ])

    // Data shortcuts
    registry.registerMany([
      {
        id: 'toggle-movement',
        key: 'm',
        label: 'Toggle Movement',
        description: 'Show/hide movement trails',
        category: 'data',
        action: () => showMessage('Movement toggled'),
      },
      {
        id: 'toggle-stops',
        key: 's',
        label: 'Toggle Stops',
        description: 'Show/hide stop markers',
        category: 'data',
        action: () => showMessage('Stops toggled'),
      },
      {
        id: 'toggle-talk-align',
        key: 'a',
        label: 'Toggle Talk Align',
        description: 'Show/hide talk alignment',
        category: 'data',
        action: () => showMessage('Talk align toggled'),
      },
      {
        id: 'color-by-code',
        key: 'c',
        label: 'Color by Code',
        description: 'Toggle color by code mode',
        category: 'data',
        action: () => showMessage('Color by code toggled'),
      },
    ])
  }

  onMount(() => {
    // Register demo shortcuts
    registerDemoShortcuts()

    // Attach keyboard handler
    attachKeyboardHandler()
  })

  onDestroy(() => {
    // Clean up
    detachKeyboardHandler()
    registry.clear()

    if (messageTimeout) {
      clearTimeout(messageTimeout)
    }
  })
</script>

<div class="p-8 max-w-4xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Keyboard Cheatsheet Demo</h1>
    <p class="text-base-content/60">
      Press <kbd class="kbd kbd-sm">?</kbd> to open the keyboard shortcuts cheatsheet, or try any of the
      registered shortcuts.
    </p>
  </div>

  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Try These Shortcuts:</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h3 class="font-semibold mb-2">Playback</h3>
          <ul class="space-y-1 text-sm">
            <li><kbd class="kbd kbd-sm">Space</kbd> - Play/Pause</li>
            <li><kbd class="kbd kbd-sm">←</kbd> / <kbd class="kbd kbd-sm">→</kbd> - Seek</li>
            <li><kbd class="kbd kbd-sm">Home</kbd> / <kbd class="kbd kbd-sm">End</kbd> - Jump</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">View</h3>
          <ul class="space-y-1 text-sm">
            <li><kbd class="kbd kbd-sm">D</kbd> - Toggle 2D/3D</li>
            <li><kbd class="kbd kbd-sm">R</kbd> - Rotate Right</li>
            <li><kbd class="kbd kbd-sm">V</kbd> - Toggle Video</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">Selection</h3>
          <ul class="space-y-1 text-sm">
            <li><kbd class="kbd kbd-sm">1</kbd> - Circle Mode</li>
            <li><kbd class="kbd kbd-sm">2</kbd> - Slice Mode</li>
            <li><kbd class="kbd kbd-sm">3</kbd> - Highlight Mode</li>
            <li><kbd class="kbd kbd-sm">Esc</kbd> - Clear Selection</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">Data Filters</h3>
          <ul class="space-y-1 text-sm">
            <li><kbd class="kbd kbd-sm">M</kbd> - Movement</li>
            <li><kbd class="kbd kbd-sm">S</kbd> - Stops</li>
            <li><kbd class="kbd kbd-sm">A</kbd> - Talk Align</li>
            <li><kbd class="kbd kbd-sm">C</kbd> - Color by Code</li>
          </ul>
        </div>
      </div>

      <div class="divider"></div>

      <div class="flex justify-center">
        <button class="btn btn-primary" onclick={() => (isCheatsheetOpen = true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Show All Shortcuts
        </button>
      </div>
    </div>
  </div>

  <!-- Message Toast -->
  {#if message}
    <div class="toast toast-center">
      <div class="alert alert-info">
        <span>{message}</span>
      </div>
    </div>
  {/if}
</div>

<!-- Keyboard Cheatsheet Modal -->
<KeyboardCheatsheet isOpen={isCheatsheetOpen} onClose={() => (isCheatsheetOpen = false)} />

<style>
  .kbd {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
  }
</style>
