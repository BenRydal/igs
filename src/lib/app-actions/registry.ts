import { get } from 'svelte/store'
import { createActionRegistry, type Action, type ActionSection } from 'svelte-p5-components/actions'
import ConfigStore from '../../stores/configStore'
import { toggleVisibility } from '../../stores/videoStore'
import { togglePlayback, isPlaying } from '../../stores/playbackStore'
import { timelineV2Store } from '../timeline/store'
import { openModal } from '../../stores/modalStore'
import { historyStore } from '../../stores/historyStore'
import { VISIBLE_EXAMPLES, COLLECTIONS } from '../core/example-datasets'
import { rotateFloorplan } from '../utils/p5'
import {
  toggle3D,
  downloadCodes,
  toggleHelp,
  openCheatsheet,
  loadExample,
  clearMovement,
  clearConversation,
  clearCodes,
  clearAll,
} from '#lib/workspace/workspace.svelte.ts'

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

const filterActions: Action[] = [
  {
    id: 'toggle-movement',
    label: 'Toggle Movement Trails',
    description: 'Show or hide movement paths',
    keywords: ['trails', 'paths', 'lines', 'movement'],
    icon: '🚶',
    group: 'filter',
    keys: { key: 'm' },
    run: toggleMovement,
    checked: () => get(ConfigStore).movementToggle,
  },
  {
    id: 'toggle-stops',
    label: 'Toggle Stop Points',
    description: 'Show or hide stop points',
    keywords: ['stops', 'points', 'pause', 'stationary'],
    icon: '⏸️',
    group: 'filter',
    keys: { key: 's' },
    run: toggleStops,
    checked: () => get(ConfigStore).stopsToggle,
  },
  {
    id: 'toggle-conversation-alignment',
    label: 'Toggle Conversation Alignment',
    description: 'Align conversation data with timeline',
    keywords: ['align', 'conversation', 'sync', 'timeline', 'talk'],
    icon: '💬',
    group: 'filter',
    keys: { key: 'a' },
    run: toggleAlign,
    checked: () => get(ConfigStore).alignToggle,
  },
  {
    id: 'toggle-path-color-mode',
    label: 'Toggle Path Color Mode',
    description: 'Switch between user colors and code colors',
    keywords: ['color', 'mode', 'path', 'theme', 'codes'],
    icon: '🎨',
    group: 'filter',
    keys: { key: 'c' },
    run: toggleColorMode,
    checked: () => get(ConfigStore).isPathColorMode,
  },
]

const selectionActions: Action[] = [
  {
    id: 'select-circle',
    label: 'Circle Selection Tool',
    description: 'Select data with a circular area',
    keywords: ['circle', 'select', 'tool', 'area'],
    icon: '⭕',
    group: 'selection',
    keys: { key: '1' },
    run: () => {
      const config = get(ConfigStore)
      if (!config.circleToggle) toggleCircle()
      if (config.sliceToggle) toggleSlice()
      if (config.highlightToggle) toggleHighlight()
    },
    checked: () => get(ConfigStore).circleToggle,
  },
  {
    id: 'select-slice',
    label: 'Slice Selection Tool',
    description: 'Select data with a slice/wedge area',
    keywords: ['slice', 'wedge', 'select', 'tool', 'area'],
    icon: '🍕',
    group: 'selection',
    keys: { key: '2' },
    run: () => {
      const config = get(ConfigStore)
      if (config.circleToggle) toggleCircle()
      if (!config.sliceToggle) toggleSlice()
      if (config.highlightToggle) toggleHighlight()
    },
    checked: () => get(ConfigStore).sliceToggle,
  },
  {
    id: 'select-highlight',
    label: 'Highlight Selection Tool',
    description: 'Highlight selected data',
    keywords: ['highlight', 'select', 'tool', 'focus'],
    icon: '🔦',
    group: 'selection',
    keys: { key: '3' },
    run: () => {
      const config = get(ConfigStore)
      if (config.circleToggle) toggleCircle()
      if (config.sliceToggle) toggleSlice()
      if (!config.highlightToggle) toggleHighlight()
    },
    checked: () => get(ConfigStore).highlightToggle,
  },
  {
    id: 'select-clear-all',
    label: 'Clear All Selections',
    description: 'Deactivate all selection tools',
    keywords: ['clear', 'deselect', 'none', 'reset'],
    icon: '❌',
    group: 'selection',
    keys: { key: 'Escape' },
    run: () => {
      const config = get(ConfigStore)
      if (config.circleToggle) toggleCircle()
      if (config.sliceToggle) toggleSlice()
      if (config.highlightToggle) toggleHighlight()
    },
  },
]

const viewActions: Action[] = [
  {
    id: 'toggle-3d',
    label: 'Toggle 2D/3D View',
    description: 'Switch between 2D and 3D visualization',
    keywords: ['3d', '2d', 'dimension', 'view', 'toggle'],
    icon: '🔄',
    group: 'view',
    keys: { key: 'd' },
    run: toggle3D,
  },
  {
    id: 'rotate-right',
    label: 'Rotate View Right',
    description: 'Rotate the floor plan clockwise',
    keywords: ['rotate', 'right', 'cw', 'view', 'clockwise'],
    icon: '↷',
    group: 'view',
    keys: { key: 'r' },
    run: () => rotateFloorplan('right'),
  },
  {
    id: 'rotate-left',
    label: 'Rotate View Left',
    description: 'Rotate the floor plan counter-clockwise',
    keywords: ['rotate', 'left', 'ccw', 'view', 'counter-clockwise'],
    icon: '↶',
    group: 'view',
    keys: { key: 'r', shift: true },
    run: () => rotateFloorplan('left'),
  },
  {
    id: 'toggle-video',
    label: 'Toggle Video',
    description: 'Show or hide the video player',
    keywords: ['video', 'player', 'toggle', 'show', 'hide'],
    icon: '🎥',
    group: 'view',
    keys: { key: 'v' },
    run: toggleVisibility,
  },
]

const playbackActions: Action[] = [
  {
    id: 'playback-toggle',
    label: 'Play/Pause Animation',
    description: 'Toggle animation playback',
    keywords: ['play', 'pause', 'animation', 'timeline'],
    icon: '⏯️',
    group: 'playback',
    keys: { key: ' ' },
    run: togglePlayback,
    checked: () => get(isPlaying),
  },
  {
    id: 'playback-seek-backward',
    label: 'Seek Backward',
    description: 'Jump backward 5 seconds',
    keywords: ['seek', 'backward', 'rewind', 'back'],
    icon: '⏪',
    group: 'playback',
    keys: { key: 'ArrowLeft' },
    run: () => {
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
    group: 'playback',
    keys: { key: 'ArrowRight' },
    run: () => {
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
    group: 'playback',
    keys: { key: 'Home' },
    run: () => {
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
    group: 'playback',
    keys: { key: 'End' },
    run: () => {
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
    group: 'playback',
    keys: [{ key: '=' }, { key: '+' }],
    run: () => {
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
    group: 'playback',
    keys: { key: '-' },
    run: () => {
      const config = get(ConfigStore)
      setAnimationRate(Math.max(0.01, config.animationRate - 0.01))
    },
  },
]

const clearActions: Action[] = [
  {
    id: 'clear-movement',
    label: 'Clear Movement Data',
    description: 'Remove all movement trails',
    keywords: ['clear', 'remove', 'movement', 'trails', 'delete'],
    icon: '🗑️',
    group: 'clear',
    run: clearMovement,
  },
  {
    id: 'clear-conversation',
    label: 'Clear Conversation Data',
    description: 'Remove all conversation data',
    keywords: ['clear', 'remove', 'conversation', 'chat', 'talk', 'delete'],
    icon: '🗑️',
    group: 'clear',
    run: clearConversation,
  },
  {
    id: 'clear-codes',
    label: 'Clear Code Data',
    description: 'Remove all code annotations',
    keywords: ['clear', 'remove', 'codes', 'annotations', 'delete'],
    icon: '🗑️',
    group: 'clear',
    run: clearCodes,
  },
  {
    id: 'clear-all',
    label: 'Clear All Data',
    description: 'Remove all loaded data',
    keywords: ['clear', 'remove', 'all', 'reset', 'delete'],
    icon: '🗑️',
    group: 'clear',
    run: clearAll,
  },
]

const exampleExtras: Record<string, { icon: string; keywords: string[] }> = {
  'example-1': { icon: '🏀', keywords: ['sports', 'basketball', 'jordan'] },
  'example-2': { icon: '🖼️', keywords: ['museum', 'gallery', 'family'] },
  'example-3': { icon: '🌤️', keywords: ['science', 'weather', 'usa'] },
  'example-4': { icon: '🔢', keywords: ['classroom', '3rd grade', 'numbers', 'odd', 'even'] },
  'example-5': { icon: '⚗️', keywords: ['science', 'density', 'czech'] },
  'example-6': { icon: '📐', keywords: ['math', 'angles', 'japan'] },
  'example-7': { icon: '📈', keywords: ['math', 'linear', 'equations', 'usa'] },
  'example-8': { icon: '🪨', keywords: ['science', 'rocks', 'geology', 'usa'] },
  'example-9': { icon: '📐', keywords: ['math', 'pythagorean', 'theorem', 'netherlands'] },
  'example-10': { icon: '📐', keywords: ['classroom', 'math', 'ap', 'clark'] },
  'example-11': { icon: '👩‍🏫', keywords: ['museum', 'gallery', 'family', 'complete'] },
  'example-12': { icon: '🚶', keywords: ['tour', 'gps', 'civil rights', 'making', 'route'] },
  'example-13': { icon: '🚶', keywords: ['tour', 'gps', 'civil rights', 'taking', 'route'] },
  'example-14': { icon: '🗺️', keywords: ['tour', 'gps', 'jefferson', 'street'] },
  'example-17': { icon: '📐', keywords: ['math', 'sandy', 'classroom'] },
  'example-18': { icon: '📐', keywords: ['math', 'sandy', 'classroom'] },
  'example-19': { icon: '📐', keywords: ['math', 'sofia', 'classroom'] },
  'example-20': { icon: '📐', keywords: ['math', 'vince', 'classroom'] },
}

const exampleActions: Action[] = VISIBLE_EXAMPLES.map((entry) => {
  const extras = exampleExtras[entry.id]
  const collection = COLLECTIONS.find((c) => c.id === entry.collection)
  return {
    id: `load-${entry.id}`,
    label: `Load: ${entry.label}`,
    description: collection ? `${collection.label} · ${entry.duration}` : entry.duration,
    keywords: [
      'example',
      ...(collection ? [collection.label.toLowerCase()] : []),
      ...(extras?.keywords ?? []),
    ],
    icon: extras?.icon ?? '📁',
    group: 'examples',
    run: () => loadExample(entry.id),
  }
})

const settingsActions: Action[] = [
  {
    id: 'open-settings',
    label: 'Open Settings',
    description: 'Open the settings modal',
    keywords: ['settings', 'preferences', 'config', 'options'],
    icon: '⚙️',
    group: 'settings',
    run: () => openModal('settings'),
  },
  {
    id: 'open-data-explorer',
    label: 'Open Data Explorer',
    description: 'View and explore loaded data',
    keywords: ['data', 'explorer', 'table', 'view'],
    icon: '📊',
    group: 'settings',
    run: () => openModal('dataExplorer'),
  },
  {
    id: 'open-help',
    label: 'Open Help',
    description: 'View help and documentation',
    keywords: ['help', 'docs', 'documentation', 'guide'],
    icon: '❓',
    group: 'settings',
    keys: { key: 'h' },
    run: toggleHelp,
  },
  {
    id: 'show-shortcuts',
    label: 'Show Keyboard Shortcuts',
    description: 'Display keyboard shortcuts cheatsheet',
    keywords: ['shortcuts', 'keyboard', 'keys', 'cheatsheet', 'hotkeys'],
    icon: '⌨️',
    group: 'settings',
    keys: { key: '?' },
    run: openCheatsheet,
  },
  {
    id: 'open-file',
    label: 'Open File',
    description: 'Open file selection dialog',
    keywords: ['open', 'file', 'import', 'load', 'upload'],
    icon: '📁',
    group: 'settings',
    keys: { key: 'o' },
    run: () => {
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
    group: 'settings',
    keys: { key: 's', mod: true, shift: true },
    run: downloadCodes,
  },
]

const historyActions: Action[] = [
  {
    id: 'undo',
    label: 'Undo',
    group: 'history',
    keys: { key: 'z', mod: true },
    hidden: true,
    run: () => {
      historyStore.undo()
    },
  },
  {
    id: 'redo',
    label: 'Redo',
    group: 'history',
    keys: [
      { key: 'z', mod: true, shift: true },
      { key: 'y', mod: true },
    ],
    hidden: true,
    run: () => {
      historyStore.redo()
    },
  },
]

export const registry = createActionRegistry(
  [
    ...filterActions,
    ...selectionActions,
    ...viewActions,
    ...playbackActions,
    ...clearActions,
    ...exampleActions,
    ...settingsActions,
    ...historyActions,
  ],
  {
    groupLabels: {
      filter: 'Filter',
      selection: 'Selection',
      view: 'View',
      playback: 'Playback',
      clear: 'Clear Data',
      examples: 'Example Datasets',
      settings: 'Settings',
      history: 'History',
    },
  }
)

export const cheatsheetSections: ActionSection[] = [
  { id: 'playback', label: 'Playback' },
  { id: 'view', label: 'View' },
  { id: 'selection', label: 'Selection' },
  { id: 'navigation', label: 'Navigation', groups: ['history', 'examples'] },
  { id: 'data', label: 'Data', groups: ['filter', 'clear'] },
  { id: 'modal', label: 'Modal', groups: ['settings'] },
]
