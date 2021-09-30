class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.testPoint = new TestPoint(this.sk);
        this.dot = null; // represents user selection dot drawn in both floor plan and space-time views
        this.style = {
            shade: null,
            thinStroke: null,
            fatStroke: null
        }
    }

    setData(path) {
        this.dot = null; // reset dot
        this.setPathStyles(path.color);
        this.setDraw(this.sk.PLAN, path.movement);
        this.setDraw(this.sk.SPACETIME, path.movement);
        if (this.dot !== null) this.drawDot(this.dot);
    }

    setPathStyles(color) {
        this.style.shade = color;
        [this.style.thinStroke, this.style.fatStroke] = this.testPoint.selectModeForStrokeWeights();
    }

    resetLineStyles() {
        this.sk.strokeWeight(this.style.thinStroke);
        this.sk.stroke(this.style.shade);
        this.sk.noFill(); // important for curve drawing
    }

    /**
     * Holds logic for drawing line segments depending on thick vs. thin line drawing and code tests
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     */
    setDraw(view, movementArray) {
        let isDrawing = true; // controls stopping/ending of curve drawing when codes are loaded by user
        let isFatLine; // controls how lines are segmented to be able to change strokeWeights within curveVertex
        let isFirstPoint = true; // set to false when first point that is showing is drawn
        this.resetLineStyles();
        this.sk.beginShape();
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior indices
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]);
            if (this.testPoint.isShowing(p.curPos)) {
                if (isFirstPoint) {
                    isFirstPoint = false;
                    if (p.curPoint.isStopped) isFatLine = false;
                    else isFatLine = true;
                }
                if (p.curCodeIsShowing) {
                    if (view === this.sk.SPACETIME) this.recordDot(p.curPos);
                    if (!isDrawing) isDrawing = this.beginDrawing(isFatLine);
                    isFatLine = this.organizeDrawing(isFatLine, p, view);
                } else {
                    if (isDrawing) isDrawing = this.endDrawing();
                }
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    /**
     * Holds logic for testing each compare point object that organizes drawing methods and updating isFatLine var
     * NOTE: In web browsers lines must be segmented/ended to change thickness or stroke
     */
    organizeDrawing(isFatLine, p, view) {
        if (this.testPoint.isPlanViewAndStopped(view, p.curPoint)) {
            if (!p.priorPoint.isStopped && p.curCodeIsShowing) this.drawStopCircle(p.curPos); // only draw stopped point once and only draw it if showing in codes
        } else {
            if (this.testPoint.selectModeForFatLine(p)) {
                this.setFatLine(isFatLine, p);
                isFatLine = true;
            } else {
                this.setThinLine(isFatLine, p);
                isFatLine = false;
            }
        }
        return isFatLine;
    }
    /**
     * A compare point augments current and prior points with screen pixel position variables and boolean indicating if the point passes code tests
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint 
     * @param  {MovementPoint} priorPoint 
     */
    createComparePoint(view, curPoint, priorPoint) {
        return {
            curPoint,
            curPos: this.testPoint.getScaledPos(curPoint, view),
            curCodeIsShowing: this.testPoint.passCodeTest(curPoint),
            priorPoint,
            priorPos: this.testPoint.getScaledPos(priorPoint, view),
            priorCodeIsShowing: this.testPoint.passCodeTest(priorPoint)
        }
    }

    /**
     * Ends drawing shape if code is not showing and sets isDrawing to false
     */
    endDrawing() {
        this.sk.endShape();
        return false;
    }

    /**
     * Begins drawing shape if code is showing and not already drawing, sets correct strokeweight and sets isDrawing to true
     */
    beginDrawing(isFatLine) {
        this.sk.beginShape();
        if (isFatLine) this.sk.strokeWeight(this.style.fatStroke);
        else this.sk.strokeWeight(this.style.thinStroke);
        return true;
    }
    /**
     * Continues drawing or begins new line with potential to have fat strokeWeight
     */
    setFatLine(isFatLine, p) {
        if (isFatLine) this.drawVertexOrNewLine(p, this.style.fatStroke);
        else this.setNewLine(p, this.style.fatStroke);
    }
    /**
     * Continues drawing or begins new line with potential to have thin strokeWeight
     */
    setThinLine(isFatLine, p) {
        if (!isFatLine) this.drawVertexOrNewLine(p, this.style.thinStroke);
        else this.setNewLine(p, this.style.thinStroke);
    }
    /**
     * Determines whether to draw new line with no strokeWeight or provided strokeWeight based on code test
     */
    setNewLine(p, stroke) {
        if (!p.curCodeIsShowing) this.drawNewLine(p.priorPos, 0);
        else this.drawNewLine(p.priorPos, stroke); // if drawing in highlight mode, end it
    }

    /**
     * Determines whether to continue drawing current line or begin new line with either 0 or provided strokeWeight based on code test
     */
    drawVertexOrNewLine(p, stroke) {
        if (!p.curCodeIsShowing) {
            if (!p.priorCodeIsShowing) this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos, p.curPos.zPos); // if already drawing no line
            else this.drawNewLine(p.priorPos, 0); // if curPoint has no code and not already drawing no line
        } else {
            if (!p.priorCodeIsShowing) this.drawNewLine(p.priorPos, stroke);
            else this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos, p.curPos.zPos); // if already drawing in highlight mode, continue it
        }
    }

    drawStopCircle(curPos) {
        this.sk.fill(this.style.shade);
        this.sk.circle(curPos.viewXPos, curPos.floorPlanYPos, 9);
        this.sk.noFill();
    }

    /**
     * Ends and begins a new line with provided strokeWeight
     * NOTE: draw two vertices to indicate starting and ending points
     * @param  {Object returned from getScaledPos} pos
     * @param  {Integer} weight
     */
    drawNewLine(pos, weight) {
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos); // draw cur point twice to mark end point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.beginShape();
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos); // draw cur point twice to mark starting point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
    }
    /**
     * Tests if newDot has been created and updated current dot value and video scrub variable if so
     * @param  {Object returned from getScaledPos} curPos
     */
    recordDot(curPos) {
        const newDot = this.testPoint.getNewDot(curPos, this.dot);
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
        this.sk.fill(this.style.shade);
        this.sk.circle(curDot.xPos, curDot.yPos, dotSize);
    }

    draw3DSpaceTimeDot(curDot) {
        this.sk.stroke(this.style.shade);
        this.sk.strokeWeight(25);
        this.sk.point(curDot.xPos, curDot.yPos, curDot.zPos);
        this.sk.strokeWeight(2);
        this.sk.line(curDot.xPos, curDot.yPos, 0, curDot.xPos, curDot.yPos, curDot.zPos);
    }
}