import type { DataPoint } from './dataPoint';
import { PathOptimizer, type OptimizationConfig, type OptimizationStats } from './optimizedUser';

export class User {
    enabled: boolean;
    conversation_enabled: boolean;
    name: string;
    color: string;
    dataTrail: DataPoint[];
    optimizedDataTrail: DataPoint[];
    movementIsLoaded: boolean;
    conversationIsLoaded: boolean;
    optimizationStats?: OptimizationStats;

    constructor(dataTrail: DataPoint[], color: string, enabled = true, name = '', movementIsLoaded = false) {
        this.enabled = enabled;
        this.conversation_enabled = enabled;
        this.name = name;
        this.color = color;
        this.dataTrail = dataTrail;
        this.optimizedDataTrail = []; // Initialize empty array
        this.movementIsLoaded = movementIsLoaded;
        this.conversationIsLoaded = movementIsLoaded;
    }

    generateOptimizedTrail(
        minDistance: number = 5,
        preserveStops: boolean = true,
        stopSamplingEnabled: boolean = true,
        stopSamplingInterval: number = 5,
        aggressiveOptimization: boolean = true,
        codeSamplingEnabled: boolean = true,
        codeSamplingInterval: number = 10,
        temporalSmoothing: boolean = true,
        maxTimeGap: number = 2.0,
        interpolationThreshold: number = 0.5
    ) {
        const optimizer = new PathOptimizer({
            minDistance,
            preserveStops,
            stopSamplingEnabled,
            stopSamplingInterval,
            aggressiveOptimization,
            codeSamplingEnabled,
            codeSamplingInterval,
            temporalSmoothing,
            maxTimeGap,
            interpolationThreshold
        });
        
        const startTime = performance.now();
        const { optimized, stats } = optimizer.optimizeTrail(this.dataTrail);
        this.optimizedDataTrail = optimized;
        this.optimizationStats = stats;
        
        const endTime = performance.now();
        
        console.log(`Optimized path for ${this.name}: ${stats.original} → ${stats.optimized} points (${stats.reduction.toFixed(1)}% reduction)`);
        console.log(`Optimization took ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Points kept: speech=${stats.speech}, codes=${stats.codes}, stops=${stats.stops}, movement=${stats.movement}, temporal=${stats.temporal}, interpolated=${stats.interpolated}`);
    }

    // Get interpolated position at a specific time for smooth animation
    getInterpolatedPositionAtTime(targetTime: number): { x: number | null, y: number | null } | null {
        const dataToUse = this.optimizedDataTrail.length > 0 ? this.optimizedDataTrail : this.dataTrail;
        return PathOptimizer.interpolatePositionAtTime(dataToUse, targetTime);
    }
    
    // Find closest data point at a specific time
    findClosestPointAtTime(targetTime: number): { point: DataPoint, index: number } | null {
        const dataToUse = this.optimizedDataTrail.length > 0 ? this.optimizedDataTrail : this.dataTrail;
        return PathOptimizer.findClosestPointAtTime(dataToUse, targetTime);
    }
}