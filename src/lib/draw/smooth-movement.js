import ConfigStore from '../../stores/configStore';
import TimelineStore from '../../stores/timelineStore';

let timeline;

TimelineStore.subscribe((data) => {
    timeline = data;
});

let useInterpolation;

ConfigStore.subscribe((data) => {
    useInterpolation = data.useInterpolation !== undefined ? data.useInterpolation : true;
});

export class SmoothMovement {
    constructor(drawMovement) {
        this.drawMovement = drawMovement;
        this.sk = drawMovement.sk;
        this.drawUtils = drawMovement.drawUtils;
    }

    // Enhanced dot recording that uses interpolation for smooth movement
    recordSmoothDot(user) {
        if (!timeline) return;
        
        const currTime = timeline.getCurrTime();
        
        // First try to get interpolated position if enabled
        if (useInterpolation) {
            const interpolatedPos = user.getInterpolatedPositionAtTime(currTime);
            if (interpolatedPos && interpolatedPos.x !== null && interpolatedPos.y !== null) {
                // Use the floor plan scaling from draw-utils
                const [xPos, yPos] = this.sk.floorPlan.getScaledXYPos(
                    interpolatedPos.x, 
                    interpolatedPos.y, 
                    this.sk.gui.fpContainer.getContainer()
                );
                
                // Find the closest actual data point for code colors
                const closest = user.findClosestPointAtTime(currTime);
                if (closest) {
                    const codeColor = this.drawUtils.setCodeColor(closest.point.codes);
                    // Map time to Z axis for 3D mode
                    const timelineXPos = timeline.mapTotalTimeToPixelTime(currTime);
                    const timePos = this.sk.mapSelectTimeToPixelTime(timelineXPos);
                    const zPos = this.sk.handle3D.getIs3DMode() ? timePos : 0;
                    
                    // Create smooth dot
                    this.drawMovement.dot = this.drawMovement.createDot(
                        xPos, 
                        yPos, 
                        zPos, 
                        timePos, 
                        codeColor, 
                        null
                    );
                    
                    return true;
                }
            }
        }
        
        // Fallback to original closest point method
        return false;
    }
    
    // Find visible points efficiently using binary search
    findVisiblePointsInTimeRange(dataTrail, startTime, endTime) {
        if (dataTrail.length === 0) return { start: -1, end: -1 };
        
        // Binary search for start index
        let left = 0;
        let right = dataTrail.length - 1;
        let startIndex = -1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (dataTrail[mid].time < startTime) {
                left = mid + 1;
            } else {
                startIndex = mid;
                right = mid - 1;
            }
        }
        
        if (startIndex === -1) startIndex = dataTrail.length;
        
        // Binary search for end index
        left = startIndex;
        right = dataTrail.length - 1;
        let endIndex = dataTrail.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (dataTrail[mid].time <= endTime) {
                left = mid + 1;
            } else {
                endIndex = mid - 1;
                right = mid - 1;
            }
        }
        
        return { start: startIndex, end: endIndex };
    }
    
    // Optimized segment drawing that skips interpolated points for performance
    drawOptimizedSegment(view, dataTrail, start, end) {
        if (start >= end) return;
        
        // Skip drawing segments that consist only of interpolated points
        let hasRealPoints = false;
        for (let i = start; i <= end; i++) {
            if (!dataTrail[i].interpolated) {
                hasRealPoints = true;
                break;
            }
        }
        
        if (!hasRealPoints) return;
        
        // Draw using the original method
        this.drawMovement.drawSegment(view, dataTrail, start, end);
    }
    
    // Get optimization stats for debugging
    getOptimizationStats(user) {
        if (!user.optimizationStats) return null;
        
        const stats = user.optimizationStats;
        return {
            name: user.name,
            original: stats.original,
            optimized: stats.optimized,
            reduction: `${stats.reduction.toFixed(1)}%`,
            interpolated: stats.interpolated,
            temporalPoints: stats.temporal
        };
    }
}