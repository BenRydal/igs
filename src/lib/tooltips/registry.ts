/**
 * Tooltip content registry for IGS application
 *
 * Central registry of tooltip content for UI controls.
 * Each entry provides title, description, and optional keyboard shortcut.
 */

export interface TooltipContent {
  /**
   * Short title for the tooltip
   */
  title: string
  /**
   * Longer description explaining the control's purpose
   */
  description: string
  /**
   * Optional keyboard shortcut (e.g., "Space", "Cmd+K")
   */
  shortcut?: string
}

/**
 * Tooltip content registry
 *
 * Keys are control IDs, values are tooltip content
 */
export const tooltipRegistry: Record<string, TooltipContent> = {
  // ==================== File Management ====================

  'upload-button': {
    title: 'Upload Files',
    description:
      'Upload CSV data files, floorplan images (JPG/PNG), or video files (MP4) for visualization',
    shortcut: 'Cmd+O',
  },

  'clear-all': {
    title: 'Clear All Data',
    description:
      'Remove all uploaded data including movement, conversation, codes, floorplan, and video',
  },

  'clear-movement': {
    title: 'Clear Movement Data',
    description: 'Remove all movement trail data while keeping other data intact',
  },

  'clear-conversation': {
    title: 'Clear Conversation Data',
    description: 'Remove all conversation trail data while keeping other data intact',
  },

  'clear-codes': {
    title: 'Clear Codes',
    description: 'Remove all code annotations while keeping movement and conversation data',
  },

  'clear-video': {
    title: 'Clear Video',
    description: 'Remove the synchronized video file while keeping other data intact',
  },

  'download-code-file': {
    title: 'Download Code File',
    description: 'Export the current code definitions as a CSV file for reuse',
  },

  // ==================== Playback Controls ====================

  'play-pause': {
    title: 'Play/Pause',
    description: 'Start or pause the timeline animation playback',
    shortcut: 'Space',
  },

  'timeline-slider': {
    title: 'Timeline Scrubber',
    description: 'Drag to jump to any point in the timeline. Click to seek to a specific time.',
  },

  'animation-rate': {
    title: 'Animation Speed',
    description:
      'Adjust the playback speed of the timeline animation. Higher values = faster playback.',
  },

  // ==================== View Controls ====================

  'toggle-3d': {
    title: 'Toggle 2D/3D',
    description: 'Switch between 2D top-down view and interactive 3D perspective view',
    shortcut: 'D',
  },

  'toggle-video': {
    title: 'Toggle Video',
    description: 'Show or hide the synchronized video overlay on the visualization',
    shortcut: 'V',
  },

  'rotate-left': {
    title: 'Rotate Left',
    description: 'Rotate the floorplan and visualization 90 degrees counter-clockwise',
    shortcut: 'Q',
  },

  'rotate-right': {
    title: 'Rotate Right',
    description: 'Rotate the floorplan and visualization 90 degrees clockwise',
    shortcut: 'E',
  },

  'zoom-controls': {
    title: 'Zoom',
    description:
      'Zoom in/out on the visualization. Use mouse wheel or pinch gestures for continuous zoom.',
  },

  // ==================== Display Toggles ====================

  'movement-toggle': {
    title: 'Show Movement Trails',
    description: 'Display movement paths and location trails for all users over time',
    shortcut: 'M',
  },

  'stops-toggle': {
    title: 'Show Stops',
    description: 'Highlight locations where users stopped moving for extended periods',
  },

  'conversation-toggle': {
    title: 'Show Conversation',
    description: 'Display conversation trails and speaking indicators between users',
    shortcut: 'C',
  },

  'align-toggle': {
    title: 'Align Conversation',
    description: 'Align conversation trails to create clearer visual groupings',
  },

  'circle-toggle': {
    title: 'Circle View',
    description: 'Display user positions as circles on the floorplan',
    shortcut: '1',
  },

  'slice-toggle': {
    title: 'Slice View',
    description: 'Display user positions as directional slices showing orientation',
    shortcut: '2',
  },

  'highlight-toggle': {
    title: 'Highlight View',
    description: 'Highlight specific users or interactions for focused analysis',
    shortcut: '3',
  },

  'color-by-codes': {
    title: 'Color by Codes',
    description: 'Color movement trails based on code annotations instead of user colors',
  },

  // ==================== Data Controls ====================

  'user-enable': {
    title: 'Toggle User Visibility',
    description: 'Show or hide movement trails for this specific user',
  },

  'user-talk-enable': {
    title: 'Toggle User Conversation',
    description: 'Show or hide conversation trails for this specific user',
  },

  'user-color': {
    title: 'User Color',
    description: "Change the color used for this user's movement and conversation trails",
  },

  'code-enable': {
    title: 'Toggle Code Visibility',
    description: 'Show or hide movement segments annotated with this code',
  },

  'code-color': {
    title: 'Code Color',
    description: 'Change the color used when displaying this code annotation',
  },

  'select-all-codes': {
    title: 'Toggle All Codes',
    description: 'Enable or disable all code annotations at once',
  },

  // ==================== Modal Actions ====================

  'open-settings': {
    title: 'Settings',
    description: 'Open the settings modal to configure visualization parameters and preferences',
    shortcut: ',',
  },

  'open-help': {
    title: 'Help & Info',
    description: 'View help documentation, keyboard shortcuts, and application information',
    shortcut: '?',
  },

  'open-data-explorer': {
    title: 'Data Explorer',
    description: 'Browse and analyze the raw data points, timestamps, and annotations',
    shortcut: 'Cmd+D',
  },

  // ==================== Examples ====================

  'load-example': {
    title: 'Load Example',
    description: 'Load a pre-configured example dataset to explore IGS features and capabilities',
  },

  'word-search': {
    title: 'Word Search',
    description:
      'Search for specific words or phrases in conversation data to highlight relevant interactions',
  },
}

/**
 * Get tooltip content by ID
 *
 * @param id - The control ID
 * @returns Tooltip content
 * @throws Error if tooltip ID is not found in registry
 */
export function getTooltip(id: string): TooltipContent {
  const tooltip = tooltipRegistry[id]
  if (!tooltip) {
    throw new Error(
      `Tooltip with id "${id}" not found in registry. Available IDs: ${Object.keys(tooltipRegistry).join(', ')}`
    )
  }
  return tooltip
}

/**
 * Safely get tooltip content by ID
 *
 * @param id - The control ID
 * @returns Tooltip content or undefined if not found
 */
export function getTooltipSafe(id: string): TooltipContent | undefined {
  return tooltipRegistry[id]
}

/**
 * Check if a tooltip exists for a given ID
 *
 * @param id - The control ID
 * @returns true if tooltip exists
 */
export function hasTooltip(id: string): boolean {
  return id in tooltipRegistry
}

/**
 * Get all tooltip IDs
 *
 * @returns Array of all registered tooltip IDs
 */
export function getAllTooltipIds(): string[] {
  return Object.keys(tooltipRegistry)
}

/**
 * Get tooltips by category (based on ID prefix)
 *
 * @param prefix - ID prefix to filter by (e.g., 'user-', 'code-')
 * @returns Object with matching tooltips
 */
export function getTooltipsByPrefix(prefix: string): Record<string, TooltipContent> {
  return Object.entries(tooltipRegistry)
    .filter(([id]) => id.startsWith(prefix))
    .reduce(
      (acc, [id, content]) => {
        acc[id] = content
        return acc
      },
      {} as Record<string, TooltipContent>
    )
}
