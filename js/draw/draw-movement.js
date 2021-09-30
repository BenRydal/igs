class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.testPoint = new TestPoint(this.sk);
        this.bug = null; // represents user selection dot drawn in both floor plan and space-time views
        this.style = {
            shade: null,
            thinStroke: null,
            fatStroke: null
        }
    }

    setData(path) {
        this.bug = null; // reset bug
        this.setPathStyles(path.color);
        this.setDraw(this.sk.PLAN, path.movement);
        this.setDraw(this.sk.SPACETIME, path.movement);
        if (this.bug !== null) this.drawBug(this.bug);
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
     * 
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     */
    setDraw(view, movementArray) {
        let isDrawing = true; // controls stopping/ending of curve drawing when codes are loaded by user
        let isFatLine; // controls how lines are segmented to be able to change strokeWeights within curveVertex
        let isFirstPoint = true; // set to false when first point that is showing is drawn
        this.resetLineStyles();
        this.sk.beginShape();
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior points
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]);
            if (this.testPoint.isShowing(p.curPos)) {
                if (isFirstPoint) {
                    [isFatLine, isFirstPoint] = this.setVarsForFirstPoint(p.curPoint.isStopped);
                }
                if (this.testPoint.passCodeTest(p.curPoint)) {
                    if (!isDrawing) isDrawing = this.beginDrawing(isFatLine);
                    if (view === this.sk.SPACETIME) this.recordBug(p.curPos);
                    isFatLine = this.organizeDrawing(isFatLine, p, view);
                } else {
                    if (isDrawing) isDrawing = this.endDrawing();
                }
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }
    /**
     * First return value sets isFatLine and second sets isFirstPoint to false 
     */
    setVarsForFirstPoint(curPointIsStopped) {
        if (curPointIsStopped) return [false, false];
        else return [true, false];
    }

    endDrawing() {
        this.sk.endShape();
        return false;
    }

    beginDrawing(isFatLine) {
        this.sk.beginShape();
        if (isFatLine) this.sk.strokeWeight(this.style.fatStroke);
        else this.sk.strokeWeight(this.style.thinStroke);
        return true;
    }

    /**
     * Holds logic for testing each compare point object that organizes drawing methods and updating isFatLine var
     * NOTE: In web browsers lines must be segmented/ended to change thickness or stroke
     * @param  {boolean} isFatLine
     * @param  {ComparePoint} p
     * @param  {integer} view
     */
    organizeDrawing(isFatLine, p, view) {
        if (this.testPoint.isPlanViewAndStopped(view, p.curPoint)) {
            if (!p.priorPoint.isStopped && this.testPoint.passCodeTest(p.curPoint)) this.drawStopCircle(p.curPos); // only draw stopped point once and only draw it if showing in codes
        } else {
            if (this.testPoint.selectModeForFatLine(p)) {
                this.drawFatLine(isFatLine, p);
                isFatLine = true;
            } else {
                this.drawThinLine(isFatLine, p);
                isFatLine = false;
            }
        }
        return isFatLine;
    }
    /**
     * A compare point holds current and prior points as well as screen pixel positions
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint 
     * @param  {MovementPoint} priorPoint 
     */
    createComparePoint(view, curPoint, priorPoint) {
        return {
            curPoint,
            curPos: this.testPoint.getScaledPos(curPoint, view),
            priorPoint,
            priorPos: this.testPoint.getScaledPos(priorPoint, view)
        }
    }

    drawStopCircle(curPos) {
        this.sk.fill(this.style.shade);
        this.sk.circle(curPos.viewXPos, curPos.floorPlanYPos, 9);
        this.sk.noFill();
    }

    drawFatLine(isFatLine, p) {
        if (isFatLine) this.setVertexOrNewLine(p, this.style.fatStroke);
        else this.setNewLine(p, this.style.fatStroke);
    }

    drawThinLine(isFatLine, p) {
        if (!isFatLine) this.setVertexOrNewLine(p, this.style.thinStroke);
        else this.setNewLine(p, this.style.thinStroke);
    }

    setNewLine(p, stroke) {
        if (!this.testPoint.passCodeTest(p.curPoint)) this.drawNewLine(p.priorPos, 0);
        else this.drawNewLine(p.priorPos, stroke); // if drawing in highlight mode, end it
    }

    setVertexOrNewLine(p, stroke) {
        if (!this.testPoint.passCodeTest(p.curPoint)) {
            if (!this.testPoint.passCodeTest(p.priorPoint)) this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos, p.curPos.zPos); // if already drawing no line
            else this.drawNewLine(p.priorPos, 0); // if curPoint has no code and not already drawing no line
        } else {
            if (!this.testPoint.passCodeTest(p.priorPoint)) this.drawNewLine(p.priorPos, stroke);
            else this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos, p.curPos.zPos); // if already drawing in highlight mode, continue it
        }
    }

    /**
     * Ends and begins a new line with styles, NOTE: draws two vertices to indicate starting and ending points
     * @param  {curPos Object from getScaledPos} pos
     * @param  {Integer} weight
     */
    drawNewLine(pos, weight) {
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos); // draw cur point twice to mark end point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(this.style.shade);
        this.sk.beginShape();
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos); // draw cur point twice to mark starting point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos, pos.zPos);
    }

    recordBug(curPos) {
        const newBugValue = this.testPoint.setNewBugValue(curPos, this.bug);
        if (newBugValue !== null) {
            this.bug = newBugValue;
            this.sk.sketchController.bugTimeForVideoScrub = this.bug.timePos;
        }
    }

    drawBug(curBug) {
        this.sk.stroke(0);
        this.sk.strokeWeight(5);
        this.sk.fill(this.style.shade);
        this.sk.ellipse(curBug.xPos, curBug.yPos, curBug.size, curBug.size);
        if (this.sk.sketchController.handle3D.getIsShowing()) {
            this.sk.stroke(this.style.shade);
            this.sk.strokeWeight(25);
            this.sk.point(curBug.xPos, curBug.yPos, curBug.zPos);
            this.sk.strokeWeight(2);
            this.sk.line(curBug.xPos, curBug.yPos, 0, curBug.xPos, curBug.yPos, curBug.zPos);
        } else this.sk.ellipse(curBug.timePos, curBug.yPos, curBug.size, curBug.size);
    }
}