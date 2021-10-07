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
            if (this.testPoint.isShowingInGUI(p.cur.pos)) {
                if (p.cur.codeIsShowing) {
                    if (view === this.sk.SPACETIME) this.recordDot(p.cur.pos);
                    if (!isDrawingCode) isDrawingCode = this.beginNewCodeDrawing(p.cur.isFatLine, p.cur.point.codes.color);
                    if (this.testPoint.isPlanViewAndStopped(view, p.cur.point.isStopped)) this.drawStopCircle(p); // you are able to draw circles between begin/end shape
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
        if (p.cur.isFatLine) {
            if (!p.prior.isFatLine || this.isNewCode(p)) this.endThenBeginNewLine(p.prior.pos, this.style.fatStroke, p.cur.point.codes.color);
            else this.sk.vertex(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, p.cur.pos.zPos); // if already drawing fat line, continue it
        } else {
            if (p.prior.isFatLine || this.isNewCode(p)) this.endThenBeginNewLine(p.prior.pos, this.style.thinStroke, p.cur.point.codes.color);
            else this.sk.vertex(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, p.cur.pos.zPos); // if already drawing thin line, continue it
        }
    }

    isNewCode(p) {
        // if drawing path color, return true else
        return p.cur.point.codes.color !== p.prior.point.codes.color;
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
        if (!p.prior.point.isStopped) { // only draw stopped point once and only draw it if showing in codes
            //TODO: updated, add stroke
            //this.sk.fill(this.style.shade);
            this.sk.fill(p.cur.point.codes.color);
            this.sk.circle(p.cur.pos.viewXPos, p.cur.pos.floorPlanYPos, 9);
            this.sk.noFill();
        }
    }

    /**
     * A compare point augments current and prior points with screen pixel position variables and boolean indicating if the point passes code tests
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
        const pos = this.testPoint.getScaledPos(point, view);
        return {
            point,
            pos,
            codeIsShowing: this.testPoint.isShowingInCodeList(point),
            isFatLine: this.testPoint.selectModeForFatLine(pos, point)
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