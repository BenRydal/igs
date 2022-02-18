/**
 * This class provides a set of methods to draw highly customized lines in both floor plan and space-time views of the IGS.
 * Many of the methods address specific browser constraints and balance drawing curves efficiently and aesthetically meaningfully
 * For example, using the "line" method in a library like P5 is inefficient and curveVertex increases efficiency tremendously but 
 * the tradeoff is more customized methods and conditional structures to handle starting/begining lines/shapes
 */
class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.testPoint = new TestPoint(this.sk);
        this.dot = null; // represents user selection dot drawn in both floor plan and space-time views
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
     * Organizes segmentation of line drawing based on a variety of conditions
     * There are 2 primary ways to start / end lines:
     3 ways to change line thickness / color:
         1) code changes
     2) stop - movement changes
     3) highlight selection(different logic ? )
     * point is stopped or moving this boolean is tested to draw distinct line segments adjacent in space and time
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     */

    setDraw(view, movementArray) {
        let isDrawingLine = false; // controls beginning/ending lines based on user loaded codes and select methods
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior indices
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]); // a compare point consists of current and prior augmented points
            if (this.testPoint.isShowingInGUI(p.cur.pos.timelineXPos)) {
                if (p.cur.codeIsShowing && this.testPoint.selectMode(p.cur.point.isStopped)) {
                    if (view === this.sk.SPACETIME) this.recordDot(p.cur);

                    if (p.cur.point.isStopped) {
                        if (view === this.sk.PLAN) this.drawStopCircle(p);
                        else {
                            if (!isDrawingLine) isDrawingLine = this.beginLine(p.cur.point.isStopped, p.cur.point.codes.color);
                            if (!p.prior.point.isStopped || this.isNewCode(p)) this.endThenBeginNewLine(p.prior.pos, this.style.fatStroke, p.cur.point.codes.color);
                            else this.sk.vertex(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, p.cur.pos.zPos); // if already drawing fat line, continue it
                        }
                    } else {
                        if (!isDrawingLine) isDrawingLine = this.beginLine(p.cur.point.isStopped, p.cur.point.codes.color);
                        if (p.prior.point.isStopped || this.isNewCode(p)) this.endThenBeginNewLine(p.prior.pos, this.style.thinStroke, p.cur.point.codes.color);
                        else this.sk.vertex(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, p.cur.pos.zPos); // if already drawing thin line, continue it
                    }
                } else {
                    if (isDrawingLine) isDrawingLine = this.endLine();
                }
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    /**
     * Begins drawing shape based on code segmentation
     * Sets strokeweight based on isStopped and returns value to update isDrawingCode
     */
    beginLine(isStopped, color) {
        if (isStopped) this.setLineStyle(this.style.fatStroke, color);
        else this.setLineStyle(this.style.thinStroke, color);
        this.sk.beginShape();
        return true;
    }

    /**
     * Ends drawing shape based on code segmentation and returns value to update isDrawingCode
     */
    endLine() {
        this.sk.endShape();
        return false;
    }

    /**
     * Ends and begins a new line, passes values to set strokeweight and color for new line
     * @param  {Object returned from getScaledMovementPos} pos
     * @param  {Integer} weight
     */
    endThenBeginNewLine(pos, weight, color) {
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
        this.sk.endShape();
        this.setLineStyle(weight, color);
        this.sk.beginShape();
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
    }

    /**
     * Stops are drawn as circles. These circles can be drawn while also drawing with P5's curveVertex method
     * Testing if the priorPoit is stopped is to only draw a stop once
     * @param  {ComparePoint} p
     */
    drawStopCircle(p) {
        if (!p.prior.point.isStopped) {
            this.setFillStyle(p.cur.point.codes.color);
            this.sk.circle(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, this.style.stopSize);
            this.sk.noFill();
        }
    }

    /**
     * Color value is used to determine if curPoint is a new code
     * @param  {ComparePoint} p
     */
    isNewCode(p) {
        return p.cur.point.codes.color !== p.prior.point.codes.color;
    }

    /**
     * A compare point augments current and prior points with screen pixel position variables and booleans indicating if the point passes code and selection tests
     * @param  {Integer} view
     * @param  {MovementPoint} curIndex 
     * @param  {MovementPoint} priorIndex 
     */
    createComparePoint(view, curIndex, priorIndex) {
        return {
            cur: this.augmentPoint(view, curIndex),
            prior: this.augmentPoint(view, priorIndex)
        }
    }

    augmentPoint(view, point) {
        return {
            point,
            pos: this.getScaledMovementPos(point, view),
            codeIsShowing: this.testPoint.isShowingInCodeList(point.codes.array)
        }
    }

    /**
     * Tests if newDot has been created and updates current dot value and video scrub variable if so
     * @param  {Object returned from getScaledMovementPos} curPos
     */
    recordDot(augmentedPoint) {
        const newDot = this.getNewDot(augmentedPoint, this.dot);
        if (newDot !== null) {
            this.dot = newDot;
            this.sk.sketchController.setDotTimeForVideoScrub(this.dot.timePos);
        }
    }

    drawDot(curDot) {
        const dotSize = this.sk.width / 50;
        this.drawFloorPlanDot(curDot, dotSize);
        if (this.sk.sketchController.handle3D.getIsShowing()) this.draw3DSpaceTimeDot(curDot);
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
            if (this.sk.sketchController.handle3D.getIsShowing()) return floorPlanXPos;
            else return selTimelineXPos;
        }
    }

    getZPos(view, selTimelineXPos) {
        if (view === this.sk.PLAN) return 0;
        else {
            if (this.sk.sketchController.handle3D.getIsShowing()) return selTimelineXPos;
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
        } else if (this.sk.sketchController.mode.isVideoPlay) {
            const videoToSelectTime = this.sk.sketchController.mapVideoTimeToSelectedTime();
            if (this.compareToCurDot(videoToSelectTime, timePos, curDot)) return this.createDot(xPos, yPos, zPos, timePos, codeColor, Math.abs(videoToSelectTime - timePos));
        } else if (this.sk.sketchController.testTimeline() && this.compareToCurDot(map3DMouse, timePos, curDot)) {
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