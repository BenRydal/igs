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
        this.setPathStyles(path.color);
        this.setDraw(this.sk.PLAN, path.movement);
        this.setDraw(this.sk.SPACETIME, path.movement);
        if (this.dot !== null) this.drawDot(this.dot);
    }

    setPathStyles(color) {
        this.sk.noFill(); // important for curve drawing
        this.style.shade = color;
        [this.style.thinStroke, this.style.fatStroke] = this.testPoint.selectModeForStrokeWeights();
    }

    setLineStyle(weight, color) {
        this.sk.strokeWeight(weight);
        // TODO: set color here?
        this.sk.stroke(color);
    }

    /**
     * Two ways to begin/end shapes
     * ONe is based on codes and allows for very separated shapes
     * Another is based on highlighting/isFatLine and ends current shape/begins new one immediately
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     */
    setDraw(view, movementArray) {
        let isDrawingCode = false; // controls stopping/ending of curve drawing when codes are loaded by user
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior indices
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]);
            if (this.testPoint.isShowingInGUI(p.curPos)) {
                if (p.curCodeIsShowing) {
                    if (view === this.sk.SPACETIME) this.recordDot(p.curPos);
                    if (!isDrawingCode) isDrawingCode = this.beginNewCodeDrawing(p.curIsFatLine, p.curPoint.codes.color);
                    if (this.testPoint.isPlanViewAndStopped(view, p.curPoint)) this.drawStopCircle(p); // you are able to draw circles between begin/end shape
                    else this.setFatLineDrawing(p);
                } else {
                    if (isDrawingCode) isDrawingCode = this.endCurCodeDrawing();

                }
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    /**
     * Begins drawing shape if code is showing and not already drawing, sets correct strokeweight and sets isDrawingCode to true
     */
    beginNewCodeDrawing(isFatLine, color) {
        if (isFatLine) this.setLineStyle(this.style.fatStroke, color);
        else this.setLineStyle(this.style.thinStroke, color);
        this.sk.beginShape();
        return true;
    }

    endCurCodeDrawing() {
        this.sk.endShape();
        return false;
    }

    /**
     * Can start/begin new line based on change in fat line or codes
     * NOTE: In web browsers lines must be segmented/ended to change thickness or stroke
     */
    setFatLineDrawing(p) {
        if (p.curIsFatLine) {
            if (!p.priorIsFatLine || this.isNewCode(p)) this.endThenBeginNewLine(p.priorPos, this.style.fatStroke, p.curPoint.codes.color);
            else this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos, p.curPos.zPos); // if already drawing in highlight mode, continue it
        } else {
            if (p.priorIsFatLine || this.isNewCode(p)) this.endThenBeginNewLine(p.priorPos, this.style.thinStroke, p.curPoint.codes.color);
            else this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos, p.curPos.zPos); // if already drawing in highlight mode, continue it
        }
    }

    isNewCode(p) {
        // if drawing path color, return true else
        return p.curPoint.codes.color !== p.priorPoint.codes.color;
    }

    /**
     * Ends and begins a new line with provided strokeWeight
     * NOTE: draw two vertices to indicate starting and ending points
     * @param  {Object returned from getScaledPos} pos
     * @param  {Integer} weight
     */
    endThenBeginNewLine(pos, weight, color) {
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
        this.sk.endShape();
        //TODO: add here?
        this.setLineStyle(weight, color);
        this.sk.beginShape();
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
    }

    drawStopCircle(p) {
        if (!p.priorPoint.isStopped) { // only draw stopped point once and only draw it if showing in codes
            //TODO: updated, add stroke
            //this.sk.fill(this.style.shade);
            this.sk.fill(p.curPoint.codes.color);
            this.sk.circle(p.curPos.viewXPos, p.curPos.floorPlanYPos, 9);
            this.sk.noFill();
        }
    }

    /**
     * A compare point augments current and prior points with screen pixel position variables and boolean indicating if the point passes code tests
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint 
     * @param  {MovementPoint} priorPoint 
     */
    createComparePoint(view, curPoint, priorPoint) {
        const curPos = this.testPoint.getScaledPos(curPoint, view);
        const priorPos = this.testPoint.getScaledPos(priorPoint, view);
        return {
            curPoint,
            curPos,
            curCodeIsShowing: this.testPoint.isShowingInCodeList(curPoint),
            curIsFatLine: this.testPoint.selectModeForFatLine(curPos, curPoint),
            priorPoint,
            priorPos,
            priorCodeIsShowing: this.testPoint.isShowingInCodeList(priorPoint),
            priorIsFatLine: this.testPoint.selectModeForFatLine(priorPos, priorPoint)
        }
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