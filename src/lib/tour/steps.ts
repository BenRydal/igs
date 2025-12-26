import type { TourStep } from './types'

export const tourSteps: TourStep[] = [
  {
    element: '.navbar',
    popover: {
      title: 'Welcome to the IGS!',
      description:
        "The Interaction Geography Slicer is an open-source tool to visualize movement, conversation, and video data over space and time. Let's take a quick tour!",
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#examples-dropdown',
    popover: {
      title: 'Try Example Data',
      description:
        'Start exploring immediately! Select from sample datasets including sports, museums, and classrooms.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tip="Import Files"]',
    popover: {
      title: 'Upload Your Data',
      description:
        'Import your own data: CSV files of movement and conversation, images for floor plans, and MP4 videos. All processing happens locally in your browser.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: 'canvas',
    popover: {
      title: 'Visualization Canvas',
      description:
        "This is where your data comes to life. You'll see movement trails, conversation transcripts, and floor plans visualized here.",
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '.navbar details:nth-of-type(1)',
    popover: {
      title: 'Filter and Select Options',
      description:
        "Control what's displayed by filtering and selecting movement and conversation data in different ways.",
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#talk-dropdown',
    popover: {
      title: 'Conversation Controls',
      description:
        'Adjust how conversation data is displayed, grouped, and aligned. Search through conversations too!',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#btn-toggle-3d',
    popover: {
      title: 'Toggle 2D/3D Views',
      description: 'Shift between 2D (floor plan) and 3D (space-time cube) views.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '.btm-nav .flex-1',
    popover: {
      title: 'Manage Users & Codes',
      description:
        'When data is loaded, individual users appear here. Click to show/hide user data and manage codes.',
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
