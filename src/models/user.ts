import type { DataPoint } from './dataPoint';

export class User {
    enabled: boolean;
    conversation_enabled: boolean;
    name: string;
    color: string;
    dataTrail: DataPoint[];
    optimizedDataTrail: DataPoint[];
    movementIsLoaded: boolean;
    conversationIsLoaded: boolean;

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
        codeSamplingInterval: number = 10
    ) {
        if (this.dataTrail.length === 0) {
            this.optimizedDataTrail = [];
            return;
        }

        this.optimizedDataTrail = [];
        const startTime = performance.now();
        let keepCount = {
            speech: 0,
            codes: 0,
            stops: 0,
            movement: 0,
            sampled: 0,
            skipped: 0,
            total: this.dataTrail.length
        };

        // Quick analysis of the dataset to determine optimization strategy
        let hasCodeCount = 0;
        let hasSpeechCount = 0;
        for (let i = 0; i < Math.min(100, this.dataTrail.length); i++) {
            if (this.dataTrail[i].codes && this.dataTrail[i].codes.length > 0) hasCodeCount++;
            if (this.dataTrail[i].speech && this.dataTrail[i].speech.trim().length > 0) hasSpeechCount++;
        }

        // Calculate percentage of points with codes or speech
        const hasCodesPercentage = (hasCodeCount / Math.min(100, this.dataTrail.length)) * 100;
        const hasSpeechPercentage = (hasSpeechCount / Math.min(100, this.dataTrail.length)) * 100;

        // If high percentage of points have codes, enable aggressive mode to ensure optimization works
        const shouldUseAggressive = aggressiveOptimization && (hasCodesPercentage > 80 || hasSpeechPercentage > 80);

        console.log(`Dataset analysis: codes=${hasCodesPercentage.toFixed(1)}%, speech=${hasSpeechPercentage.toFixed(1)}%, using ${shouldUseAggressive ? 'aggressive' : 'standard'} optimization`);

        // Always include the first point
        this.optimizedDataTrail.push(this.dataTrail[0].clone());

        let lastIncludedIndex = 0;
        let inStop = this.dataTrail[0].stopLength > 0;
        let stopStartIndex = inStop ? 0 : -1;
        let stopPointsAdded = 0;

        // Track code points for sampling
        let lastCodePointIndex = 0;
        let inCodeSequence = this.dataTrail[0].codes.length > 0;
        let codeSequenceStart = inCodeSequence ? 0 : -1;
        let codePointsAdded = 0;

        // Process the remaining points
        for (let i = 1; i < this.dataTrail.length; i++) {
            const current = this.dataTrail[i];
            const last = this.dataTrail[lastIncludedIndex];
            let include = false;
            let reason = "";

            // Handle speech points
            const hasSpeech = current.speech && current.speech.trim().length > 0;
            if (hasSpeech && (!shouldUseAggressive || current.speech !== last.speech)) {
                include = true;
                reason = "speech";
                keepCount.speech++;
            }

            // Handle code points with sampling when necessary
            const hasCodes = current.codes.length > 0;

            // Track code sequences for sampling
            if (hasCodes && !inCodeSequence) {
                inCodeSequence = true;
                codeSequenceStart = i;
                codePointsAdded = 0;
            } else if (!hasCodes && inCodeSequence) {
                inCodeSequence = false;
                codeSequenceStart = -1;
            }

            // Check if this code point should be included
            if (hasCodes) {
                // In aggressive mode with code sampling, only include some code points
                if (shouldUseAggressive && codeSamplingEnabled) {
                    // Always include points where codes change
                    const codesChanged = !this.arraysEqual(current.codes, last.codes);

                    if (codesChanged) {
                        include = true;
                        reason = "codeChange";
                        keepCount.codes++;
                    }
                    // Sample code points to avoid including all of them
                    else if (codeSequenceStart > -1 && i - codeSequenceStart > 0) {
                        // Include points at regular intervals based on codeSamplingInterval
                        if ((i - codeSequenceStart) % codeSamplingInterval === 0) {
                            include = true;
                            reason = "codeSample";
                            keepCount.codes++;
                            codePointsAdded++;
                        } else {
                            keepCount.skipped++;
                        }
                    }
                } else {
                    // Standard mode: include all code points
                    include = true;
                    reason = "code";
                    keepCount.codes++;
                }
            }

            // Handle stops with more nuance
            const isCurrentStop = current.stopLength > 0;
            const wasLastPointStop = i > 0 && this.dataTrail[i-1].stopLength > 0;

            // Detect stop transitions
            const isStopStart = isCurrentStop && !wasLastPointStop;
            const isStopEnd = !isCurrentStop && wasLastPointStop;

            // Track stop state
            if (isStopStart) {
                inStop = true;
                stopStartIndex = i;
                stopPointsAdded = 0;
            } else if (isStopEnd) {
                inStop = false;
                stopStartIndex = -1;
            }

            // Include stop points based on strategy
            if (preserveStops) {
                // Always include start and end of stops
                if (isStopStart || isStopEnd) {
                    include = true;
                    reason = isStopStart ? "stopStart" : "stopEnd";
                    keepCount.stops++;
                }
                // For longer stops, sample points at a reasonable rate to maintain stop shape
                else if (inStop && stopSamplingEnabled) {
                    // If this is a long stop, include some intermediate points
                    if (i - stopStartIndex > stopSamplingInterval) {
                        // Sample stops according to interval or when stop duration changes significantly
                        const stopDurationChanged = Math.abs(current.stopLength - last.stopLength) > 1;

                        if (stopDurationChanged || (i - stopStartIndex) % stopSamplingInterval === 0) {
                            include = true;
                            reason = "stopSample";
                            keepCount.sampled++;
                            stopPointsAdded++;
                        }
                    }
                }
            }

            // Include points that represent significant movement
            let significantMovement = false;
            if (!include && current.x !== null && current.y !== null && last.x !== null && last.y !== null) {
                const distance = Math.sqrt(
                    Math.pow(current.x - last.x, 2) +
                    Math.pow(current.y - last.y, 2)
                );
                significantMovement = distance > minDistance;
                if (significantMovement) {
                    include = true;
                    reason = "movement";
                    keepCount.movement++;
                }
            }

            // Include based on our criteria
            if (include) {
                this.optimizedDataTrail.push(current.clone());
                lastIncludedIndex = i;
            }
        }

        const lastIndex = this.dataTrail.length - 1;
        if (lastIncludedIndex < lastIndex) {
            this.optimizedDataTrail.push(this.dataTrail[lastIndex].clone());
        }

        const endTime = performance.now();
        const reductionPercent = ((this.dataTrail.length - this.optimizedDataTrail.length) / this.dataTrail.length * 100).toFixed(1);

        console.log(`Optimized path for ${this.name}: ${this.dataTrail.length} → ${this.optimizedDataTrail.length} points (${reductionPercent}% reduction)`);
        console.log(`Optimization took ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Points kept: speech=${keepCount.speech}, codes=${keepCount.codes}, stops=${keepCount.stops}, movement=${keepCount.movement}, sampled=${keepCount.sampled}, skipped=${keepCount.skipped}`);

        // If no optimization happened, log more details to help diagnose
        if (this.optimizedDataTrail.length > this.dataTrail.length * 0.9) {
            console.log(`Limited optimization for ${this.name} - analyzing first 50 points:`);
            let hasMovement = 0, hasStops = 0, hasCodes = 0, hasSpeech = 0;

            for (let i = 0; i < Math.min(50, this.dataTrail.length); i++) {
                const point = this.dataTrail[i];
                if (point.stopLength > 0) hasStops++;
                if (point.codes.length > 0) hasCodes++;
                if (point.speech && point.speech.trim().length > 0) hasSpeech++;
                if (i > 0) {
                    const prev = this.dataTrail[i-1];
                    if (point.x !== null && point.y !== null && prev.x !== null && prev.y !== null) {
                        const distance = Math.sqrt(
                            Math.pow(point.x - prev.x, 2) +
                            Math.pow(point.y - prev.y, 2)
                        );
                        if (distance > minDistance) hasMovement++;
                    }
                }
            }

            console.log(`Sample analysis: speech=${hasSpeech}, codes=${hasCodes}, stops=${hasStops}, movement=${hasMovement}/50 points`);
        }
    }

    // Helper function to compare arrays
    private arraysEqual(a: any[], b: any[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}