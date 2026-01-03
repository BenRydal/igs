/**
 * Zoom Selection Layer
 *
 * Renders a selection rectangle during drag-to-zoom operation.
 */

import type { RenderLayer, RenderContext } from '../../types';

export class ZoomSelectionLayer implements RenderLayer {
	name = 'zoom-selection';
	visible = true;

	render(ctx: RenderContext): void {
		const { state, timeToX, height } = ctx;

		if (state.zoomSelectionStart === null || state.zoomSelectionEnd === null) {
			return;
		}

		const x1 = timeToX(state.zoomSelectionStart);
		const x2 = timeToX(state.zoomSelectionEnd);
		const left = Math.min(x1, x2);
		const width = Math.abs(x2 - x1);

		// Draw selection rectangle
		ctx.ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'; // Blue with low opacity
		ctx.ctx.fillRect(left, 0, width, height);

		// Draw selection borders
		ctx.ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
		ctx.ctx.lineWidth = 2;
		ctx.ctx.setLineDash([4, 4]);
		ctx.ctx.strokeRect(left, 0, width, height);
		ctx.ctx.setLineDash([]);
	}
}
