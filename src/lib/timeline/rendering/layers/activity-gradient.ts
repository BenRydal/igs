/**
 * Activity Gradient Layer
 *
 * Renders a colored gradient bar showing movement activity intensity over time.
 * Darker = more movement activity, lighter = less activity or stationary.
 *
 * Calculation:
 * 1. Divide timeline into NUM_BUCKETS time buckets
 * 2. For each movement segment, calculate speed (distance / time)
 * 3. Add that speed to all buckets the segment spans
 * 4. Average speeds per bucket, normalize using 95th percentile
 * 5. Map normalized activity (0-1) to opacity (0.08-0.4)
 */

import { get } from 'svelte/store';
import type { RenderContext, RenderLayer } from '../../types';
import UserStore from '../../../../stores/userStore';
import ConfigStore from '../../../../stores/configStore';
import type { User } from '../../../../models/user';

/** Number of buckets to divide timeline into */
const NUM_BUCKETS = 200;

/** Height of the gradient bar in pixels */
const BAR_HEIGHT = 14;

/** Vertical position from bottom of canvas */
const BAR_BOTTOM_MARGIN = 2;

/** Opacity range for activity visualization */
const MIN_OPACITY = 0.08;
const MAX_OPACITY = 0.4;

/** Color for buckets with no data */
const NO_DATA_COLOR = 'rgba(0, 0, 0, 0.03)';

interface ActivityBucket {
	startTime: number;
	endTime: number;
	totalSpeed: number; // Sum of speeds for proper averaging
	count: number; // Number of samples for proper averaging
	activity: number; // 0-1 normalized activity level (computed after collection)
}

export class ActivityGradientLayer implements RenderLayer {
	name = 'activity-gradient';
	visible = true;

	// Cache to avoid recomputing on every render
	private cachedBuckets: ActivityBucket[] = [];
	private cacheKey: string = '';

	render(ctx: RenderContext): void {
		// Check if gradient is enabled
		const config = get(ConfigStore);
		if (!config.showActivityGradient) return;

		const { ctx: c, width, height, state, timeToX } = ctx;

		// Get users from store
		const users = get(UserStore);
		if (!users || users.length === 0) return;

		// Create cache key from data bounds and enabled user count
		const enabledUsers = users.filter((u) => u.enabled && u.dataTrail?.length > 1);
		const newCacheKey = `${state.dataStart}-${state.dataEnd}-${enabledUsers.length}-${enabledUsers.map((u) => u.dataTrail.length).join(',')}`;

		// Recompute if cache is invalid
		if (this.cacheKey !== newCacheKey) {
			this.cachedBuckets = this.computeActivityBuckets(users, state.dataStart, state.dataEnd);
			this.cacheKey = newCacheKey;
		}

		// Render the gradient bar at the bottom
		const barY = height - BAR_HEIGHT - BAR_BOTTOM_MARGIN;

		for (const bucket of this.cachedBuckets) {
			const x1 = timeToX(bucket.startTime);
			const x2 = timeToX(bucket.endTime);

			// Skip buckets outside visible area
			if (x2 < 0 || x1 > width) continue;

			// Clamp to visible area
			const drawX = Math.max(0, x1);
			const drawWidth = Math.min(width, x2) - drawX;

			if (drawWidth <= 0) continue;

			// Get color based on activity level (smooth interpolation)
			c.fillStyle = this.getActivityColor(bucket.activity, bucket.count > 0);
			c.fillRect(drawX, barY, drawWidth + 1, BAR_HEIGHT); // +1 to avoid gaps
		}
	}

	private computeActivityBuckets(
		users: User[],
		dataStart: number,
		dataEnd: number
	): ActivityBucket[] {
		const duration = dataEnd - dataStart;
		if (duration <= 0) return [];

		const bucketDuration = duration / NUM_BUCKETS;
		const buckets: ActivityBucket[] = [];

		// Initialize buckets
		for (let i = 0; i < NUM_BUCKETS; i++) {
			buckets.push({
				startTime: dataStart + i * bucketDuration,
				endTime: dataStart + (i + 1) * bucketDuration,
				totalSpeed: 0,
				count: 0,
				activity: 0
			});
		}

		// Collect speeds from all enabled users
		for (const user of users) {
			if (!user.enabled || !user.dataTrail || user.dataTrail.length < 2) continue;

			const trail = user.dataTrail;

			for (let i = 1; i < trail.length; i++) {
				const prev = trail[i - 1];
				const curr = trail[i];

				// Skip points without position or time
				if (
					prev.x === null ||
					prev.y === null ||
					curr.x === null ||
					curr.y === null ||
					prev.time === null ||
					curr.time === null
				)
					continue;

				const dt = curr.time - prev.time;
				if (dt <= 0) continue;

				// Calculate speed (distance / time)
				const dx = curr.x - prev.x;
				const dy = curr.y - prev.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const speed = distance / dt;

				// Find ALL buckets this segment spans
				const startBucket = Math.floor(((prev.time - dataStart) / duration) * NUM_BUCKETS);
				const endBucket = Math.floor(((curr.time - dataStart) / duration) * NUM_BUCKETS);

				// Add speed to all buckets the segment passes through
				const minBucket = Math.max(0, startBucket);
				const maxBucket = Math.min(NUM_BUCKETS - 1, endBucket);
				for (let b = minBucket; b <= maxBucket; b++) {
					buckets[b].totalSpeed += speed;
					buckets[b].count += 1;
				}
			}
		}

		// Compute averages and collect for percentile calculation
		const averages: number[] = [];
		for (const bucket of buckets) {
			if (bucket.count > 0) {
				bucket.activity = bucket.totalSpeed / bucket.count;
				averages.push(bucket.activity);
			}
		}

		// Normalize using 95th percentile to avoid outliers skewing the scale
		if (averages.length > 0) {
			averages.sort((a, b) => a - b);
			const p95Index = Math.floor(averages.length * 0.95);
			const p95Speed = averages[p95Index] || averages[averages.length - 1];

			if (p95Speed > 0) {
				for (const bucket of buckets) {
					if (bucket.count > 0) {
						bucket.activity = Math.min(1, bucket.activity / p95Speed);
					}
				}
			}
		}

		return buckets;
	}

	private getActivityColor(activity: number, hasData: boolean): string {
		if (!hasData) return NO_DATA_COLOR;

		// Smooth interpolation: map activity (0-1) to opacity range
		const opacity = MIN_OPACITY + activity * (MAX_OPACITY - MIN_OPACITY);
		return `rgba(0, 0, 0, ${opacity.toFixed(3)})`;
	}
}
