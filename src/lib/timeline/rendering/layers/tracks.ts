/**
 * Tracks Layer
 *
 * Renders data tracks (conversation, codes) on the timeline.
 * Each track shows segments of activity over time.
 */

import type { RenderContext, RenderLayer, TimelineTrack, TrackSegment } from '../../types';
import { TRACK_PADDING, MIN_SEGMENT_WIDTH } from '../../constants';

export class TracksLayer implements RenderLayer {
	name = 'tracks';
	visible = true;

	render(ctx: RenderContext): void {
		const { ctx: c, width, height, state, timeToX } = ctx;

		if (state.tracks.length === 0) return;

		// Calculate track layout - full height now
		const visibleTracks = state.tracks.filter((t) => t.visible);
		if (visibleTracks.length === 0) return;

		const trackHeight = Math.min(32, (height - TRACK_PADDING * 2) / visibleTracks.length);

		let yOffset = TRACK_PADDING;

		for (const track of visibleTracks) {
			this.renderTrack(ctx, track, yOffset, trackHeight - 2);
			yOffset += trackHeight;
		}
	}

	private renderTrack(
		ctx: RenderContext,
		track: TimelineTrack,
		y: number,
		height: number
	): void {
		const { ctx: c, state, timeToX, width } = ctx;

		// Track label (left side, if there's room)
		if (height >= 14) {
			c.font = '10px ui-sans-serif, system-ui, sans-serif';
			c.fillStyle = 'rgba(0, 0, 0, 0.5)';
			c.textAlign = 'left';
			c.textBaseline = 'middle';
			c.fillText(track.label, 6, y + height / 2);
		}

		// Render segments
		for (const segment of track.data) {
			// Skip if outside view window
			if (segment.end < state.viewStart || segment.start > state.viewEnd) {
				continue;
			}

			const x1 = Math.max(0, timeToX(segment.start));
			const x2 = Math.min(width, timeToX(segment.end));
			const segmentWidth = Math.max(MIN_SEGMENT_WIDTH, x2 - x1);

			this.renderSegment(c, track, segment, x1, y, segmentWidth, height);
		}
	}

	private renderSegment(
		c: CanvasRenderingContext2D,
		track: TimelineTrack,
		segment: TrackSegment,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		const color = segment.color || track.color;

		switch (track.type) {
			case 'conversation':
				this.renderConversationSegment(c, color, segment.value, x, y, width, height);
				break;

			case 'code':
				this.renderCodeSegment(c, color, x, y, width, height);
				break;

			case 'movement':
				this.renderMovementSegment(c, color, segment.value, x, y, width, height);
				break;

			default:
				// Generic segment
				c.fillStyle = color;
				c.globalAlpha = 0.6;
				c.fillRect(x, y + 2, width, height - 4);
				c.globalAlpha = 1;
		}
	}

	private renderConversationSegment(
		c: CanvasRenderingContext2D,
		color: string,
		value: number,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		// Bar height based on value (conversation density)
		const barHeight = Math.max(4, height * value);
		const barY = y + height - barHeight;

		// Gradient fill
		const gradient = c.createLinearGradient(x, barY, x, barY + barHeight);
		gradient.addColorStop(0, color);
		gradient.addColorStop(1, this.adjustColorAlpha(color, 0.6));

		c.fillStyle = gradient;
		c.beginPath();
		c.roundRect(x, barY, width, barHeight, 2);
		c.fill();
	}

	private renderCodeSegment(
		c: CanvasRenderingContext2D,
		color: string,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		// Filled region with border
		c.fillStyle = this.adjustColorAlpha(color, 0.3);
		c.beginPath();
		c.roundRect(x, y + 2, width, height - 4, 3);
		c.fill();

		c.strokeStyle = color;
		c.lineWidth = 1.5;
		c.stroke();
	}

	private renderMovementSegment(
		c: CanvasRenderingContext2D,
		color: string,
		value: number,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		// Heatmap-style intensity
		const alpha = 0.3 + value * 0.5;
		c.fillStyle = this.adjustColorAlpha(color, alpha);
		c.fillRect(x, y + 1, width, height - 2);
	}

	private adjustColorAlpha(color: string, alpha: number): string {
		// Handle hex colors
		if (color.startsWith('#')) {
			const hex = color.slice(1);
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}
		// Handle rgb/rgba
		if (color.startsWith('rgb')) {
			const match = color.match(/[\d.]+/g);
			if (match && match.length >= 3) {
				return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
			}
		}
		return color;
	}
}
