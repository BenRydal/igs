export interface TourStep {
  element: string // CSS selector
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
