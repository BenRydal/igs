/**
 * This class provides a set of custom methods to draw movement data in floorPlan and space-time views of the IGS.
 * Many of the methods address specific browser constraints and balance aesthetic and efficient curve drawing needs
 * For example, using the "line" method in a library like P5 is inefficient and curveVertex increases efficiency significantly but
 * the tradeoff is the need for more customized methods and conditional structures to handle starting/begining lines/shapes
 */

export class DrawMovement {
	constructor(sketch, drawUtils) {
		this.sk = sketch;
		this.drawUtils = drawUtils;
		this.dot = null;
		this.isDrawingLine = false;
		this.style = {
			shade: null,
			thinStroke: 1,
			fatStroke: 9,
			stopSize: 10
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
			const previousMovement = dataTrail[i - 1];
			if (currentMovement.x === null) continue; // TODO: This is a temporary fix for points that have conversation values but no x/y positions

			let comparisonPoint = this.drawUtils.createComparePoint(view, currentMovement, previousMovement, currentMovement.time, previousMovement.time);
			if (this.drawUtils.isVisible(comparisonPoint.cur.point, comparisonPoint.cur.pos)) {
				if (view === this.sk.SPACETIME) this.recordDot(comparisonPoint.cur);
				if (comparisonPoint.cur.point.isStopped) this.updateStopDrawing(comparisonPoint, view);
				else this.updateMovementDrawing(comparisonPoint, comparisonPoint.prior.point.isStopped, this.style.thinStroke);
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
			if (!p.prior.point.isStopped) this.drawStopCircle(p); // PriorPoint test makes sure to only draw a stop circle once
		} else this.updateMovementDrawing(p, !p.prior.point.isStopped, this.style.fatStroke);
	}

	/**
	 * NOTE: stopTest can vary depending on if this method is called when updatingStopDrawing
	 */
	updateMovementDrawing(p, stopTest, stroke) {
		if (!this.isDrawingLine) this.beginLine(p.cur.point.isStopped, p.cur.point.codes.color);
		if (stopTest || this.isNewCode(p)) this.endThenBeginNewLine(p.prior.pos, stroke, p.cur.point.codes.color);
		else this.sk.vertex(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, p.cur.pos.zPos); // if already drawing fat line, continue it
	}

	beginLine(isStopped, color) {
		if (isStopped) this.setLineStyle(this.style.fatStroke, color);
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
		this.setFillStyle(p.cur.point.codes.color);
		this.sk.circle(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, this.style.stopSize);
		this.sk.noFill();
	}

	/**
	 * NOTE: Color value is used to determine if curPoint is a new code
	 * @param  {ComparePoint} p
	 */
	isNewCode(p) {
		return p.cur.point.codes.color !== p.prior.point.codes.color;
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
		if (this.sk.sketchController.getIsPathColorMode()) this.sk.stroke(this.style.shade);
		else this.sk.stroke(color);
	}

	setFillStyle(color) {
		if (this.sk.sketchController.getIsPathColorMode()) this.sk.fill(this.style.shade);
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
			augmentedPoint.point.codes.color
		];
		if (this.sk.sketchController.getIsAnimate()) {
			return this.createDot(xPos, yPos, zPos, timePos, codeColor, null); // there is no length to compare when animating so just pass null to emphasize this
		} else if (this.sk.videoController.isLoadedAndIsPlaying()) {
			const videoPixelTime = this.sk.sketchController.mapTotalTimeToPixelTime(this.sk.videoController.getVideoPlayerCurTime());
			const videoSelectTime = this.sk.sketchController.mapSelectTimeToPixelTime(videoPixelTime);
			if (this.compareToCurDot(videoSelectTime, timePos, curDot))
				return this.createDot(xPos, yPos, zPos, timePos, codeColor, Math.abs(videoSelectTime - timePos));
		} else if (this.sk.sketchController.overTimeline() && this.compareToCurDot(map3DMouse, timePos, curDot)) {
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
