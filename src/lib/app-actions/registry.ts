/**
 * Unified action registry
 *
 * Single source of truth for all app actions.
 * Both keyboard shortcuts and command palette derive from this.
 */

import { get } from 'svelte/store'
import type { AppAction } from './types'
import ConfigStore from '../../stores/configStore'
import { toggleVisibility } from '../../stores/videoStore'
import { togglePlayback, isPlaying } from '../../stores/playbackStore'
import { timelineV2Store } from '../timeline/store'
import { openModal } from '../../stores/modalStore'

// Import history-tracked action functions
import {
  toggleMovement,
  toggleStops,
  toggleCircle,
  toggleSlice,
  toggleHighlight,
  toggleAlign,
  toggleColorMode,
  setAnimationRate,
} from '../history/config-actions'

// ==================== FILTER ACTIONS ====================

const filterActions: AppAction[] = [
  {
    id: 'toggle-movement',
    label: 'Toggle Movement Trails',
    description: 'Show or hide movement paths',
    keywords: ['trails', 'paths', 'lines', 'movement'],
    icon: '🚶',
    category: 'filter',
    shortcut: { key: 'm' },
    action: toggleMovement,
    isActive: () => get(ConfigStore).movementToggle,
  },
  {
    id: 'toggle-stops',
    label: 'Toggle Stop Points',
    description: 'Show or hide stop points',
    keywords: ['stops', 'points', 'pause', 'stationary'],
    icon: '⏸️',
    category: 'filter',
    shortcut: { key: 's' },
    action: toggleStops,
    isActive: () => get(ConfigStore).stopsToggle,
  },
  {
    id: 'toggle-conversation-alignment',
    label: 'Toggle Conversation Alignment',
    description: 'Align conversation data with timeline',
    keywords: ['align', 'conversation', 'sync', 'timeline', 'talk'],
    icon: '💬',
    category: 'filter',
    shortcut: { key: 'a' },
    action: toggleAlign,
    isActive: () => get(ConfigStore).alignToggle,
  },
  {
    id: 'toggle-path-color-mode',
    label: 'Toggle Path Color Mode',
    description: 'Switch between user colors and code colors',
    keywords: ['color', 'mode', 'path', 'theme', 'codes'],
    icon: '🎨',
    category: 'filter',
    shortcut: { key: 'c' },
    action: toggleColorMode,
    isActive: () => get(ConfigStore).isPathColorMode,
  },
]

// ==================== SELECTION ACTIONS ====================

const selectionActions: AppAction[] = [
  {
    id: 'select-circle',
    label: 'Circle Selection Tool',
    description: 'Select data with a circular area',
    keywords: ['circle', 'select', 'tool', 'area'],
    icon: '⭕',
    category: 'selection',
    shortcut: { key: '1' },
    action: () => {
      const config = get(ConfigStore)
      // Toggle circle, disable others
      if (!config.circleToggle) toggleCircle()
      if (config.sliceToggle) toggleSlice()
      if (config.highlightToggle) toggleHighlight()
    },
    isActive: () => get(ConfigStore).circleToggle,
  },
  {
    id: 'select-slice',
    label: 'Slice Selection Tool',
    description: 'Select data with a slice/wedge area',
    keywords: ['slice', 'wedge', 'select', 'tool', 'area'],
    icon: '🍕',
    category: 'selection',
    shortcut: { key: '2' },
    action: () => {
      const config = get(ConfigStore)
      if (config.circleToggle) toggleCircle()
      if (!config.sliceToggle) toggleSlice()
      if (config.highlightToggle) toggleHighlight()
    },
    isActive: () => get(ConfigStore).sliceToggle,
  },
  {
    id: 'select-highlight',
    label: 'Highlight Selection Tool',
    description: 'Highlight selected data',
    keywords: ['highlight', 'select', 'tool', 'focus'],
    icon: '🔦',
    category: 'selection',
    shortcut: { key: '3' },
    action: () => {
      const config = get(ConfigStore)
      if (config.circleToggle) toggleCircle()
      if (config.sliceToggle) toggleSlice()
      if (!config.highlightToggle) toggleHighlight()
    },
    isActive: () => get(ConfigStore).highlightToggle,
  },
  {
    id: 'select-clear-all',
    label: 'Clear All Selections',
    description: 'Deactivate all selection tools',
    keywords: ['clear', 'deselect', 'none', 'reset'],
    icon: '❌',
    category: 'selection',
    shortcut: { key: 'Escape' },
    action: () => {
      const config = get(ConfigStore)
      if (config.circleToggle) toggleCircle()
      if (config.sliceToggle) toggleSlice()
      if (config.highlightToggle) toggleHighlight()
    },
  },
]

// ==================== VIEW ACTIONS ====================

const viewActions: AppAction[] = [
  {
    id: 'toggle-3d',
    label: 'Toggle 2D/3D View',
    description: 'Switch between 2D and 3D visualization',
    keywords: ['3d', '2d', 'dimension', 'view', 'toggle'],
    icon: '🔄',
    category: 'view',
    shortcut: { key: 'd' },
    action: () => window.dispatchEvent(new CustomEvent('igs:toggle-3d')),
  },
  {
    id: 'rotate-right',
    label: 'Rotate View Right',
    description: 'Rotate the floor plan clockwise',
    keywords: ['rotate', 'right', 'cw', 'view', 'clockwise'],
    icon: '↷',
    category: 'view',
    shortcut: { key: 'r' },
    action: () =>
      window.dispatchEvent(new CustomEvent('igs:rotate-floorplan', { detail: { direction: 'right' } })),
  },
  {
    id: 'rotate-left',
    label: 'Rotate View Left',
    description: 'Rotate the floor plan counter-clockwise',
    keywords: ['rotate', 'left', 'ccw', 'view', 'counter-clockwise'],
    icon: '↶',
    category: 'view',
    shortcut: { key: 'R', modifiers: { shift: true } },
    action: () =>
      window.dispatchEvent(new CustomEvent('igs:rotate-floorplan', { detail: { direction: 'left' } })),
  },
  {
    id: 'toggle-video',
    label: 'Toggle Video',
    description: 'Show or hide the video player',
    keywords: ['video', 'player', 'toggle', 'show', 'hide'],
    icon: '🎥',
    category: 'view',
    shortcut: { key: 'v' },
    action: toggleVisibility,
  },
]

// ==================== PLAYBACK ACTIONS ====================

const playbackActions: AppAction[] = [
  {
    id: 'playback-toggle',
    label: 'Play/Pause Animation',
    description: 'Toggle animation playback',
    keywords: ['play', 'pause', 'animation', 'timeline'],
    icon: '⏯️',
    category: 'playback',
    shortcut: { key: ' ' }, // Space
    action: togglePlayback,
    isActive: () => get(isPlaying),
  },
  {
    id: 'playback-seek-backward',
    label: 'Seek Backward',
    description: 'Jump backward 5 seconds',
    keywords: ['seek', 'backward', 'rewind', 'back'],
    icon: '⏪',
    category: 'playback',
    shortcut: { key: 'ArrowLeft' },
    action: () => {
      const state = timelineV2Store.getState()
      const newTime = Math.max(state.viewStart, state.currentTime - 5)
      timelineV2Store.setCurrentTime(newTime)
    },
  },
  {
    id: 'playback-seek-forward',
    label: 'Seek Forward',
    description: 'Jump forward 5 seconds',
    keywords: ['seek', 'forward', 'skip', 'ahead'],
    icon: '⏩',
    category: 'playback',
    shortcut: { key: 'ArrowRight' },
    action: () => {
      const state = timelineV2Store.getState()
      const newTime = Math.min(state.viewEnd, state.currentTime + 5)
      timelineV2Store.setCurrentTime(newTime)
    },
  },
  {
    id: 'playback-jump-start',
    label: 'Jump to Start',
    description: 'Jump to the beginning of the view',
    keywords: ['start', 'beginning', 'home', 'reset'],
    icon: '⏮️',
    category: 'playback',
    shortcut: { key: 'Home' },
    action: () => {
      const state = timelineV2Store.getState()
      timelineV2Store.setCurrentTime(state.viewStart)
    },
  },
  {
    id: 'playback-jump-end',
    label: 'Jump to End',
    description: 'Jump to the end of the view',
    keywords: ['end', 'finish', 'last'],
    icon: '⏭️',
    category: 'playback',
    shortcut: { key: 'End' },
    action: () => {
      const state = timelineV2Store.getState()
      timelineV2Store.setCurrentTime(state.viewEnd)
    },
  },
  {
    id: 'playback-speed-up',
    label: 'Increase Animation Speed',
    description: 'Make animation play faster',
    keywords: ['speed', 'faster', 'animation', 'rate', 'increase'],
    icon: '⏩',
    category: 'playback',
    shortcut: { key: '=' }, // = or + key
    action: () => {
      const config = get(ConfigStore)
      setAnimationRate(Math.min(1.0, config.animationRate + 0.01))
    },
  },
  {
    id: 'playback-speed-down',
    label: 'Decrease Animation Speed',
    description: 'Make animation play slower',
    keywords: ['speed', 'slower', 'animation', 'rate', 'decrease'],
    icon: '⏪',
    category: 'playback',
    shortcut: { key: '-' },
    action: () => {
      const config = get(ConfigStore)
      setAnimationRate(Math.max(0.01, config.animationRate - 0.01))
    },
  },
]

// ==================== CLEAR ACTIONS ====================

const clearActions: AppAction[] = [
  {
    id: 'clear-movement',
    label: 'Clear Movement Data',
    description: 'Remove all movement trails',
    keywords: ['clear', 'remove', 'movement', 'trails', 'delete'],
    icon: '🗑️',
    category: 'clear',
    action: () => window.dispatchEvent(new CustomEvent('igs:clear-movement')),
  },
  {
    id: 'clear-conversation',
    label: 'Clear Conversation Data',
    description: 'Remove all conversation data',
    keywords: ['clear', 'remove', 'conversation', 'chat', 'talk', 'delete'],
    icon: '🗑️',
    category: 'clear',
    action: () => window.dispatchEvent(new CustomEvent('igs:clear-conversation')),
  },
  {
    id: 'clear-codes',
    label: 'Clear Code Data',
    description: 'Remove all code annotations',
    keywords: ['clear', 'remove', 'codes', 'annotations', 'delete'],
    icon: '🗑️',
    category: 'clear',
    action: () => window.dispatchEvent(new CustomEvent('igs:clear-codes')),
  },
  {
    id: 'clear-all',
    label: 'Clear All Data',
    description: 'Remove all loaded data',
    keywords: ['clear', 'remove', 'all', 'reset', 'delete'],
    icon: '🗑️',
    category: 'clear',
    action: () => window.dispatchEvent(new CustomEvent('igs:clear-all')),
  },
]

// ==================== EXAMPLE ACTIONS ====================

const exampleActions: AppAction[] = [
  {
    id: 'example-jordan-shot',
    label: "Load: Michael Jordan's Last Shot",
    description: 'Sports example dataset',
    keywords: ['example', 'sports', 'basketball', 'jordan'],
    icon: '🏀',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-1' } })),
  },
  {
    id: 'example-museum',
    label: 'Load: Family Gallery Visit',
    description: 'Museum example dataset',
    keywords: ['example', 'museum', 'gallery', 'family'],
    icon: '🖼️',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-2' } })),
  },
  {
    id: 'example-museum-complete',
    label: 'Load: Family Museum Visit',
    description: 'Museum example dataset',
    keywords: ['example', 'museum', 'gallery', 'family'],
    icon: '👩‍🏫',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-11' } })),
  },
  {
    id: 'example-ap-math',
    label: 'Load: Clark AP Math Lesson',
    description: 'TAU Project',
    keywords: ['example', 'classroom', 'math', 'ap', 'clark', 'tau'],
    icon: '📐',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-10' } })),
  },
  {
    id: 'example-3rd-grade',
    label: 'Load: 3rd Grade Numbers Discussion',
    description: 'Classroom example dataset',
    keywords: ['example', 'classroom', '3rd grade', 'numbers'],
    icon: '🔢',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-4' } })),
  },
  {
    id: 'example-us-science-weather',
    label: 'Load: U.S. Science Lesson (weather)',
    description: 'TIMSS video study example',
    keywords: ['example', 'timss', 'science', 'weather', 'usa'],
    icon: '🌤️',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-3' } })),
  },
  {
    id: 'example-czech-science',
    label: 'Load: Czech Republic Science (density)',
    description: 'TIMSS video study example',
    keywords: ['example', 'timss', 'science', 'density', 'czech'],
    icon: '⚗️',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-5' } })),
  },
  {
    id: 'example-japan-math',
    label: 'Load: Japan Math Lesson (angles)',
    description: 'TIMSS video study example',
    keywords: ['example', 'timss', 'math', 'angles', 'japan'],
    icon: '📐',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-6' } })),
  },
  {
    id: 'example-us-math-linear',
    label: 'Load: U.S. Math Lesson (linear equations)',
    description: 'TIMSS video study example',
    keywords: ['example', 'timss', 'math', 'linear', 'equations', 'usa'],
    icon: '📈',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-7' } })),
  },
  {
    id: 'example-us-science-rocks',
    label: 'Load: U.S. Science Lesson (rocks)',
    description: 'TIMSS video study example',
    keywords: ['example', 'timss', 'science', 'rocks', 'geology', 'usa'],
    icon: '🪨',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-8' } })),
  },
  {
    id: 'example-netherlands-math',
    label: 'Load: Netherlands Math (pythagorean)',
    description: 'TIMSS video study example',
    keywords: ['example', 'timss', 'math', 'pythagorean', 'theorem', 'netherlands'],
    icon: '📐',
    category: 'examples',
    action: () => window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: 'example-9' } })),
  },
]

// ==================== SETTINGS ACTIONS ====================

const settingsActions: AppAction[] = [
  {
    id: 'open-settings',
    label: 'Open Settings',
    description: 'Open the settings modal',
    keywords: ['settings', 'preferences', 'config', 'options'],
    icon: '⚙️',
    category: 'settings',
    action: () => openModal('settings'),
  },
  {
    id: 'open-data-explorer',
    label: 'Open Data Explorer',
    description: 'View and explore loaded data',
    keywords: ['data', 'explorer', 'table', 'view'],
    icon: '📊',
    category: 'settings',
    action: () => openModal('dataExplorer'),
  },
  {
    id: 'open-help',
    label: 'Open Help',
    description: 'View help and documentation',
    keywords: ['help', 'docs', 'documentation', 'guide'],
    icon: '❓',
    category: 'settings',
    shortcut: { key: 'h' },
    action: () => window.dispatchEvent(new CustomEvent('igs:toggle-help')),
  },
  {
    id: 'show-shortcuts',
    label: 'Show Keyboard Shortcuts',
    description: 'Display keyboard shortcuts cheatsheet',
    keywords: ['shortcuts', 'keyboard', 'keys', 'cheatsheet', 'hotkeys'],
    icon: '⌨️',
    category: 'settings',
    shortcut: { key: '?', modifiers: { shift: true } },
    action: () => window.dispatchEvent(new CustomEvent('igs:open-cheatsheet')),
  },
  {
    id: 'open-file',
    label: 'Open File',
    description: 'Open file selection dialog',
    keywords: ['open', 'file', 'import', 'load', 'upload'],
    icon: '📁',
    category: 'settings',
    shortcut: { key: 'o' },
    action: () => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fileInput?.click()
    },
  },
  {
    id: 'download-codes',
    label: 'Download Codes',
    description: 'Download the current code data file',
    keywords: ['download', 'export', 'codes', 'save'],
    icon: '💾',
    category: 'settings',
    shortcut: { key: 'S', modifiers: { shift: true, meta: true }, preventDefault: true },
    action: () => window.dispatchEvent(new CustomEvent('igs:download-codes')),
  },
]

// ==================== ALL ACTIONS ====================

/**
 * All app actions in a single array
 */
export const allActions: AppAction[] = [
  ...filterActions,
  ...selectionActions,
  ...viewActions,
  ...playbackActions,
  ...clearActions,
  ...exampleActions,
  ...settingsActions,
]

/**
 * Get all actions
 */
export function getAllActions(): AppAction[] {
  return allActions
}

/**
 * Find an action by ID
 */
export function findActionById(id: string): AppAction | undefined {
  return allActions.find((action) => action.id === id)
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: AppAction['category']): string {
  const labels: Record<AppAction['category'], string> = {
    filter: 'Filter',
    selection: 'Selection',
    view: 'View',
    playback: 'Playback',
    clear: 'Clear Data',
    examples: 'Example Datasets',
    settings: 'Settings',
  }
  return labels[category] || category
}
