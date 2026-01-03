/**
 * Timeline Layout Constants
 *
 * Single source of truth for timeline dimensions and layout.
 * Import these in rendering layers and components to keep values in sync.
 */

/** Monospace font stack for time labels and tooltips */
export const MONO_FONT = 'ui-monospace, SFMono-Regular, monospace';

/** Height of draggable handles at the top (selection markers, playhead) */
export const HANDLE_HEIGHT = 20;

/** Height of the playhead triangle head */
export const PLAYHEAD_HEAD_HEIGHT = 14;

/** Width of selection marker handles */
export const MARKER_WIDTH = 8;

/** Vertical position for time labels */
export const LABEL_TOP_OFFSET = 10;

/** Vertical position for hover tooltip (below labels) */
export const TOOLTIP_TOP_OFFSET = 22;

/** Hit testing tolerances */
export const PLAYHEAD_HIT_TOLERANCE = 10;
export const MARKER_HIT_TOLERANCE = 10;

/** Track layout */
export const TRACK_PADDING = 4;
export const MIN_SEGMENT_WIDTH = 2;
