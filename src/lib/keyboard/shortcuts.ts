import type { KeyboardShortcut } from './types'
import { registry } from './registry'
import ConfigStore from '../../stores/configStore'
import TimelineStore from '../../stores/timelineStore'
import { togglePlayback } from '../../stores/playbackStore'
import {
  toggleMovement,
  toggleStops,
  toggleAlign,
  toggleColorMode,
  toggleCircle,
  toggleSlice,
  toggleHighlight,
  setAnimationRate,
} from '$lib/history/config-actions'

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a config toggle shortcut with history support
 */
function createConfigToggle(
  id: string,
  key: string,
  property: string,
  label: string,
  description: string,
  category: KeyboardShortcut['category'] = 'data'
): KeyboardShortcut {
  // Map properties to their history-tracked toggle functions
  const toggleMap: Record<string, () => void> = {
    movementToggle: toggleMovement,
    stopsToggle: toggleStops,
    alignToggle: toggleAlign,
    isPathColorMode: toggleColorMode,
  }

  return {
    id,
    key,
    label,
    description,
    category,
    action: () => {
      const toggleFn = toggleMap[property]
      if (toggleFn) {
        toggleFn()
      } else {
        // Fallback for unmapped properties (shouldn't happen)
        // All boolean config properties should be mapped above
        console.warn(`No history-tracked toggle for property: ${property}`)
      }
    },
  }
}

/**
 * Create a selection mode shortcut that enables one toggle and disables others
 * Uses history-tracked toggles for undo/redo support
 */
function createSelectionMode(
  id: string,
  key: string,
  mode: 'circle' | 'slice' | 'highlight' | 'clear',
  label: string,
  description: string
): KeyboardShortcut {
  return {
    id,
    key,
    label,
    description,
    category: 'selection',
    action: () => {
      // Get current state
      const config = ConfigStore
      let currentConfig: any
      const unsubscribe = config.subscribe((c) => (currentConfig = c))
      unsubscribe()

      // Use history-tracked toggles to ensure proper undo/redo
      if (mode === 'clear') {
        // Turn off all selection modes
        if (currentConfig.circleToggle) toggleCircle()
        if (currentConfig.sliceToggle) toggleSlice()
        if (currentConfig.highlightToggle) toggleHighlight()
      } else if (mode === 'circle') {
        if (!currentConfig.circleToggle) toggleCircle()
        if (currentConfig.sliceToggle) toggleSlice()
        if (currentConfig.highlightToggle) toggleHighlight()
      } else if (mode === 'slice') {
        if (currentConfig.circleToggle) toggleCircle()
        if (!currentConfig.sliceToggle) toggleSlice()
        if (currentConfig.highlightToggle) toggleHighlight()
      } else if (mode === 'highlight') {
        if (currentConfig.circleToggle) toggleCircle()
        if (currentConfig.sliceToggle) toggleSlice()
        if (!currentConfig.highlightToggle) toggleHighlight()
      }
    },
  }
}

/**
 * Create cross-platform shortcuts for both Ctrl and Meta modifiers
 */
function createCrossPlatformShortcuts(
  baseId: string,
  key: string,
  label: string,
  description: string,
  category: KeyboardShortcut['category'],
  action: () => void,
  options?: {
    shift?: boolean
    preventDefault?: boolean
  }
): KeyboardShortcut[] {
  const modifiers = {
    shift: options?.shift,
  }

  return [
    {
      id: `${baseId}-ctrl`,
      key,
      modifiers: { ...modifiers, ctrl: true },
      label,
      description,
      category,
      action,
      preventDefault: options?.preventDefault,
    },
    {
      id: `${baseId}-meta`,
      key,
      modifiers: { ...modifiers, meta: true },
      label,
      description: `${description} (Mac)`,
      category,
      action,
      preventDefault: options?.preventDefault,
    },
  ]
}

/** Speed increment for animation rate */
const SPEED_INCREMENT = 0.01

/** Shared action for increasing speed (with undo support) */
const increaseSpeed = () => {
  let currentRate = 0.05
  const unsubscribe = ConfigStore.subscribe((config) => (currentRate = config.animationRate))
  unsubscribe()
  setAnimationRate(Math.min(1.0, currentRate + SPEED_INCREMENT))
}

// ==================== SHORTCUTS ====================

/**
 * Playback control shortcuts
 */
export const playbackShortcuts: KeyboardShortcut[] = [
  {
    id: 'playback.play-pause',
    key: ' ',
    label: 'Play/Pause',
    description: 'Toggle animation playback',
    category: 'playback',
    action: togglePlayback,
  },
  {
    id: 'playback.seek-backward',
    key: 'ArrowLeft',
    label: 'Seek Backward',
    description: 'Jump backward 5 seconds',
    category: 'playback',
    action: () => {
      TimelineStore.update((timeline) => {
        const currentTime = timeline.getCurrTime()
        const newTime = Math.max(timeline.getLeftMarker(), currentTime - 5)
        timeline.setCurrTime(newTime)
        return timeline
      })
    },
  },
  {
    id: 'playback.seek-forward',
    key: 'ArrowRight',
    label: 'Seek Forward',
    description: 'Jump forward 5 seconds',
    category: 'playback',
    action: () => {
      TimelineStore.update((timeline) => {
        const currentTime = timeline.getCurrTime()
        const newTime = Math.min(timeline.getRightMarker(), currentTime + 5)
        timeline.setCurrTime(newTime)
        return timeline
      })
    },
  },
  {
    id: 'playback.jump-to-start',
    key: 'Home',
    label: 'Jump to Start',
    description: 'Jump to the beginning of the timeline',
    category: 'playback',
    action: () => {
      TimelineStore.update((timeline) => {
        timeline.setCurrTime(timeline.getLeftMarker())
        return timeline
      })
    },
  },
  {
    id: 'playback.jump-to-end',
    key: 'End',
    label: 'Jump to End',
    description: 'Jump to the end of the timeline',
    category: 'playback',
    action: () => {
      TimelineStore.update((timeline) => {
        timeline.setCurrTime(timeline.getRightMarker())
        return timeline
      })
    },
  },
  {
    id: 'playback.set-left-marker',
    key: '[',
    label: 'Set Left Marker',
    description: 'Set the left boundary marker at current time',
    category: 'playback',
    action: () => {
      TimelineStore.update((timeline) => {
        const currentTime = timeline.getCurrTime()
        timeline.setLeftMarker(currentTime)
        return timeline
      })
    },
  },
  {
    id: 'playback.set-right-marker',
    key: ']',
    label: 'Set Right Marker',
    description: 'Set the right boundary marker at current time',
    category: 'playback',
    action: () => {
      TimelineStore.update((timeline) => {
        const currentTime = timeline.getCurrTime()
        timeline.setRightMarker(currentTime)
        return timeline
      })
    },
  },
  {
    id: 'playback.decrease-speed',
    key: '-',
    label: 'Slow Down',
    description: 'Decrease animation playback speed',
    category: 'playback',
    action: () => {
      let currentRate = 0.05
      const unsubscribe = ConfigStore.subscribe((config) => (currentRate = config.animationRate))
      unsubscribe()
      setAnimationRate(Math.max(0.01, currentRate - SPEED_INCREMENT))
    },
  },
  {
    id: 'playback.increase-speed',
    key: '+',
    label: 'Speed Up',
    description: 'Increase animation playback speed',
    category: 'playback',
    action: increaseSpeed,
  },
  {
    id: 'playback.increase-speed-equals',
    key: '=',
    label: 'Speed Up',
    description: 'Increase animation playback speed (alternative key)',
    category: 'playback',
    action: increaseSpeed,
  },
]

/**
 * View control shortcuts
 */
export const viewShortcuts: KeyboardShortcut[] = [
  {
    id: 'view.toggle-3d',
    key: 'd',
    label: 'Toggle 2D/3D',
    description: 'Switch between 2D and 3D view modes',
    category: 'view',
    action: () => {
      window.dispatchEvent(new CustomEvent('igs:toggle-3d'))
    },
  },
  {
    id: 'view.rotate-right',
    key: 'r',
    label: 'Rotate Right',
    description: 'Rotate the floor plan clockwise',
    category: 'view',
    action: () => {
      window.dispatchEvent(
        new CustomEvent('igs:rotate-floorplan', { detail: { direction: 'right' } })
      )
    },
  },
  {
    id: 'view.rotate-left',
    key: 'R',
    modifiers: { shift: true },
    label: 'Rotate Left',
    description: 'Rotate the floor plan counter-clockwise',
    category: 'view',
    action: () => {
      window.dispatchEvent(
        new CustomEvent('igs:rotate-floorplan', { detail: { direction: 'left' } })
      )
    },
  },
  {
    id: 'view.toggle-video',
    key: 'v',
    label: 'Toggle Video',
    description: 'Show or hide the video player',
    category: 'view',
    action: () => {
      window.dispatchEvent(new CustomEvent('igs:toggle-video'))
    },
  },
]

/**
 * Selection mode shortcuts
 */
export const selectionShortcuts: KeyboardShortcut[] = [
  createSelectionMode(
    'selection.circle-mode',
    '1',
    'circle',
    'Circle Selection',
    'Enable circle selection mode'
  ),
  createSelectionMode(
    'selection.slice-mode',
    '2',
    'slice',
    'Slice Selection',
    'Enable slice selection mode'
  ),
  createSelectionMode(
    'selection.highlight-mode',
    '3',
    'highlight',
    'Highlight Selection',
    'Enable highlight selection mode'
  ),
  createSelectionMode(
    'selection.clear-all',
    'Escape',
    'clear',
    'Clear Selections',
    'Clear all active selections'
  ),
]

/**
 * Data display toggle shortcuts
 */
export const dataShortcuts: KeyboardShortcut[] = [
  createConfigToggle(
    'data.toggle-movement',
    'm',
    'movementToggle',
    'Toggle Movement Trails',
    'Show or hide movement path trails'
  ),
  createConfigToggle(
    'data.toggle-stops',
    's',
    'stopsToggle',
    'Toggle Stops',
    'Show or hide stop indicators'
  ),
  createConfigToggle(
    'data.toggle-alignment',
    'a',
    'alignToggle',
    'Toggle Talk Alignment',
    'Enable or disable conversation alignment'
  ),
  createConfigToggle(
    'data.toggle-color-mode',
    'c',
    'isPathColorMode',
    'Toggle Color by Codes',
    'Switch between user colors and code colors'
  ),
]

/**
 * Modal and application shortcuts
 */
export const modalShortcuts: KeyboardShortcut[] = [
  {
    id: 'modal.show-cheatsheet',
    key: '?',
    modifiers: { shift: true },
    label: 'Show Shortcuts',
    description: 'Display keyboard shortcuts cheatsheet',
    category: 'modal',
    action: () => window.dispatchEvent(new CustomEvent('igs:open-cheatsheet')),
  },
  {
    id: 'modal.toggle-help',
    key: 'h',
    label: 'Toggle Help',
    description: 'Show or hide the help modal',
    category: 'modal',
    action: () => window.dispatchEvent(new CustomEvent('igs:toggle-help')),
  },
  {
    id: 'modal.open-file',
    key: 'o',
    label: 'Open File',
    description: 'Open file selection dialog',
    category: 'modal',
    action: () => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fileInput?.click()
    },
  },
  // Use Shift modifier to avoid browser Save Page conflict (Cmd+S / Ctrl+S)
  ...createCrossPlatformShortcuts(
    'modal.download-codes',
    'S',
    'Download Codes',
    'Download the current code data file',
    'modal',
    () => window.dispatchEvent(new CustomEvent('igs:download-codes')),
    { shift: true }
  ),
  // Cmd+K commonly used for command palettes - explicitly prevent default
  ...createCrossPlatformShortcuts(
    'modal.command-palette',
    'k',
    'Command Palette',
    'Open the command palette',
    'modal',
    () => window.dispatchEvent(new CustomEvent('igs:open-command-palette')),
    { preventDefault: true }
  ),
]

/**
 * All shortcuts combined
 */
export const allShortcuts: KeyboardShortcut[] = [
  ...playbackShortcuts,
  ...viewShortcuts,
  ...selectionShortcuts,
  ...dataShortcuts,
  ...modalShortcuts,
]

/**
 * Register all IGS keyboard shortcuts with the global registry
 * Call this function once during app initialization
 */
export function registerAllShortcuts(): void {
  try {
    registry.registerMany(allShortcuts)
    console.log(`Registered ${allShortcuts.length} keyboard shortcuts`)
  } catch (error) {
    console.error('Failed to register shortcuts:', error)
    throw error
  }
}

/**
 * Unregister all IGS keyboard shortcuts
 * Useful for cleanup or hot module replacement
 */
export function unregisterAllShortcuts(): void {
  allShortcuts.forEach((shortcut) => {
    registry.unregister(shortcut.id)
  })
  console.log(`Unregistered ${allShortcuts.length} keyboard shortcuts`)
}
