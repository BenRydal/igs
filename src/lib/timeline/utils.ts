/**
 * Timeline Utilities
 *
 * Helper functions for time/pixel conversions, formatting, and math.
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation / mapping from one range to another
 */
export function mapRange(
	value: number,
	inStart: number,
	inEnd: number,
	outStart: number,
	outEnd: number
): number {
	if (inEnd === inStart) return outStart;
	return ((value - inStart) / (inEnd - inStart)) * (outEnd - outStart) + outStart;
}

/**
 * Format time in seconds to display string
 */
export function formatTime(seconds: number, format: 'hms' | 'ms' | 'seconds' = 'hms'): string {
	if (!isFinite(seconds) || seconds < 0) return '0:00';

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	switch (format) {
		case 'hms':
			if (h > 0) {
				return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
			}
			return `${m}:${s.toString().padStart(2, '0')}`;
		case 'ms':
			return `${m}:${s.toString().padStart(2, '0')}`;
		case 'seconds':
			return `${seconds.toFixed(1)}s`;
	}
}

/**
 * Calculate nice grid interval for time axis
 * Returns interval in seconds that produces readable labels
 */
export function calculateGridInterval(visibleDuration: number, maxLabels: number = 10): number {
	const targetInterval = visibleDuration / maxLabels;

	// Nice intervals in seconds
	const niceIntervals = [
		0.1,
		0.25,
		0.5,
		1,
		2,
		5,
		10,
		15,
		30,
		60, // 1 min
		120,
		300,
		600,
		900,
		1800,
		3600, // 1 hour
		7200,
		14400,
		28800,
		43200,
		86400 // 1 day
	];

	// Find the smallest nice interval >= target
	for (const interval of niceIntervals) {
		if (interval >= targetInterval) {
			return interval;
		}
	}

	return niceIntervals[niceIntervals.length - 1];
}

/**
 * Generate grid lines for visible time range
 */
export function generateGridLines(
	viewStart: number,
	viewEnd: number,
	maxLabels: number = 10
): { time: number; label: string; isMajor: boolean }[] {
	const duration = viewEnd - viewStart;
	const interval = calculateGridInterval(duration, maxLabels);
	const lines: { time: number; label: string; isMajor: boolean }[] = [];

	// Start from first interval after viewStart
	const firstLine = Math.ceil(viewStart / interval) * interval;

	for (let time = firstLine; time <= viewEnd; time += interval) {
		// Determine if this is a major line (e.g., minute marks when showing seconds)
		const isMajor = time % (interval * 5) === 0 || interval >= 60;

		lines.push({
			time,
			label: formatTime(time),
			isMajor
		});
	}

	return lines;
}

/**
 * Calculate zoom parameters centered on a specific time
 */
export function zoomAtPoint(
	currentViewStart: number,
	currentViewEnd: number,
	zoomFactor: number,
	centerTime: number,
	dataStart: number,
	dataEnd: number,
	minDuration: number
): { viewStart: number; viewEnd: number } {
	const currentDuration = currentViewEnd - currentViewStart;
	const dataDuration = dataEnd - dataStart;

	// Calculate new duration
	let newDuration = currentDuration * zoomFactor;
	newDuration = clamp(newDuration, minDuration, dataDuration);

	// Keep centerTime at the same relative position
	const centerRatio = (centerTime - currentViewStart) / currentDuration;
	let newStart = centerTime - newDuration * centerRatio;
	let newEnd = centerTime + newDuration * (1 - centerRatio);

	// Clamp to data bounds
	if (newStart < dataStart) {
		newStart = dataStart;
		newEnd = dataStart + newDuration;
	}
	if (newEnd > dataEnd) {
		newEnd = dataEnd;
		newStart = dataEnd - newDuration;
	}

	return {
		viewStart: Math.max(dataStart, newStart),
		viewEnd: Math.min(dataEnd, newEnd)
	};
}

/**
 * Calculate pan offset
 */
export function panView(
	currentViewStart: number,
	currentViewEnd: number,
	deltaTime: number,
	dataStart: number,
	dataEnd: number
): { viewStart: number; viewEnd: number } {
	const duration = currentViewEnd - currentViewStart;
	let newStart = currentViewStart + deltaTime;
	let newEnd = currentViewEnd + deltaTime;

	// Clamp to data bounds
	if (newStart < dataStart) {
		newStart = dataStart;
		newEnd = dataStart + duration;
	}
	if (newEnd > dataEnd) {
		newEnd = dataEnd;
		newStart = dataEnd - duration;
	}

	return { viewStart: newStart, viewEnd: newEnd };
}

/**
 * Get device pixel ratio for crisp canvas rendering
 */
export function getDevicePixelRatio(): number {
	return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

/**
 * Reset canvas shadow properties
 */
export function resetShadow(ctx: CanvasRenderingContext2D): void {
	ctx.shadowColor = 'transparent';
	ctx.shadowBlur = 0;
	ctx.shadowOffsetY = 0;
}
