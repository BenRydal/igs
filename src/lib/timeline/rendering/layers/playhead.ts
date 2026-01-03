/**
 * Playhead Layer
 *
 * Renders the current time playhead indicator.
 */

import type { RenderContext, RenderLayer } from '../../types';
import { resetShadow } from '../../utils';
import { PLAYHEAD_HEAD_HEIGHT } from '../../constants';
import * as Colors from '../../colors';

/** Layout constants */
const HEAD_WIDTH = 12;
const LINE_WIDTH = 2;
const GLOW_WIDTH = 6;

export class PlayheadLayer implements RenderLayer {
	name = 'playhead';
	visible = true;

	render(ctx: RenderContext): void {
		const { ctx: c, height, state, timeToX } = ctx;

		const x = timeToX(state.currentTime);
		const isActive = state.isDragging === 'playhead';

		// Don't render if outside visible area
		if (x < -HEAD_WIDTH || x > ctx.width + HEAD_WIDTH) return;

		// Glow effect
		c.strokeStyle = Colors.ACCENT_GLOW;
		c.lineWidth = GLOW_WIDTH;
		c.lineCap = 'round';
		c.beginPath();
		c.moveTo(x, PLAYHEAD_HEAD_HEIGHT);
		c.lineTo(x, height);
		c.stroke();

		// Main line
		c.strokeStyle = Colors.ACCENT;
		c.lineWidth = LINE_WIDTH;
		c.beginPath();
		c.moveTo(x, PLAYHEAD_HEAD_HEIGHT);
		c.lineTo(x, height);
		c.stroke();

		// Playhead head (triangle pointing down) at top
		this.drawPlayheadHead(c, x, 0, isActive);
	}

	private drawPlayheadHead(
		c: CanvasRenderingContext2D,
		x: number,
		y: number,
		isActive: boolean
	): void {
		const halfWidth = HEAD_WIDTH / 2;

		// Shadow
		c.shadowColor = Colors.SHADOW_DARK;
		c.shadowBlur = 4;
		c.shadowOffsetY = 2;

		// Head shape (rounded top, pointed bottom)
		c.fillStyle = isActive ? Colors.ACCENT_LIGHT : Colors.ACCENT;
		c.beginPath();
		c.moveTo(x - halfWidth, y);
		c.lineTo(x + halfWidth, y);
		c.lineTo(x + halfWidth, y + PLAYHEAD_HEAD_HEIGHT - 6);
		c.lineTo(x, y + PLAYHEAD_HEAD_HEIGHT);
		c.lineTo(x - halfWidth, y + PLAYHEAD_HEAD_HEIGHT - 6);
		c.closePath();
		c.fill();

		// Reset shadow
		resetShadow(c);

		// Border
		c.strokeStyle = Colors.WHITE;
		c.lineWidth = 1.5;
		c.stroke();

		// Inner circle indicator
		c.fillStyle = Colors.WHITE;
		c.beginPath();
		c.arc(x, y + 5, 2, 0, Math.PI * 2);
		c.fill();
	}
}
