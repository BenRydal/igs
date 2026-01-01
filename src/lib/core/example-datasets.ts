/**
 * Example datasets configuration for IGS
 * Each example includes CSV files and optional YouTube video ID
 */

export interface ExampleDataset {
  files: string[]
  videoId?: string
  duration: string
}

export const EXAMPLE_DATASETS: Record<string, ExampleDataset> = {
  'example-1': {
    files: ['jordan.csv', 'possession.csv'],
    videoId: 'iiMjfVOj8po',
    duration: '37 sec',
  },
  'example-2': {
    files: ['adhir.csv', 'blake.csv', 'jeans.csv', 'lily.csv', 'mae.csv', 'conversation.csv'],
    videoId: 'pWJ3xNk1Zpg',
    duration: '8 min',
  },
  'example-3': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'Iu0rxb-xkMk',
    duration: '56 min',
  },
  'example-4': {
    files: ['cassandra.csv', 'mei.csv', 'nathan.csv', 'sean.csv', 'teacher.csv', 'conversation.csv'],
    videoId: 'OJSZCK4GPQY',
    duration: '7 min',
  },
  'example-5': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'xrisdnH5GmQ',
    duration: '49 min',
  },
  'example-6': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'nLDXU2c0vLw',
    duration: '52 min',
  },
  'example-7': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: '5Eg1fJ-ZpQs',
    duration: '44 min',
  },
  'example-8': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'gPb_ST74bpg',
    duration: '41 min',
  },
  'example-9': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'P5Lxj2nfGzc',
    duration: '50 min',
  },
  'example-10': {
    files: ['teacher.csv', 'conversation.csv'],
    duration: '1h 35m',
  },
  'example-11': {
    files: ['adhir.csv', 'blake.csv', 'jeans.csv', 'lily.csv', 'mae.csv'],
    duration: '47 min',
  },
  'example-12': {
    files: ['Making Tour.csv', 'conversation.csv'],
    duration: '43 min',
  },
  'example-13': {
    files: ['Taking Tour.csv', 'conversation.csv'],
    duration: '50 min',
  },
  'example-14': {
    files: ['tour.csv'],
    duration: '3h 6m',
  },
} as const

export type ExampleId = keyof typeof EXAMPLE_DATASETS | ''

/**
 * Get example dataset configuration by ID
 * @param id - The example dataset ID
 * @returns The example dataset or undefined if not found
 */
export function getExampleDataset(id: string): ExampleDataset | undefined {
  return EXAMPLE_DATASETS[id]
}
