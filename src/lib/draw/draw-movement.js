import ConfigStore from '../../stores/configStore';
import TimelineStore from '../../stores/timelineStore';

let timeline;

TimelineStore.subscribe((data) => {
	timeline = data;
});

/**
 * This class provides a set of custom methods to draw movement data in floorPlan and space-time views of the IGS.
 * Many of the methods address specific browser constraints and balance aesthetic and efficient curve drawing needs
 * For example, using the "line" method in a library like P5 is inefficient and curveVertex increases efficiency significantly but
 * the tradeoff is the need for more customized methods and conditional structures to handle starting/begining lines/shapes
 */

let maxStopLength, isPathColorMode;

ConfigStore.subscribe((data) => {
	maxStopLength = data.maxStopLength;
	isPathColorMode = data.isPathColorMode;
});

export class DrawMovement {
	constructor(sketch, drawUtils) {
		this.sk = sketch;
		this.drawUtils = drawUtils;
		this.dot = null;
		this.isDrawingLine = false;
		this.largestStopPixelSize = 50;
		this.style = {
			shade: null,
			thinStroke: 1,
			fatStroke: 9
		};
	}

	setData(user) {
		this.dot = null;
		this.sk.noFill();
		this.sk.noStroke();
		this.style.shade = user.color;
		this.setDraw(this.sk.PLAN, user.dataTrail);
		this.setDraw(this.sk.SPACETIME, user.dataTrail);
		if (this.dot !== null) this.drawDot(this.dot);
	}

	setDraw(view, dataTrail) {
		this.isDrawingLine = false;

		for (let i = 1; i < dataTrail.length; i++) {
			const currentMovement = dataTrail[i];
			let previousMovement = dataTrail[i - 1];

			// If current point is null, continue to next iteration
			if (currentMovement.x === null || currentMovement.y === null) {
				continue;
			}

			// If previous point is null, find the last valid point
			if (previousMovement.x === null || previousMovement.y === null) {
				for (let j = i - 1; j >= 0; j--) {
					if (dataTrail[j].x !== null && dataTrail[j].y !== null) {
						previousMovement = dataTrail[j];
						break;
					}
				}
				// If no valid previous point found, use current point as both
				if (previousMovement.x === null || previousMovement.y === null) {
					previousMovement = currentMovement;
				}
			}

			let comparisonPoint = this.drawUtils.createComparePoint(view, currentMovement, previousMovement);
			if (this.drawUtils.isVisible(comparisonPoint.cur.point, comparisonPoint.cur.pos, comparisonPoint.cur.point.stopLength)) {
				if (view === this.sk.SPACETIME) this.recordDot(comparisonPoint.cur);
				if (this.drawUtils.isStopped(comparisonPoint.cur.point.stopLength)) this.updateStopDrawing(comparisonPoint, view);
				else this.updateMovementDrawing(comparisonPoint, this.drawUtils.isStopped(comparisonPoint.prior.point.stopLength), this.style.thinStroke);
			} else {
				if (this.isDrawingLine) this.endLine();
			}
		}
		this.sk.endShape(); // End shape in case still drawing
	}

	/**
	 * Stops are draw as circles in floorPlan view
	 */
	updateStopDrawing(p, view) {
		if (view === this.sk.PLAN) {
			if (!this.drawUtils.isStopped(p.prior.point.stopLength)) this.drawStopCircle(p); // PriorPoint test makes sure to only draw a stop circle once
		} else this.updateMovementDrawing(p, !this.drawUtils.isStopped(p.prior.point.stopLength), this.style.fatStroke);
	}

	/**
	 * NOTE: stopTest can vary depending on if this method is called when updatingStopDrawing
	 */
	updateMovementDrawing(p, stopTest, stroke) {
		if (!this.isDrawingLine) this.beginLine(this.drawUtils.isStopped(p.cur.point.stopLength), this.drawUtils.setCodeColor(p.cur.point.codes));
		if (stopTest || this.isNewCode(p)) this.endThenBeginNewLine(p.prior.pos, stroke, this.drawUtils.setCodeColor(p.cur.point.codes));
		else this.sk.vertex(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, p.cur.pos.zPos); // if already drawing fat line, continue it
	}

	beginLine(pointIsStopped, color) {
		if (pointIsStopped) this.setLineStyle(this.style.fatStroke, color);
		else this.setLineStyle(this.style.thinStroke, color);
		this.sk.beginShape();
		this.isDrawingLine = true;
	}

	endLine() {
		this.sk.endShape();
		this.isDrawingLine = false;
	}

	endThenBeginNewLine(pos, weight, color) {
		this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
		this.sk.endShape();
		this.setLineStyle(weight, color);
		this.sk.beginShape();
		this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
	}

	/**
	 * NOTE: Stop circles can be drawn while also drawing within P5's curveVertex shape/method
	 * @param  {ComparePoint} p
	 */
	drawStopCircle(p) {
		this.setFillStyle(this.drawUtils.setCodeColor(p.cur.point.codes));
		const stopSize = this.sk.map(p.cur.point.stopLength, 0, maxStopLength, 5, this.largestStopPixelSize);
		this.sk.circle(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, stopSize);
		this.sk.noFill();
	}

	/**
	 * NOTE: Color value is used to determine if curPoint is a new code
	 * @param  {ComparePoint} p
	 */
	isNewCode(p) {
		return JSON.stringify(p.cur.point.codes) !== JSON.stringify(p.prior.point.codes);
		//return p.cur.point.codes.color !== p.prior.point.codes.color;
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
		this.setFillStyle(curDot.color);
		this.sk.circle(curDot.xPos, curDot.yPos, dotSize);
	}

	draw3DSpaceTimeDot(curDot) {
		this.setLineStyle(25, curDot.color);
		this.sk.point(curDot.xPos, curDot.yPos, curDot.zPos);
		this.sk.strokeWeight(2);
		this.sk.line(curDot.xPos, curDot.yPos, 0, curDot.xPos, curDot.yPos, curDot.zPos);
	}

	setLineStyle(weight, color) {
		this.sk.strokeWeight(weight);
		if (!isPathColorMode) this.sk.stroke(this.style.shade);
		else this.sk.stroke(color);
	}

	setFillStyle(color) {
		if (!isPathColorMode) this.sk.fill(this.style.shade);
		else this.sk.fill(color);
	}

	/**
	 * Tests if newDot has been created and updates current dot value and video scrub variable if so
	 * @param  {AugmentPoint} augmentPoint
	 */
	recordDot(augmentPoint) {
		const newDot = this.getNewDot(augmentPoint, this.dot);
		if (newDot !== null) {
			this.dot = newDot;
		}
	}

	/**
	 * Determines whether new dot should be created to display depending on animate, video or mouse position
	 * NOTE: returns null if no newDot is created
	 * @param  {Augmented Point} augmentedPoint
	 * @param  {Dot} curDot
	 */
	getNewDot(augmentedPoint, curDot) {
		const [xPos, yPos, zPos, timePos, map3DMouse, codeColor] = [
			augmentedPoint.pos.floorPlanXPos,
			augmentedPoint.pos.floorPlanYPos,
			augmentedPoint.pos.zPos,
			augmentedPoint.pos.selTimelineXPos,
			this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX),
			this.drawUtils.setCodeColor(augmentedPoint.point.codes)
		];
		if (this.sk.sketchController.getIsAnimate()) {
			return this.createDot(xPos, yPos, zPos, timePos, codeColor, null); // there is no length to compare when animating so just pass null to emphasize this
		} else if (this.sk.videoController.isLoadedAndIsPlaying()) {
			const videoPixelTime = timeline.mapTotalTimeToPixelTime(this.sk.videoController.getVideoPlayerCurTime());
			const videoSelectTime = this.sk.sketchController.mapSelectTimeToPixelTime(videoPixelTime);
			if (this.compareToCurDot(videoSelectTime, timePos, curDot))
				return this.createDot(xPos, yPos, zPos, timePos, codeColor, Math.abs(videoSelectTime - timePos));
		} else if (timeline.overTimeline(this.sk.mouseX) && this.compareToCurDot(map3DMouse, timePos, curDot)) {
			return this.createDot(xPos, yPos, zPos, map3DMouse, codeColor, Math.abs(map3DMouse - timePos));
		}
		return null;
	}

	compareToCurDot(pixelStart, pixelEnd, curDot) {
		let pixelAmountToCompare = this.sk.width; // if dot has not been set yet, compare to this width
		if (curDot !== null) pixelAmountToCompare = curDot.lengthToCompare;
		return pixelStart >= pixelEnd - pixelAmountToCompare && pixelStart <= pixelEnd + pixelAmountToCompare;
	}

	createDot(xPos, yPos, zPos, timePos, color, lengthToCompare) {
		return {
			xPos,
			yPos,
			zPos,
			timePos,
			color,
			lengthToCompare // used to compare data points to find closest dot value
		};
	}
}
