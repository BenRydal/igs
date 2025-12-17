import type { Command } from './types'
import { get } from 'svelte/store'
import ConfigStore, { type ConfigStoreType } from '../../../stores/configStore'
import TimelineStore from '../../../stores/timelineStore'
import VideoStore from '../../../stores/videoStore'
import P5Store from '../../../stores/p5Store'
import { openModal } from '../../../stores/modalStore'
import type { Timeline } from '../../../models/timeline'

// Type guards and helpers for p5 instance
interface IGSp5Instance {
  handle3D?: {
    rotateLeft: () => void
    rotateRight: () => void
    toggle: () => void
  }
  core?: {
    clearMovement: () => void
    clearConversation: () => void
    clearCodes: () => void
    clearAll: () => void
    loadExampleData: (exampleId: string) => void
  }
  noLoop?: () => void
  loop?: () => void
}

/**
 * Get all available commands for the command palette
 *
 * Commands are organized by category:
 * - filter: Toggle visibility of data elements
 * - selection: Selection tools (circle, slice, highlight)
 * - view: View controls (3D rotation, video)
 * - clear: Clear data actions
 * - examples: Load example datasets
 * - playback: Animation controls
 * - settings: Application settings
 */
export function getAllCommands(): Command[] {
  return [
    // ==================== FILTER COMMANDS ====================
    {
      id: 'filter:movement',
      label: 'Toggle Movement Trails',
      description: 'Show or hide movement paths',
      keywords: ['trails', 'paths', 'lines', 'movement'],
      icon: '🚶',
      category: 'filter',
      shortcut: 'M',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          movementToggle: !config.movementToggle,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).movementToggle,
    },
    {
      id: 'filter:stops',
      label: 'Toggle Stop Points',
      description: 'Show or hide stop points',
      keywords: ['stops', 'points', 'pause', 'stationary'],
      icon: '⏸️',
      category: 'filter',
      shortcut: 'S',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          stopsToggle: !config.stopsToggle,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).stopsToggle,
    },
    {
      id: 'filter:align-conversation',
      label: 'Toggle Conversation Alignment',
      description: 'Align conversation data with timeline',
      keywords: ['align', 'conversation', 'sync', 'timeline'],
      icon: '💬',
      category: 'filter',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          alignToggle: !config.alignToggle,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).alignToggle,
    },
    {
      id: 'filter:path-color-mode',
      label: 'Toggle Path Color Mode',
      description: 'Switch between different coloring modes',
      keywords: ['color', 'mode', 'path', 'theme'],
      icon: '🎨',
      category: 'filter',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          isPathColorMode: !config.isPathColorMode,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).isPathColorMode,
    },

    // ==================== SELECTION COMMANDS ====================
    {
      id: 'select:circle',
      label: 'Circle Selection Tool',
      description: 'Select data with a circular area',
      keywords: ['circle', 'select', 'tool', 'area'],
      icon: '⭕',
      category: 'selection',
      shortcut: 'C',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          circleToggle: !config.circleToggle,
          sliceToggle: false,
          highlightToggle: false,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).circleToggle,
    },
    {
      id: 'select:slice',
      label: 'Slice Selection Tool',
      description: 'Select data with a slice/wedge area',
      keywords: ['slice', 'wedge', 'select', 'tool', 'area'],
      icon: '🍕',
      category: 'selection',
      shortcut: 'L',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          sliceToggle: !config.sliceToggle,
          circleToggle: false,
          highlightToggle: false,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).sliceToggle,
    },
    {
      id: 'select:highlight',
      label: 'Highlight Selection Tool',
      description: 'Highlight selected data',
      keywords: ['highlight', 'select', 'tool', 'focus'],
      icon: '🔦',
      category: 'selection',
      shortcut: 'H',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          highlightToggle: !config.highlightToggle,
          circleToggle: false,
          sliceToggle: false,
        }))
      },
      isActive: () => (get(ConfigStore) as ConfigStoreType).highlightToggle,
    },
    {
      id: 'select:clear-all',
      label: 'Clear All Selections',
      description: 'Deactivate all selection tools',
      keywords: ['clear', 'deselect', 'none'],
      icon: '❌',
      category: 'selection',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          circleToggle: false,
          sliceToggle: false,
          highlightToggle: false,
        }))
      },
    },

    // ==================== VIEW COMMANDS ====================
    {
      id: 'view:rotate-left',
      label: 'Rotate View Left',
      description: 'Rotate the 3D view counterclockwise',
      keywords: ['rotate', 'left', 'ccw', '3d', 'view'],
      icon: '↶',
      category: 'view',
      shortcut: 'Left Arrow',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.handle3D) {
          p5.handle3D.rotateLeft()
        }
      },
    },
    {
      id: 'view:rotate-right',
      label: 'Rotate View Right',
      description: 'Rotate the 3D view clockwise',
      keywords: ['rotate', 'right', 'cw', '3d', 'view'],
      icon: '↷',
      category: 'view',
      shortcut: 'Right Arrow',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.handle3D) {
          p5.handle3D.rotateRight()
        }
      },
    },
    {
      id: 'view:toggle-3d',
      label: 'Toggle 2D/3D View',
      description: 'Switch between 2D and 3D visualization',
      keywords: ['3d', '2d', 'dimension', 'view', 'toggle'],
      icon: '🔄',
      category: 'view',
      shortcut: 'D',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.handle3D) {
          p5.handle3D.toggle()
        }
      },
    },
    {
      id: 'view:toggle-video',
      label: 'Toggle Video',
      description: 'Show or hide the video player',
      keywords: ['video', 'player', 'toggle', 'show', 'hide'],
      icon: '🎥',
      category: 'view',
      shortcut: 'V',
      action: () => {
        VideoStore.update((store: { isShowing: boolean; isPlaying: boolean }) => ({
          ...store,
          isShowing: !store.isShowing,
        }))
      },
      isActive: () => (get(VideoStore) as { isShowing: boolean; isPlaying: boolean }).isShowing,
    },

    // ==================== CLEAR COMMANDS ====================
    {
      id: 'clear:movement',
      label: 'Clear Movement Data',
      description: 'Remove all movement trails',
      keywords: ['clear', 'remove', 'movement', 'trails'],
      icon: '🗑️',
      category: 'clear',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.core) {
          p5.core.clearMovement()
        }
      },
    },
    {
      id: 'clear:conversation',
      label: 'Clear Conversation Data',
      description: 'Remove all conversation data',
      keywords: ['clear', 'remove', 'conversation', 'chat'],
      icon: '🗑️',
      category: 'clear',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.core) {
          p5.core.clearConversation()
        }
      },
    },
    {
      id: 'clear:codes',
      label: 'Clear Code Data',
      description: 'Remove all code annotations',
      keywords: ['clear', 'remove', 'codes', 'annotations'],
      icon: '🗑️',
      category: 'clear',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.core) {
          p5.core.clearCodes()
        }
      },
    },
    {
      id: 'clear:all',
      label: 'Clear All Data',
      description: 'Remove all loaded data',
      keywords: ['clear', 'remove', 'all', 'reset'],
      icon: '🗑️',
      category: 'clear',
      action: () => {
        const p5 = get(P5Store) as IGSp5Instance
        if (p5?.core) {
          p5.core.clearAll()
        }
      },
    },

    // ==================== EXAMPLE DATASETS ====================
    // Examples use custom events to trigger loading via +page.svelte
    {
      id: 'example:jordan-shot',
      label: "Load: Michael Jordan's Last Shot",
      description: 'Sports example dataset',
      keywords: ['example', 'sports', 'basketball', 'jordan'],
      icon: '🏀',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-1' } })
        )
      },
    },
    {
      id: 'example:museum',
      label: 'Load: Family Gallery Visit',
      description: 'Museum example dataset',
      keywords: ['example', 'museum', 'gallery', 'family'],
      icon: '🖼️',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-2' } })
        )
      },
    },
        {
      id: 'example:museum-complete-visit',
      label: 'Load: Family Museum Visit',
      description: 'Museum example dataset',
      keywords: ['example', 'museum', 'gallery', 'family'],
      icon: '👩‍🏫',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-11' } })
        )
      },
    },
    {
      id: 'example:ap-math',
      label: 'Load: AP Math Lesson',
      description: 'Classroom example dataset',
      keywords: ['example', 'classroom', 'math', 'ap'],
      icon: '📐',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-10' } })
        )
      },
    },
    {
      id: 'example:3rd-grade',
      label: 'Load: 3rd Grade Numbers Discussion',
      description: 'Classroom example dataset',
      keywords: ['example', 'classroom', '3rd grade', 'numbers'],
      icon: '🔢',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-4' } })
        )
      },
    },
    {
      id: 'example:us-science-weather',
      label: 'Load: U.S. Science Lesson (weather)',
      description: 'TIMSS video study example',
      keywords: ['example', 'timss', 'science', 'weather', 'usa'],
      icon: '🌤️',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-3' } })
        )
      },
    },
    {
      id: 'example:czech-science',
      label: 'Load: Czech Republic Science (density)',
      description: 'TIMSS video study example',
      keywords: ['example', 'timss', 'science', 'density', 'czech'],
      icon: '⚗️',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-5' } })
        )
      },
    },
    {
      id: 'example:japan-math',
      label: 'Load: Japan Math Lesson (angles)',
      description: 'TIMSS video study example',
      keywords: ['example', 'timss', 'math', 'angles', 'japan'],
      icon: '📐',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-6' } })
        )
      },
    },
    {
      id: 'example:us-math-linear',
      label: 'Load: U.S. Math Lesson (linear equations)',
      description: 'TIMSS video study example',
      keywords: ['example', 'timss', 'math', 'linear', 'equations', 'usa'],
      icon: '📈',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-7' } })
        )
      },
    },
    {
      id: 'example:us-science-rocks',
      label: 'Load: U.S. Science Lesson (rocks)',
      description: 'TIMSS video study example',
      keywords: ['example', 'timss', 'science', 'rocks', 'geology', 'usa'],
      icon: '🪨',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-8' } })
        )
      },
    },
    {
      id: 'example:netherlands-math',
      label: 'Load: Netherlands Math (pythagorean)',
      description: 'TIMSS video study example',
      keywords: ['example', 'timss', 'math', 'pythagorean', 'theorem', 'netherlands'],
      icon: '📐',
      category: 'examples',
      action: () => {
        window.dispatchEvent(
          new CustomEvent('igs:load-example', { detail: { value: 'example-9' } })
        )
      },
    },

    // ==================== PLAYBACK COMMANDS ====================
    {
      id: 'playback:toggle',
      label: 'Play/Pause Animation',
      description: 'Toggle animation playback',
      keywords: ['play', 'pause', 'animation', 'timeline'],
      icon: '⏯️',
      category: 'playback',
      shortcut: 'Space',
      action: () => {
        const timeline = get(TimelineStore) as Timeline
        const p5 = get(P5Store) as IGSp5Instance

        if (timeline.getIsAnimating()) {
          timeline.setIsAnimating(false)
          if (p5?.noLoop) p5.noLoop()
        } else {
          timeline.setIsAnimating(true)
          if (p5?.loop) p5.loop()
        }

        TimelineStore.set(timeline)
      },
      isActive: () => (get(TimelineStore) as Timeline).getIsAnimating(),
    },
    {
      id: 'playback:speed-up',
      label: 'Increase Animation Speed',
      description: 'Make animation play faster',
      keywords: ['speed', 'faster', 'animation', 'rate'],
      icon: '⏩',
      category: 'playback',
      shortcut: ']',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          animationRate: Math.min(config.animationRate + 0.05, 1),
        }))
      },
    },
    {
      id: 'playback:speed-down',
      label: 'Decrease Animation Speed',
      description: 'Make animation play slower',
      keywords: ['speed', 'slower', 'animation', 'rate'],
      icon: '⏪',
      category: 'playback',
      shortcut: '[',
      action: () => {
        ConfigStore.update((config: ConfigStoreType) => ({
          ...config,
          animationRate: Math.max(config.animationRate - 0.05, 0.01),
        }))
      },
    },
    {
      id: 'playback:reset-time',
      label: 'Reset Timeline to Start',
      description: 'Jump to the beginning of the timeline',
      keywords: ['reset', 'start', 'beginning', 'timeline'],
      icon: '⏮️',
      category: 'playback',
      shortcut: 'Home',
      action: () => {
        const timeline = get(TimelineStore) as Timeline
        timeline.setCurrTime(0)
        TimelineStore.set(timeline)
      },
    },

    // ==================== SETTINGS COMMANDS ====================
    {
      id: 'settings:open',
      label: 'Open Settings',
      description: 'Open the settings modal',
      keywords: ['settings', 'preferences', 'config', 'options'],
      icon: '⚙️',
      category: 'settings',
      shortcut: 'Cmd+,',
      action: () => {
        openModal('settings')
      },
    },
    {
      id: 'settings:open-data-explorer',
      label: 'Open Data Explorer',
      description: 'View and explore loaded data',
      keywords: ['data', 'explorer', 'table', 'view'],
      icon: '📊',
      category: 'settings',
      action: () => {
        openModal('dataExplorer')
      },
    },
    {
      id: 'settings:help',
      label: 'Open Help',
      description: 'View help and documentation',
      keywords: ['help', 'docs', 'documentation', 'guide'],
      icon: '❓',
      category: 'settings',
      shortcut: '?',
      action: () => {
        openModal('help')
      },
    },
  ]
}

/**
 * Get commands grouped by category
 */
export function getCommandsByCategory(): Map<string, Command[]> {
  const commands = getAllCommands()
  const grouped = new Map<string, Command[]>()

  for (const command of commands) {
    const categoryCommands = grouped.get(command.category) || []
    categoryCommands.push(command)
    grouped.set(command.category, categoryCommands)
  }

  return grouped
}

/**
 * Find a command by ID
 */
export function findCommandById(id: string): Command | undefined {
  return getAllCommands().find((cmd) => cmd.id === id)
}

/**
 * Get category display name
 */
export function getCategoryLabel(category: Command['category']): string {
  const labels: Record<Command['category'], string> = {
    filter: 'Filter',
    selection: 'Selection',
    view: 'View',
    clear: 'Clear Data',
    examples: 'Example Datasets',
    playback: 'Playback',
    settings: 'Settings',
  }
  return labels[category] || category
}
