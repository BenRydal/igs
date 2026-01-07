/**
 * Timeline Renderer
 *
 * Orchestrates rendering of all timeline layers onto a canvas.
 */

import type { TimelineState, RenderLayer, RenderContext } from '../types';
import { mapRange, getDevicePixelRatio } from '../utils';
import { BackgroundLayer } from './layers/background';
import { PlayheadLayer } from './layers/playhead';
import { HoverLayer } from './layers/hover';
import { ZoomSelectionLayer } from './layers/zoom-selection';

export class TimelineRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private layers: RenderLayer[];
	private animationFrame: number | null = null;
	private _state: TimelineState;
	private _width: number = 0;
	private _height: number = 0;
	private dpr: number;

	constructor(canvas: HTMLCanvasElement, initialState: TimelineState) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d')!;
		this._state = initialState;
		this.dpr = getDevicePixelRatio();

		// Layer stack (render order: bottom to top)
		this.layers = [
			new BackgroundLayer(),
			new PlayheadLayer(),
			new ZoomSelectionLayer(),
			new HoverLayer()
		];
	}

	/**
	 * Update canvas dimensions (call on resize)
	 */
	resize(width: number, height: number): void {
		this._width = width;
		this._height = height;
		this.dpr = getDevicePixelRatio();

		// Set actual size in memory (scaled for DPI)
		this.canvas.width = width * this.dpr;
		this.canvas.height = height * this.dpr;

		// Set display size
		this.canvas.style.width = `${width}px`;
		this.canvas.style.height = `${height}px`;

		// Request re-render
		this.requestRender();
	}

	/**
	 * Update state and request re-render
	 */
	setState(state: TimelineState): void {
		this._state = state;
		this.requestRender();
	}

	/**
	 * Request a render on next animation frame (debounced)
	 */
	requestRender(): void {
		if (this.animationFrame !== null) return;
		this.animationFrame = requestAnimationFrame(() => this.render());
	}

	/**
	 * Main render loop
	 */
	private render(): void {
		this.animationFrame = null;

		const { ctx, _width: width, _height: height, _state: state, dpr } = this;

		if (width === 0 || height === 0) return;

		// Save state and scale for DPI
		ctx.save();
		ctx.scale(dpr, dpr);

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Create render context with coordinate helpers
		const renderCtx: RenderContext = {
			ctx,
			state,
			width,
			height,
			dpr,
			timeToX: (time: number) => this.timeToPixel(time),
			xToTime: (x: number) => this.pixelToTime(x)
		};

		// Render each visible layer
		for (const layer of this.layers) {
			if (layer.visible) {
				ctx.save();
				layer.render(renderCtx);
				ctx.restore();
			}
		}

		ctx.restore();
	}

	/**
	 * Convert time to pixel X position (respects zoom/pan)
	 */
	timeToPixel(time: number): number {
		const { viewStart, viewEnd } = this._state;
		return mapRange(time, viewStart, viewEnd, 0, this._width);
	}

	/**
	 * Convert pixel X to time (respects zoom/pan)
	 */
	pixelToTime(x: number): number {
		const { viewStart, viewEnd } = this._state;
		return mapRange(x, 0, this._width, viewStart, viewEnd);
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	/**
	 * Get current dimensions
	 */
	get width(): number {
		return this._width;
	}

	get height(): number {
		return this._height;
	}
}
