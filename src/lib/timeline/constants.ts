/**
 * Timeline Layout Constants
 *
 * Single source of truth for timeline dimensions and layout.
 * Import these in rendering layers and components to keep values in sync.
 */

/** Monospace font stack for time labels and tooltips */
export const MONO_FONT = 'ui-monospace, SFMono-Regular, monospace';

/** Height of the playhead triangle head */
export const PLAYHEAD_HEAD_HEIGHT = 14;

/** Vertical position for time labels */
export const LABEL_TOP_OFFSET = 10;

/** Vertical position for hover tooltip (below labels) */
export const TOOLTIP_TOP_OFFSET = 22;

/** Hit testing tolerance for playhead */
export const PLAYHEAD_HIT_TOLERANCE = 10;
