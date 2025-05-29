import ConfigStore from '../../stores/configStore';
import TimelineStore from '../../stores/timelineStore';
import { SmoothMovement } from './smooth-movement.js';

let timeline;

TimelineStore.subscribe((data) => {
	timeline = data;
});

let maxStopLength, isPathColorMode, movementStrokeWeight, stopStrokeWeight, useOptimizedTrail;

ConfigStore.subscribe((data) => {
    maxStopLength = data.maxStopLength;
    isPathColorMode = data.isPathColorMode;
    movementStrokeWeight = data.movementStrokeWeight;
    stopStrokeWeight = data.stopStrokeWeight;
    useOptimizedTrail = data.useOptimizedTrail || false;
});

export class DrawMovement {
	constructor(sketch, drawUtils) {
		this.sk = sketch;
		this.drawUtils = drawUtils;
		this.dot = null;
		this.largestStopPixelSize = 50;
		this.shade = null;
		this.smoothMovement = new SmoothMovement(this);
		this.currentUser = null;
	}

    setData(user) {
			this.dot = null;
			this.sk.noFill();
			this.shade = user.color;
			this.currentUser = user;

			const dataTrail = useOptimizedTrail && user.optimizedDataTrail && user.optimizedDataTrail.length > 0
					? user.optimizedDataTrail
					: user.dataTrail;

			this.setDraw(dataTrail, user);
			
			// Try smooth interpolation first, fallback to regular dot recording
			if (!this.smoothMovement.recordSmoothDot(user) && this.dot !== null) {
				this.drawDot(this.dot);
			} else if (this.dot !== null) {
				this.drawDot(this.dot);
			}
    }

	setDraw(dataTrail) {
		for (let i = 0; i < dataTrail.length; i++) {
			let point = dataTrail[i];
			let augmentedPoint = this.getAugmentedPoint(this.sk.PLAN, point);

			if (this.drawUtils.isVisible(augmentedPoint.point, augmentedPoint.pos, augmentedPoint.point.stopLength)) {
				let segmentEnd = this.findSegmentEnd(dataTrail, i); // Look ahead to find the next point with different stopLength or codes
				this.setLineStyles(point.stopLength, point.codes);
				this.drawSegment(this.sk.SPACETIME, dataTrail, i, segmentEnd); // drawSpaceTimeCurve
				if (this.drawUtils.isStopped(point.stopLength)) {
					this.drawStopCircle(augmentedPoint); // draw stop circles on floor plan
				} else this.drawSegment(this.sk.PLAN, dataTrail, i, segmentEnd); // draw floor plan curve
				i = segmentEnd; // Skip ahead to the end of the segment
			}
		}
	}

	// Find the end of the segment where stopLength or codes change
	findSegmentEnd(dataTrail, start) {
		const startPoint = dataTrail[start];
		for (let i = start + 1; i < dataTrail.length; i++) {
			let currentPoint = dataTrail[i];
			let augmentedPoint = this.getAugmentedPoint(this.sk.PLAN, currentPoint);
			if (this.testToDetermineSegmentEnd(currentPoint, startPoint, augmentedPoint)) {
				return i - 1;
			}
		}
		return dataTrail.length - 1; // If no change, return the last point
	}

	testToDetermineSegmentEnd(currentPoint, startPoint, augmentedPoint) {
		return (
			this.drawUtils.isStopped(currentPoint.stopLength) !== this.drawUtils.isStopped(startPoint.stopLength) ||
			JSON.stringify(currentPoint.codes) !== JSON.stringify(startPoint.codes) ||
			!this.drawUtils.isVisible(augmentedPoint.point, augmentedPoint.pos, augmentedPoint.point.stopLength)
		);
	}

	drawSegment(view, dataTrail, start, end) {
		this.sk.beginShape();
		for (let i = start; i <= end; i++) {
			let point = dataTrail[i];
			const augmentedPoint = this.getAugmentedPoint(view, point);
			if (view === this.sk.SPACETIME) this.recordDot(augmentedPoint);
			if (i === start && i !== 0 && !this.drawUtils.isStopped(point.stopLength)) {
				this.drawAdditionalVertex(view, dataTrail[i - 1]);
			}
			this.sk.vertex(augmentedPoint.pos.viewXPos, augmentedPoint.pos.floorPlanYPos, augmentedPoint.pos.zPos);
			if (i === end && i !== dataTrail.length - 1 && !this.drawUtils.isStopped(point.stopLength)) {
				this.drawAdditionalVertex(view, dataTrail[i + 1]);
			}
		}
		this.sk.endShape();
	}

	getAugmentedPoint(view, point) {
		if (view === this.sk.PLAN) return this.drawUtils.createAugmentPoint(this.sk.PLAN, point, point.time);
		else return this.drawUtils.createAugmentPoint(this.sk.SPACETIME, point, point.time);
	}

	drawAdditionalVertex(view, point) {
		const augmentedPoint = this.getAugmentedPoint(view, point);
		this.sk.vertex(augmentedPoint.pos.viewXPos, augmentedPoint.pos.floorPlanYPos, augmentedPoint.pos.zPos);
	}

	drawStopCircle(augmentedPoint) {
		this.sk.noStroke();
		this.setFill(this.drawUtils.setCodeColor(augmentedPoint.point.codes));
		const stopSize = this.sk.map(augmentedPoint.point.stopLength, 0, maxStopLength, 5, this.largestStopPixelSize);
		this.sk.circle(augmentedPoint.pos.viewXPos, augmentedPoint.pos.floorPlanYPos, stopSize);
		this.sk.noFill();
	}

	setLineStyles(stopLength, codes) {
		this.setStroke(this.drawUtils.setCodeColor(codes));
		if (this.drawUtils.isStopped(stopLength)) {
			this.sk.strokeWeight(stopStrokeWeight);
		} else {
			this.sk.strokeWeight(movementStrokeWeight);
		}
	}

	setFill(color) {
		if (!isPathColorMode) this.sk.fill(this.shade);
		else this.sk.fill(color);
	}

	setStroke(color) {
		if (!isPathColorMode) this.sk.stroke(this.shade);
		else this.sk.stroke(color);
	}

	getNewDot(augmentedPoint, curDot) {
		const [xPos, yPos, zPos, timePos, map3DMouse, codeColor] = this.getDotValues(augmentedPoint);

		if (this.isMouseOverTimelineAndValid(map3DMouse, timePos, curDot)) {
			return this.createDot(xPos, yPos, zPos, map3DMouse, codeColor, Math.abs(map3DMouse - timePos));
		}
		if (timeline.getIsAnimating()) {
			return this.createDot(xPos, yPos, zPos, timePos, codeColor, null); // No length to compare so set to null
		}
		if (this.sk.videoController.isLoadedAndIsPlaying()) {
			const videoSelectTime = this.getVideoSelectTime();
			if (this.compareToCurDot(videoSelectTime, timePos, curDot)) {
				return this.createDot(xPos, yPos, zPos, timePos, codeColor, Math.abs(videoSelectTime - timePos));
			}
		}
		return null;
	}

	getDotValues(augmentedPoint) {
		return [
			augmentedPoint.pos.floorPlanXPos,
			augmentedPoint.pos.floorPlanYPos,
			augmentedPoint.pos.zPos,
			augmentedPoint.pos.selTimelineXPos,
			this.sk.mapToSelectTimeThenPixelTime(this.sk.mouseX),
			this.drawUtils.setCodeColor(augmentedPoint.point.codes)
		];
	}

	isMouseOverTimelineAndValid(map3DMouse, timePos, curDot) {
		return timeline.overTimeline(this.sk.mouseX) && this.compareToCurDot(map3DMouse, timePos, curDot);
	}

	getVideoSelectTime() {
		const videoPixelTime = timeline.mapTotalTimeToPixelTime(this.sk.videoController.getVideoPlayerCurTime());
		return this.sk.mapSelectTimeToPixelTime(videoPixelTime);
	}

	compareToCurDot(pixelStart, pixelEnd, curDot) {
		let pixelAmountToCompare = this.sk.width; // if dot has not been set yet, compare to this width
		if (curDot !== null) pixelAmountToCompare = curDot.lengthToCompare;
		return pixelStart >= pixelEnd - pixelAmountToCompare && pixelStart <= pixelEnd + pixelAmountToCompare;
	}

	createDot(xPos, yPos, zPos, timePos, color, lengthToCompare) {
		return { xPos, yPos, zPos, timePos, color, lengthToCompare };
	}

	drawDot(curDot) {
		const dotSize = this.sk.width / 50;
		this.drawFloorPlanDot(curDot, dotSize);
		if (this.sk.handle3D.getIs3DMode()) this.draw3DSpaceTimeDot(curDot);
		else this.sk.circle(curDot.timePos, curDot.yPos, dotSize);
	}

	drawFloorPlanDot(curDot, dotSize) {
		this.sk.stroke(0);
		this.sk.strokeWeight(5);
		this.setFill(curDot.color);
		this.sk.circle(curDot.xPos, curDot.yPos, dotSize);
	}

	draw3DSpaceTimeDot(curDot) {
		this.sk.strokeWeight(25);
		this.setStroke(curDot.color);
		this.sk.point(curDot.xPos, curDot.yPos, curDot.zPos);
		this.sk.strokeWeight(2);
		this.sk.line(curDot.xPos, curDot.yPos, 0, curDot.xPos, curDot.yPos, curDot.zPos);
	}

	recordDot(augmentPoint) {
		const newDot = this.getNewDot(augmentPoint, this.dot);
		if (newDot !== null) {
			this.dot = newDot;
		}
	}
}
