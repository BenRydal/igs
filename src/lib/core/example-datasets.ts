/**
 * Example datasets configuration for IGS
 *
 * This is the single source of truth for example datasets: the files that make
 * up each one, the name it is shown under, the collection it belongs to, and
 * the capabilities worth advertising in a picker. The sidebar, the command
 * palette, and the welcome modal all read from here — do not re-declare a
 * dataset's name or grouping anywhere else, or the three will drift apart.
 *
 * Note: `static/data/example-15` and `example-16` (music performance) hold CSVs
 * with no entry here, so nothing loads them. They are kept on disk deliberately
 * — add entries back to this map to bring them into the picker.
 */

/** A collection groups datasets by where they came from. Membership is
 *  exclusive: every dataset belongs to exactly one, so the picker can present
 *  them as a tree without filing anything twice. */
export type CollectionId = 'timss' | 'tau' | 'tours' | 'museums' | 'other'

export interface Collection {
  id: CollectionId
  label: string
}

/** Display order in the picker. */
export const COLLECTIONS: readonly Collection[] = [
  { id: 'timss', label: 'TIMSS Math/Science Lessons' },
  { id: 'tau', label: 'TAU Math Lessons' },
  { id: 'tours', label: 'Walking Tours' },
  { id: 'museums', label: 'Museum Visits' },
  { id: 'other', label: 'Other Examples' },
] as const

export interface ExampleDataset {
  /** Canonical display name. The only place a dataset is named. */
  label: string
  collection: CollectionId
  files: string[]
  videoId?: string
  duration: string
  isGPS?: boolean
  /** Ships a conversation file (time/speaker/talk), so the transcript panel has content. */
  hasTranscript?: boolean
  /** Ships a code file (start/end, optionally code), so coded intervals are available. */
  hasCodes?: boolean
  /** Pinned above the collections as the suggested starting point. Exactly one
   *  dataset should set this; a featured dataset is not also listed under its
   *  collection, so it still appears exactly once. */
  featured?: boolean
}

export const EXAMPLE_DATASETS: Record<string, ExampleDataset> = {
  'example-1': {
    label: "Michael Jordan's Last Shot",
    collection: 'other',
    files: ['jordan.csv', 'possession.csv', 'conversation.csv'],
    videoId: 'iiMjfVOj8po',
    duration: '37 sec',
    hasTranscript: true,
    hasCodes: true,
    featured: true,
  },
  'example-2': {
    label: 'Single Gallery',
    collection: 'museums',
    files: ['adhir.csv', 'blake.csv', 'jeans.csv', 'lily.csv', 'mae.csv', 'conversation.csv'],
    videoId: 'pWJ3xNk1Zpg',
    duration: '8 min',
    hasTranscript: true,
  },
  'example-3': {
    label: 'U.S. Science: Weather',
    collection: 'timss',
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'Iu0rxb-xkMk',
    duration: '56 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-4': {
    label: '3rd Grade Numbers Discussion',
    collection: 'other',
    files: [
      'cassandra.csv',
      'mei.csv',
      'nathan.csv',
      'sean.csv',
      'teacher.csv',
      'conversation.csv',
    ],
    videoId: 'OJSZCK4GPQY',
    duration: '7 min',
    hasTranscript: true,
  },
  'example-5': {
    label: 'Czech Republic Science: Density',
    collection: 'timss',
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'xrisdnH5GmQ',
    duration: '49 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-6': {
    label: 'Japan Math: Angles',
    collection: 'timss',
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'nLDXU2c0vLw',
    duration: '52 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-7': {
    label: 'U.S. Math: Linear Equations',
    collection: 'timss',
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: '5Eg1fJ-ZpQs',
    duration: '44 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-8': {
    label: 'U.S. Science: Rocks',
    collection: 'timss',
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'gPb_ST74bpg',
    duration: '41 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-9': {
    label: 'Netherlands Math: Pythagorean Theorem',
    collection: 'timss',
    files: ['teacher.csv', 'lesson-graph.csv', 'conversation.csv'],
    videoId: 'P5Lxj2nfGzc',
    duration: '50 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-10': {
    label: 'Clark',
    collection: 'tau',
    files: ['teacher.csv', 'conversation.csv'],
    duration: '1h 35m',
    hasTranscript: true,
  },
  'example-11': {
    label: 'Complete Visit',
    collection: 'museums',
    files: ['adhir.csv', 'blake.csv', 'jeans.csv', 'lily.csv', 'mae.csv'],
    duration: '47 min',
  },
  'example-12': {
    label: 'Creating a Civil Rights Tour',
    collection: 'tours',
    files: ['Making Tour.csv', 'conversation.csv'],
    duration: '43 min',
    isGPS: true,
    hasTranscript: true,
  },
  'example-13': {
    label: 'Walking a Civil Rights Tour',
    collection: 'tours',
    files: ['Taking Tour.csv', 'conversation.csv'],
    duration: '50 min',
    isGPS: true,
    hasTranscript: true,
  },
  'example-14': {
    label: 'Jefferson Street Tour',
    collection: 'tours',
    files: ['tour.csv', 'code.csv'],
    videoId: 'la2fkEnpUZs',
    duration: '3h 22m',
    isGPS: true,
    hasCodes: true,
  },
  'example-17': {
    label: 'Sandy 1',
    collection: 'tau',
    files: ['teacher.csv', 'blue.csv', 'green.csv', 'pink.csv', 'whiteboard.csv'],
    duration: '1h 27m',
    hasCodes: true,
  },
  'example-18': {
    label: 'Sandy 2',
    collection: 'tau',
    files: ['teacher.csv', 'codes.csv'],
    duration: '1h 14m',
    hasCodes: true,
  },
  'example-19': {
    label: 'Sofia',
    collection: 'tau',
    files: ['teacher.csv', 'lesson.csv', 'conversation.csv'],
    duration: '50 min',
    hasTranscript: true,
    hasCodes: true,
  },
  'example-20': {
    label: 'Vince',
    collection: 'tau',
    files: ['teacher.csv', 'codes.csv'],
    duration: '1h 21m',
    hasCodes: true,
  },
} as const

export interface ExampleEntry extends ExampleDataset {
  id: string
}

/** Every dataset, in declaration order, with its id attached. */
export const VISIBLE_EXAMPLES: readonly ExampleEntry[] = Object.entries(EXAMPLE_DATASETS).map(
  ([id, dataset]) => ({ id, ...dataset })
)

/** The suggested starting point, pinned above the collections. */
export const FEATURED_EXAMPLE: ExampleEntry | undefined = VISIBLE_EXAMPLES.find((e) => e.featured)

/** Collections with their datasets, skipping the featured one (shown pinned
 *  instead) and any collection left empty as a result. */
export const EXAMPLE_COLLECTIONS: readonly (Collection & { items: readonly ExampleEntry[] })[] =
  COLLECTIONS.map((collection) => ({
    ...collection,
    items: VISIBLE_EXAMPLES.filter((e) => e.collection === collection.id && !e.featured),
  })).filter((collection) => collection.items.length > 0)

/**
 * Get example dataset configuration by ID
 * @param id - The example dataset ID
 * @returns The example dataset or undefined if not found
 */
export function getExampleDataset(id: string): ExampleDataset | undefined {
  return EXAMPLE_DATASETS[id]
}

/**
 * Get an example dataset's display name by ID
 * @param id - The example dataset ID
 * @returns The canonical label, or an empty string if the id is unknown
 */
export function getExampleLabel(id: string): string {
  return EXAMPLE_DATASETS[id]?.label ?? ''
}
