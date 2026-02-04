/**
 * Timeline Renderer (IGS)
 *
 * Extends the library renderer with IGS-specific layers (ActivityGradient).
 */

import {
	TimelineRenderer as BaseTimelineRenderer,
	BackgroundLayer,
	PlayheadLayer,
	HoverLayer,
	ZoomSelectionLayer,
	type TimelineState
} from 'svelte-interactive-timeline';
import { ActivityGradientLayer } from './layers/activity-gradient';

export class TimelineRenderer extends BaseTimelineRenderer {
	constructor(canvas: HTMLCanvasElement, initialState: TimelineState) {
		// Create custom layer stack with ActivityGradientLayer
		const layers = [
			new BackgroundLayer(),
			new ActivityGradientLayer(),
			new PlayheadLayer(),
			new ZoomSelectionLayer(),
			new HoverLayer()
		];

		super(canvas, initialState, { layers });
	}
}
