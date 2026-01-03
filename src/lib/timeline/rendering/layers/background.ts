/**
 * Background Layer
 *
 * Renders grid lines and time labels on the timeline.
 */

import type { RenderContext, RenderLayer } from '../../types';
import { generateGridLines } from '../../utils';
import { LABEL_TOP_OFFSET, MONO_FONT } from '../../constants';
import * as Colors from '../../colors';

export class BackgroundLayer implements RenderLayer {
	name = 'background';
	visible = true;

	render(ctx: RenderContext): void {
		const { ctx: c, width, height, state, timeToX } = ctx;

		// Fill background
		c.fillStyle = Colors.WHITE;
		c.fillRect(0, 0, width, height);

		// Generate grid lines based on visible range
		const gridLines = generateGridLines(state.viewStart, state.viewEnd, Math.floor(width / 80));

		// Draw grid lines (full height)
		for (const line of gridLines) {
			const x = timeToX(line.time);

			// Skip if outside visible area
			if (x < 0 || x > width) continue;

			// Vertical grid line - full height
			c.strokeStyle = line.isMajor ? Colors.GRID_MAJOR : Colors.GRID_MINOR;
			c.lineWidth = line.isMajor ? 1 : 0.5;
			c.beginPath();
			c.moveTo(x, 0);
			c.lineTo(x, height);
			c.stroke();
		}

		// Draw time labels on top of timeline (after grid lines so labels are on top)
		c.font = `9px ${MONO_FONT}`;
		c.textAlign = 'center';
		c.textBaseline = 'middle';

		for (const line of gridLines) {
			if (!line.isMajor) continue;

			const x = timeToX(line.time);
			if (x < 0 || x > width) continue;

			// Measure text for background
			const textWidth = c.measureText(line.label).width;
			const padding = 3;

			// Draw subtle background behind label
			c.fillStyle = Colors.LABEL_BG;
			c.fillRect(x - textWidth / 2 - padding, LABEL_TOP_OFFSET - 6, textWidth + padding * 2, 12);

			// Draw label
			c.fillStyle = Colors.LABEL_TEXT;
			c.fillText(line.label, x, LABEL_TOP_OFFSET);
		}
	}
}
