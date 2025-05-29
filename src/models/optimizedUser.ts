import type { DataPoint } from './dataPoint';

export interface OptimizationConfig {
    minDistance: number;
    preserveStops: boolean;
    stopSamplingEnabled: boolean;
    stopSamplingInterval: number;
    aggressiveOptimization: boolean;
    codeSamplingEnabled: boolean;
    codeSamplingInterval: number;
    temporalSmoothing: boolean;
    maxTimeGap: number;
    interpolationThreshold: number;
}

export interface OptimizationStats {
    original: number;
    optimized: number;
    reduction: number;
    speech: number;
    codes: number;
    stops: number;
    movement: number;
    temporal: number;
    interpolated: number;
}

export class PathOptimizer {
    private config: OptimizationConfig;
    
    constructor(config: Partial<OptimizationConfig> = {}) {
        this.config = {
            minDistance: 5,
            preserveStops: true,
            stopSamplingEnabled: true,
            stopSamplingInterval: 5,
            aggressiveOptimization: true,
            codeSamplingEnabled: true,
            codeSamplingInterval: 10,
            temporalSmoothing: true,
            maxTimeGap: 2.0, // Maximum time gap in seconds before adding interpolation points
            interpolationThreshold: 0.5, // Minimum time gap to trigger interpolation
            ...config
        };
    }
    
    optimizeTrail(dataTrail: DataPoint[]): { optimized: DataPoint[], stats: OptimizationStats } {
        if (dataTrail.length === 0) {
            return {
                optimized: [],
                stats: this.createEmptyStats()
            };
        }
        
        const stats: OptimizationStats = {
            original: dataTrail.length,
            optimized: 0,
            reduction: 0,
            speech: 0,
            codes: 0,
            stops: 0,
            movement: 0,
            temporal: 0,
            interpolated: 0
        };
        
        // First pass: Apply spatial and feature-based optimization
        const spatiallyOptimized = this.applySpatialOptimization(dataTrail, stats);
        
        // Second pass: Apply temporal smoothing if enabled
        let finalOptimized = spatiallyOptimized;
        if (this.config.temporalSmoothing) {
            finalOptimized = this.applyTemporalSmoothing(spatiallyOptimized, stats);
        }
        
        stats.optimized = finalOptimized.length;
        stats.reduction = ((stats.original - stats.optimized) / stats.original * 100);
        
        return { optimized: finalOptimized, stats };
    }
    
    private applySpatialOptimization(dataTrail: DataPoint[], stats: OptimizationStats): DataPoint[] {
        const optimized: DataPoint[] = [];
        
        // Always include first point
        optimized.push(dataTrail[0].clone());
        
        let lastIncludedIndex = 0;
        let inStop = dataTrail[0].stopLength > 0;
        let stopStartIndex = inStop ? 0 : -1;
        let inCodeSequence = dataTrail[0].codes.length > 0;
        let codeSequenceStart = inCodeSequence ? 0 : -1;
        
        for (let i = 1; i < dataTrail.length; i++) {
            const current = dataTrail[i];
            const last = dataTrail[lastIncludedIndex];
            let include = false;
            let reason = "";
            
            // Check for speech
            if (current.speech && current.speech.trim().length > 0) {
                if (!this.config.aggressiveOptimization || current.speech !== last.speech) {
                    include = true;
                    reason = "speech";
                    stats.speech++;
                }
            }
            
            // Handle code changes
            if (current.codes.length > 0) {
                const codesChanged = !this.arraysEqual(current.codes, last.codes);
                
                if (!inCodeSequence) {
                    inCodeSequence = true;
                    codeSequenceStart = i;
                }
                
                if (codesChanged) {
                    include = true;
                    reason = "codeChange";
                    stats.codes++;
                } else if (this.config.aggressiveOptimization && this.config.codeSamplingEnabled) {
                    if ((i - codeSequenceStart) % this.config.codeSamplingInterval === 0) {
                        include = true;
                        reason = "codeSample";
                        stats.codes++;
                    }
                } else {
                    include = true;
                    reason = "code";
                    stats.codes++;
                }
            } else {
                inCodeSequence = false;
                codeSequenceStart = -1;
            }
            
            // Handle stops
            const isCurrentStop = current.stopLength > 0;
            const wasLastStop = i > 0 && dataTrail[i-1].stopLength > 0;
            const isStopStart = isCurrentStop && !wasLastStop;
            const isStopEnd = !isCurrentStop && wasLastStop;
            
            if (isStopStart) {
                inStop = true;
                stopStartIndex = i;
            } else if (isStopEnd) {
                inStop = false;
                
                // Always include the last point of a stop
                if (!include && i > 0) {
                    optimized.push(dataTrail[i-1].clone());
                    stats.stops++;
                }
            }
            
            if (this.config.preserveStops && (isStopStart || isStopEnd)) {
                include = true;
                reason = isStopStart ? "stopStart" : "stopEnd";
                stats.stops++;
            } else if (inStop && this.config.stopSamplingEnabled && stopStartIndex > -1) {
                if ((i - stopStartIndex) % this.config.stopSamplingInterval === 0) {
                    include = true;
                    reason = "stopSample";
                    stats.stops++;
                }
            }
            
            // Check for significant movement
            if (!include && current.x !== null && current.y !== null && last.x !== null && last.y !== null) {
                const distance = Math.sqrt(
                    Math.pow(current.x - last.x, 2) + 
                    Math.pow(current.y - last.y, 2)
                );
                
                if (distance > this.config.minDistance) {
                    include = true;
                    reason = "movement";
                    stats.movement++;
                }
            }
            
            if (include) {
                optimized.push(current.clone());
                lastIncludedIndex = i;
            }
        }
        
        // Always include last point
        const lastIndex = dataTrail.length - 1;
        if (lastIncludedIndex < lastIndex) {
            optimized.push(dataTrail[lastIndex].clone());
        }
        
        return optimized;
    }
    
    private applyTemporalSmoothing(points: DataPoint[], stats: OptimizationStats): DataPoint[] {
        if (points.length < 2) return points;
        
        const smoothed: DataPoint[] = [points[0]];
        
        for (let i = 1; i < points.length; i++) {
            const prev = smoothed[smoothed.length - 1];
            const curr = points[i];
            const timeGap = curr.time - prev.time;
            
            // If time gap is too large, add interpolated points
            if (timeGap > this.config.maxTimeGap) {
                const interpolatedPoints = this.interpolatePoints(prev, curr, timeGap);
                smoothed.push(...interpolatedPoints);
                stats.temporal += interpolatedPoints.length;
                stats.interpolated += interpolatedPoints.length;
            }
            
            smoothed.push(curr);
        }
        
        return smoothed;
    }
    
    private interpolatePoints(start: DataPoint, end: DataPoint, timeGap: number): DataPoint[] {
        const interpolated: DataPoint[] = [];
        
        // Calculate number of intermediate points needed
        const numPoints = Math.floor(timeGap / this.config.interpolationThreshold) - 1;
        
        if (numPoints <= 0) return interpolated;
        
        // Don't interpolate if either point is a stop
        if (start.stopLength > 0 || end.stopLength > 0) {
            return interpolated;
        }
        
        for (let i = 1; i <= numPoints; i++) {
            const t = i / (numPoints + 1); // Interpolation factor
            
            const point = new DataPoint({
                time: start.time + (end.time - start.time) * t,
                x: start.x !== null && end.x !== null ? start.x + (end.x - start.x) * t : null,
                y: start.y !== null && end.y !== null ? start.y + (end.y - start.y) * t : null,
                codes: [], // No codes for interpolated points
                speech: '', // No speech for interpolated points
                stopLength: 0, // Interpolated points are never stops
                interpolated: true // Mark as interpolated
            });
            
            interpolated.push(point);
        }
        
        return interpolated;
    }
    
    private arraysEqual(a: any[], b: any[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    private createEmptyStats(): OptimizationStats {
        return {
            original: 0,
            optimized: 0,
            reduction: 0,
            speech: 0,
            codes: 0,
            stops: 0,
            movement: 0,
            temporal: 0,
            interpolated: 0
        };
    }
    
    // Helper method to find the closest point in time for smooth playback
    static findClosestPointAtTime(points: DataPoint[], targetTime: number): { point: DataPoint, index: number } | null {
        if (points.length === 0) return null;
        
        // Binary search for efficiency
        let left = 0;
        let right = points.length - 1;
        
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (points[mid].time < targetTime) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        // Check adjacent points to find the closest
        const candidates = [
            left > 0 ? left - 1 : left,
            left,
            left < points.length - 1 ? left + 1 : left
        ];
        
        let closestIndex = left;
        let closestDistance = Math.abs(points[left].time - targetTime);
        
        for (const idx of candidates) {
            if (idx >= 0 && idx < points.length) {
                const distance = Math.abs(points[idx].time - targetTime);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = idx;
                }
            }
        }
        
        return { point: points[closestIndex], index: closestIndex };
    }
    
    // Interpolate position at a specific time for smooth animation
    static interpolatePositionAtTime(points: DataPoint[], targetTime: number): { x: number | null, y: number | null } | null {
        if (points.length === 0) return null;
        
        const closest = PathOptimizer.findClosestPointAtTime(points, targetTime);
        if (!closest) return null;
        
        // If we're exactly at a point or have no valid position, return it
        if (closest.point.time === targetTime || closest.point.x === null || closest.point.y === null) {
            return { x: closest.point.x, y: closest.point.y };
        }
        
        // Find the next point for interpolation
        let nextIndex = closest.index;
        let prevIndex = closest.index;
        
        if (closest.point.time < targetTime && closest.index < points.length - 1) {
            nextIndex = closest.index + 1;
        } else if (closest.point.time > targetTime && closest.index > 0) {
            prevIndex = closest.index - 1;
        }
        
        const prev = points[prevIndex];
        const next = points[nextIndex];
        
        // Can't interpolate if positions are invalid
        if (prev.x === null || prev.y === null || next.x === null || next.y === null) {
            return { x: closest.point.x, y: closest.point.y };
        }
        
        // Don't interpolate between different stop states
        if ((prev.stopLength > 0) !== (next.stopLength > 0)) {
            return { x: closest.point.x, y: closest.point.y };
        }
        
        // Linear interpolation
        const t = (targetTime - prev.time) / (next.time - prev.time);
        const x = prev.x + (next.x - prev.x) * t;
        const y = prev.y + (next.y - prev.y) * t;
        
        return { x, y };
    }
}