export interface TourStep {
  element: string | (() => Element) // CSS selector, or resolved at highlight time
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
}

export interface TourState {
  hasCompleted: boolean
  version: string
  completedAt?: number
}
