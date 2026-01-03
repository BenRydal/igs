/**
 * Selection Layer
 *
 * Renders the selection range (left/right markers) on the timeline.
 */

import type { RenderContext, RenderLayer } from '../../types';
import { resetShadow } from '../../utils';
import { HANDLE_HEIGHT, MARKER_WIDTH } from '../../constants';
import * as Colors from '../../colors';

export class SelectionLayer implements RenderLayer {
	name = 'selection';
	visible = true;

	render(ctx: RenderContext): void {
		const { ctx: c, width, height, state, timeToX } = ctx;

		const startX = timeToX(state.selectionStart);
		const endX = timeToX(state.selectionEnd);

		// Dim areas outside selection (full height)
		c.fillStyle = Colors.DIMMED;

		// Left dimmed area
		if (startX > 0) {
			c.fillRect(0, 0, startX, height);
		}

		// Right dimmed area
		if (endX < width) {
			c.fillRect(endX, 0, width - endX, height);
		}

		// Selection fill
		const selectionWidth = endX - startX;
		if (selectionWidth > 0) {
			c.fillStyle = Colors.PRIMARY_FILL;
			c.fillRect(startX, 0, selectionWidth, height);
		}

		// Selection border lines
		c.strokeStyle = Colors.PRIMARY_BORDER;
		c.lineWidth = 1;

		// Left marker line
		c.beginPath();
		c.moveTo(startX, 0);
		c.lineTo(startX, height);
		c.stroke();

		// Right marker line
		c.beginPath();
		c.moveTo(endX, 0);
		c.lineTo(endX, height);
		c.stroke();

		// Draw marker handles at top
		this.drawMarkerHandle(c, startX, 0, state.isDragging === 'selection-start');
		this.drawMarkerHandle(c, endX, 0, state.isDragging === 'selection-end');
	}

	private drawMarkerHandle(
		c: CanvasRenderingContext2D,
		x: number,
		y: number,
		isActive: boolean
	): void {
		const handleX = x - MARKER_WIDTH / 2;

		// Shadow
		c.shadowColor = Colors.SHADOW;
		c.shadowBlur = 3;
		c.shadowOffsetY = 1;

		// Handle background
		c.fillStyle = isActive ? Colors.PRIMARY_LIGHT : Colors.PRIMARY;

		// Rounded rectangle for handle
		const radius = 3;
		c.beginPath();
		c.roundRect(handleX, y, MARKER_WIDTH, HANDLE_HEIGHT, [radius, radius, 0, 0]);
		c.fill();

		// Reset shadow
		resetShadow(c);

		// Grip lines
		c.strokeStyle = Colors.MARKER_GRIP;
		c.lineWidth = 1;
		const lineY1 = y + 6;
		const lineY2 = y + 10;
		const lineY3 = y + 14;
		const lineX1 = x - 2;
		const lineX2 = x + 2;

		c.beginPath();
		c.moveTo(lineX1, lineY1);
		c.lineTo(lineX2, lineY1);
		c.moveTo(lineX1, lineY2);
		c.lineTo(lineX2, lineY2);
		c.moveTo(lineX1, lineY3);
		c.lineTo(lineX2, lineY3);
		c.stroke();
	}
}
