class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.testPoint = new TestPoint(this.sk);
        this.bug = { // represents user selection dot drawn in both floor plan and space-time views
            xPos: null, // number/float values
            yPos: null,
            zPos: null,
            timePos: null,
            size: this.sk.width / 50,
            lengthToCompare: this.sk.width, // used to compare data points to find closest bug value
            isSelected: false
        };
        this.style = {
            shade: null,
            thinStroke: null,
            fatStroke: null
        }
    }

    setData(path) {
        this.resetBug();
        this.setPathStyles(path.color);
        this.setDraw(this.sk.PLAN, path.movement);
        this.setDraw(this.sk.SPACETIME, path.movement);
        if (this.bug.isSelected) this.drawBug();
    }

    setPathStyles(color) {
        this.style.shade = color;
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 3:
                this.setPathStrokeWeights(1, 0);
                break;
            case 4:
                this.setPathStrokeWeights(0, 9);
                break;
            default:
                this.setPathStrokeWeights(1, 9);
                break;
        }
    }

    setPathStrokeWeights(thin, fat) {
        this.style.thinStroke = thin;
        this.style.fatStroke = fat;
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
                    if (view === this.sk.SPACETIME) this.testPointForBug(p.curPos);
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

    testPointForBug(curPos) {
        const [timePos, xPos, yPos, zPos] = [curPos.selTimelineXPos, curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.zPos];
        const map3DMouse = this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX);
        if (this.sk.sketchController.mode.isAnimate) this.recordBug(timePos, xPos, yPos, zPos, null); // always return true to set last/most recent point as the bug
        else if (this.sk.sketchController.mode.isVideoPlay) {
            const selTime = this.sk.sketchController.mapVideoTimeToSelectedTime();
            if (this.compareValuesBySpacing(selTime, timePos, this.bug.lengthToCompare)) this.recordBug(timePos, xPos, yPos, zPos, Math.abs(selTime - timePos));
        } else if (this.sk.gui.timelinePanel.aboveTimeline(this.sk.mouseX, this.sk.mouseY) && this.compareValuesBySpacing(map3DMouse, timePos, this.bug.lengthToCompare)) this.recordBug(map3DMouse, xPos, yPos, zPos, Math.abs(map3DMouse - timePos));
    }

    compareValuesBySpacing(value1, value2, spacing) {
        return value1 >= value2 - spacing && value1 <= value2 + spacing;
    }

    resetBug() {
        this.bug.xPos = null;
        this.bug.yPos = null;
        this.bug.zPos = null;
        this.bug.timePos = null;
        this.bug.lengthToCompare = this.sk.width;
        this.bug.isSelected = false;
    }

    recordBug(timePos, xPos, yPos, zPos, lengthToCompare) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
        this.bug.zPos = zPos;
        this.bug.timePos = timePos;
        this.bug.lengthToCompare = lengthToCompare;
        this.bug.isSelected = true;
        this.sk.sketchController.bugTimeForVideoScrub = timePos;
    }

    drawBug() {
        this.sk.stroke(0);
        this.sk.strokeWeight(5);
        this.sk.fill(this.style.shade);
        this.sk.ellipse(this.bug.xPos, this.bug.yPos, this.bug.size, this.bug.size);
        if (this.sk.sketchController.handle3D.getIsShowing()) {
            this.sk.stroke(this.style.shade);
            this.sk.strokeWeight(25);
            this.sk.point(this.bug.xPos, this.bug.yPos, this.bug.zPos);
            this.sk.strokeWeight(2);
            this.sk.line(this.bug.xPos, this.bug.yPos, 0, this.bug.xPos, this.bug.yPos, this.bug.zPos);
        } else this.sk.ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }
}