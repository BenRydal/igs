/** Mondrian Transcription's floorplan-only examples, for drawing without a video. */
export const DRAWING_FLOORPLANS = [
  { value: 'classroom', label: 'Classroom', path: '/mondrian/classroom.png' },
  { value: 'museum', label: 'Museum', path: '/mondrian/museum.png' },
  { value: 'basketball', label: 'Basketball court', path: '/mondrian/basketball.png' },
] as const

export type DrawingFloorplan = (typeof DRAWING_FLOORPLANS)[number]
