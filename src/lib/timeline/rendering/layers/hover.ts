/**
 * Hover Layer
 *
 * Renders hover indicator and tooltip guide line.
 */

import type { RenderContext, RenderLayer } from '../../types';
import { formatTime, resetShadow } from '../../utils';
import { TOOLTIP_TOP_OFFSET, MONO_FONT } from '../../constants';
import * as Colors from '../../colors';

/** Layout constants */
const TOOLTIP_HEIGHT = 22;
const TOOLTIP_PADDING = 10;

export class HoverLayer implements RenderLayer {
	name = 'hover';
	visible = true;

	render(ctx: RenderContext): void {
		const { ctx: c, width, height, state, timeToX } = ctx;

		if (state.hoveredTime === null) return;
		if (state.isDragging) return; // Hide during drag

		const x = timeToX(state.hoveredTime);

		// Skip if outside visible area
		if (x < 0 || x > width) return;

		// Dashed vertical line (full height)
		c.strokeStyle = Colors.HOVER_LINE;
		c.lineWidth = 1;
		c.setLineDash([4, 4]);
		c.beginPath();
		c.moveTo(x, 0);
		c.lineTo(x, height);
		c.stroke();
		c.setLineDash([]);

		// Time tooltip
		this.drawTooltip(c, x, state.hoveredTime, width);
	}

	private drawTooltip(c: CanvasRenderingContext2D, x: number, time: number, canvasWidth: number) {
		const text = formatTime(time);

		// Measure text
		c.font = `11px ${MONO_FONT}`;
		const metrics = c.measureText(text);
		const tooltipWidth = metrics.width + TOOLTIP_PADDING * 2;

		// Position tooltip (keep within bounds)
		let tooltipX = x - tooltipWidth / 2;
		if (tooltipX < 4) tooltipX = 4;
		if (tooltipX + tooltipWidth > canvasWidth - 4) {
			tooltipX = canvasWidth - tooltipWidth - 4;
		}

		const tooltipY = TOOLTIP_TOP_OFFSET;

		// Shadow
		c.shadowColor = Colors.SHADOW;
		c.shadowBlur = 6;
		c.shadowOffsetY = 2;

		// Background
		c.fillStyle = Colors.GRAY_800;
		c.beginPath();
		c.roundRect(tooltipX, tooltipY, tooltipWidth, TOOLTIP_HEIGHT, 4);
		c.fill();

		// Reset shadow
		resetShadow(c);

		// Text
		c.fillStyle = Colors.WHITE;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillText(text, tooltipX + tooltipWidth / 2, tooltipY + TOOLTIP_HEIGHT / 2);
	}
}
