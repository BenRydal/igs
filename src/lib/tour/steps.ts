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
    element: '.activity-bar__item[aria-label="Data"]',
    popover: {
      title: 'Load Data',
      description:
        'Start with a sample dataset from sports, museums, and classrooms, or import your own: CSV files of movement and conversation, images for floor plans, and MP4 videos. All processing happens locally in your browser.',
      side: 'right',
      align: 'start',
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
    element: '.activity-bar',
    popover: {
      title: 'Panels',
      description:
        'Each icon opens a panel beside the canvas. Turn on Advanced mode in Settings for filtering, selection, and floor plan controls.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '.activity-bar__item[aria-label="Talk"]',
    popover: {
      title: 'Conversation Controls',
      description:
        'Adjust how conversation data is displayed, grouped, and aligned. Search through conversations too!',
      side: 'right',
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
    element: '#timeline-panel',
    popover: {
      title: 'Control Time',
      description:
        'Play/pause, adjust speed, and scrub through your data timeline. Click the time display to change formats!',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '.activity-bar__item[aria-label="Help"]',
    popover: {
      title: 'Need Help?',
      description:
        'Access documentation anytime. You can restart this tour from the Help menu whenever you need a refresher.',
      side: 'right',
      align: 'end',
    },
  },
]
