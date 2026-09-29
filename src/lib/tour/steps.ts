import type { TourStep } from './types'

const railItem = (label: string) => `.activity-bar__item[aria-label="${label}"]`

/** Opens a left-bar panel, then resolves an element inside it (or the fallback). */
function inPanel(tab: string, selector: string, fallback: string): () => Element {
  return () => {
    window.dispatchEvent(new CustomEvent('igs:open-panel', { detail: { tab } }))
    return (
      document.querySelector(selector) ??
      document.querySelector(fallback) ??
      document.querySelector('.activity-bar') ??
      document.body
    )
  }
}

/** Filters only exist in advanced mode; otherwise point at the toggle that reveals them. */
function filterStep(): Element {
  if (document.querySelector(railItem('Filters'))) {
    return inPanel('filters', '#igs-side-panel', railItem('Filters'))()
  }
  return inPanel('settings', '#advanced-mode-toggle', railItem('Settings'))()
}

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
    element: inPanel('data', '#igs-side-panel', railItem('Data')),
    popover: {
      title: 'Try Example Data',
      description:
        'Start exploring immediately! Select from sample datasets including sports, museums, and classrooms.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: inPanel('data', '#btn-import-files', railItem('Data')),
    popover: {
      title: 'Upload Your Data',
      description:
        'Import your own data: CSV files of movement and conversation, images for floor plans, and MP4 videos. All processing happens locally in your browser.',
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
    element: filterStep,
    popover: {
      title: 'Filter and Select Options',
      description:
        "Control what's displayed by filtering and selecting movement and conversation data in different ways.",
      side: 'right',
      align: 'start',
    },
  },
  {
    element: inPanel('talk', '#igs-side-panel', railItem('Talk')),
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
    element: inPanel('people', '#igs-side-panel', railItem('People')),
    popover: {
      title: 'Manage Users & Codes',
      description:
        'When data is loaded, individual users appear here. Click to show/hide user data and manage codes.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '.btm-nav',
    popover: {
      title: 'Control Time',
      description:
        'Play/pause, adjust speed, and scrub through your data timeline. Click the time display to change formats!',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: railItem('Help'),
    popover: {
      title: 'Need Help?',
      description:
        'Access documentation anytime. You can restart this tour from the Help menu whenever you need a refresher.',
      side: 'right',
      align: 'start',
    },
  },
]
