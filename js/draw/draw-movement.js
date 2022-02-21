/**
 * This class provides a set of custom methods to draw movement data in floorPlan and space-time views of the IGS.
 * Many of the methods address specific browser constraints and balance aesthetic and efficient curve drawing needs
 * For example, using the "line" method in a library like P5 is inefficient and curveVertex increases efficiency significantly but 
 * the tradeoff is the need for more customized methods and conditional structures to handle starting/begining lines/shapes
 */
class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.testPoint = new TestPoint(this.sk);
        this.dot = null; // represents user selection dot drawn in both floor plan and space-time views
        this.isDrawingLine = false; // boolean controls start/end line segment drawing based on code file and GUI selections
        this.style = {
            shade: null,
            thinStroke: 1,
            fatStroke: 9,
            stopSize: 10
        }
    }

    setData(path) {
        this.dot = null; // reset 
        this.sk.noFill(); // important for curveVertex drawing
        this.style.shade = path.color.pathMode;
        this.setDraw(this.sk.PLAN, path.movement);
        this.setDraw(this.sk.SPACETIME, path.movement);
        if (this.dot !== null) this.drawDot(this.dot);
    }

    /**
     * Organizes segmentation of line drawing to draw lines with varying strokes, thickness etc.
     * NOTE: stops are drawn as circles in floorPlan view
     * NOTE: 2 things determine line segmentation: 1) change from stop to movement and 2) whether point is visible (e.g., selected, highlighted etc.)
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     */
    setDraw(view, movementArray) {
        this.isDrawingLine = false; // always reset
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior indices
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]); // a compare point consists of current and prior augmented points
            if (this.isVisible(p.cur)) {
                if (view === this.sk.SPACETIME) this.recordDot(p.cur);
                if (p.cur.point.isStopped) this.updateStopDrawing(p, view);
                else this.updateMovementDrawing(p, p.prior.point.isStopped, this.style.thinStroke);
            } else {
                if (this.isDrawingLine) this.endLine();
            }
        }
        this.sk.endShape(); // end shape in case still drawing
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

    /**
     * Holds tests for determining if point is visible (e.g., selected, highlighted)
     * @param  {AugmentPoint} augmentPoint
     */
    isVisible(augmentPoint) {
        return (this.testPoint.isShowingInGUI(augmentPoint.pos.timelineXPos) && this.testPoint.isShowingInCodeList(augmentPoint.point.codes.array) && this.testPoint.selectMode(augmentPoint.pos, augmentPoint.point.isStopped));
    }

    /**
     * A compare point is an object with two augmented points
     * @param  {Integer} view
     * @param  {MovementPoint} curIndex 
     * @param  {MovementPoint} priorIndex 
     */
    createComparePoint(view, curIndex, priorIndex) {
        return {
            cur: this.createAugmentPoint(view, curIndex),
            prior: this.createAugmentPoint(view, priorIndex)
        }
    }

    createAugmentPoint(view, point) {
        return {
            point,
            pos: this.getScaledMovementPos(point, view)
        }
    }

    /**
     * Tests if newDot has been created and updates current dot value and video scrub variable if so
     * @param  {AugmentPoint} augmentPoint
     */
    recordDot(augmentPoint) {
        const newDot = this.getNewDot(augmentPoint, this.dot);
        if (newDot !== null) {
            this.dot = newDot;
            this.sk.sketchController.setDotTimeForVideoScrub(this.dot.timePos);
        }
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
     * @param  {MovementPoint} point
     * @param  {Integer} view
     */
    getScaledMovementPos(point, view) {
        const pos = this.testPoint.getSharedPosValues(point);
        return {
            timelineXPos: pos.timelineXPos,
            selTimelineXPos: pos.selTimelineXPos,
            floorPlanXPos: pos.floorPlanXPos,
            floorPlanYPos: pos.floorPlanYPos,
            viewXPos: this.getViewXPos(view, pos.floorPlanXPos, pos.selTimelineXPos),
            zPos: this.getZPos(view, pos.selTimelineXPos)
        };
    }

    getViewXPos(view, floorPlanXPos, selTimelineXPos) {
        if (view === this.sk.PLAN) return floorPlanXPos;
        else {
            if (this.sk.handle3D.getIs3DMode()) return floorPlanXPos;
            else return selTimelineXPos;
        }
    }

    getZPos(view, selTimelineXPos) {
        if (view === this.sk.PLAN) return 0;
        else {
            if (this.sk.handle3D.getIs3DMode()) return selTimelineXPos;
            else return 0;
        }
    }

    /**
     * Determines whether new dot should be created to display depending on animate, video or mouse position
     * NOTE: returns null if no newDot is created
     * @param  {Augmented Point} augmentedPoint
     * @param  {Dot} curDot
     */
    getNewDot(augmentedPoint, curDot) {
        const [xPos, yPos, zPos, timePos, map3DMouse, codeColor] = [augmentedPoint.pos.floorPlanXPos, augmentedPoint.pos.floorPlanYPos, augmentedPoint.pos.zPos, augmentedPoint.pos.selTimelineXPos, this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX), augmentedPoint.point.codes.color];
        if (this.sk.sketchController.getIsAnimate()) {
            return this.createDot(xPos, yPos, zPos, timePos, codeColor, null); // pass null as this means most recent point will always create Dot object
        } else if (this.sk.sketchController.getIsVideoPlay()) {
            const videoToSelectTime = this.sk.sketchController.mapVideoTimeToSelectedTime();
            if (this.compareToCurDot(videoToSelectTime, timePos, curDot)) return this.createDot(xPos, yPos, zPos, timePos, codeColor, Math.abs(videoToSelectTime - timePos));
        } else if (this.sk.gui.timelinePanel.overTimeline() && this.compareToCurDot(map3DMouse, timePos, curDot)) {
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
        }
    }
}