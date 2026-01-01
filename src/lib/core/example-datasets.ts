/**
 * Example datasets configuration for IGS
 * Each example includes CSV files and optional YouTube video ID
 */

export interface ExampleDataset {
  files: string[]
  videoId?: string
  name: string
  description?: string
}

export const EXAMPLE_DATASETS: Record<string, ExampleDataset> = {
  'example-1': {
    files: ['jordan.csv', 'possession.csv'],
    videoId: 'iiMjfVOj8po',
    name: 'Basketball Game Analysis',
    description: 'Movement and possession data from a basketball game',
  },
  'example-2': {
    files: ['adhir.csv', 'blake.csv', 'jeans.csv', 'lily.csv', 'mae.csv', 'conversation.csv'],
    videoId: 'pWJ3xNk1Zpg',
    name: 'Group Interaction',
    description: 'Multi-person movement and conversation data',
  },
  'example-3': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'Iu0rxb-xkMk',
    name: 'Classroom Lesson 1',
    description: 'Teacher movement with lesson graph and conversation',
  },
  'example-4': {
    files: [
      'cassandra.csv',
      'mei.csv',
      'nathan.csv',
      'sean.csv',
      'teacher.csv',
      'conversation.csv',
    ],
    videoId: 'OJSZCK4GPQY',
    name: 'Classroom Group Work',
    description: 'Multiple students and teacher movement with conversation',
  },
  'example-5': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'xrisdnH5GmQ',
    name: 'Classroom Lesson 2',
    description: 'Teacher movement with lesson graph and conversation',
  },
  'example-6': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'nLDXU2c0vLw',
    name: 'Classroom Lesson 3',
    description: 'Teacher movement with lesson graph and conversation',
  },
  'example-7': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: '5Eg1fJ-ZpQs',
    name: 'Classroom Lesson 4',
    description: 'Teacher movement with lesson graph and conversation',
  },
  'example-8': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'gPb_ST74bpg',
    name: 'Classroom Lesson 5',
    description: 'Teacher movement with lesson graph and conversation',
  },
  'example-9': {
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'P5Lxj2nfGzc',
    name: 'Classroom Lesson 6',
    description: 'Teacher movement with lesson graph and conversation',
  },
  'example-10': {
    files: ['teacher.csv', 'conversation.csv'],
    name: 'Teacher with Conversation',
    description: 'Teacher movement and conversation data',
  },
  'example-11': {
    files: ['adhir.csv', 'blake.csv', 'jeans.csv', 'lily.csv', 'mae.csv'],
    name: 'Group Interaction',
    description: 'Multi-person movement and conversation data',
  },
  'example-12': {
    files: ['Making Tour.csv', 'conversation.csv'],
    name: 'Making Historical Tour',
    description: 'GPS movement and conversation data from creating a Nashville civil rights walking tour',
  },
  'example-13': {
    files: ['Taking Tour.csv', 'conversation.csv'],
    name: 'Taking Historical Tour',
    description: 'GPS movement and conversation data from following a Nashville civil rights walking tour',
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

/**
 * Get all available example IDs
 * @returns Array of example IDs
 */
export function getExampleIds(): string[] {
  return Object.keys(EXAMPLE_DATASETS)
}
