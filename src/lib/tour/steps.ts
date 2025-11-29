import type { TourStep } from './types'

export const tourSteps: TourStep[] = [
  {
    element: '.navbar',
    popover: {
      title: 'Welcome to IGS',
      description:
        "The Interaction Geography Slicer helps you visualize movement, conversation, and video data over space and time. Let's take a quick tour!",
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '.relative.inline-block.text-left',
    popover: {
      title: 'Try Example Data',
      description:
        'Start exploring immediately! Select from sample datasets including sports, museums, and classroom scenarios.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tip="Upload"]',
    popover: {
      title: 'Upload Your Data',
      description:
        'Import your own data: CSV files, images for floor plans, or MP4 videos. All processing happens locally in your browser.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: 'canvas',
    popover: {
      title: 'Visualization Canvas',
      description:
        "This is where your data comes to life. You'll see movement trails, conversation markers, and floor plans visualized here.",
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '.navbar details:nth-of-type(1)',
    popover: {
      title: 'Filter Options',
      description:
        "Control what's displayed: movement trails, stop points, and adjust stop length thresholds.",
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '.navbar details:nth-of-type(2)',
    popover: {
      title: 'Selection Tools',
      description:
        'Use Circle, Slice, or Highlight modes to select and explore specific data regions.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '.navbar details:nth-of-type(3)',
    popover: {
      title: 'Conversation Controls',
      description:
        'Adjust how conversation data is displayed and aligned. Search through conversations too!',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#btn-toggle-3d',
    popover: {
      title: 'Change Your Perspective',
      description: 'Toggle between 2D (floor plan) and 3D (space-time cube) views.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.btm-nav .flex-1',
    popover: {
      title: 'Manage Users & Codes',
      description:
        'When data is loaded, user buttons appear here. Click to show/hide individual users and manage codes.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '.slider-container',
    popover: {
      title: 'Control Time',
      description:
        'Play/pause, adjust speed, and scrub through your data timeline. Click the time display to change formats!',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tip="Help"]',
    popover: {
      title: 'Need Help?',
      description:
        'Access documentation anytime. You can restart this tour from the Help menu whenever you need a refresher.',
      side: 'bottom',
      align: 'end',
    },
  },
]
