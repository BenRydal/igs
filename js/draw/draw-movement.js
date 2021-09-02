class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.bug = { // represents user selection dot drawn in both floor plan and space-time views
            xPos: null, // number/float values
            yPos: null,
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
        switch (this.sk.gui.getCurSelectTab()) {
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
     * Loops through movement points and sends to helper methods to draw each point
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     */
    setDraw(view, movementArray) {
        let isFatLine = false; // controls how lines are segmented to draw different strokeWeights
        this.resetLineStyles();
        this.sk.beginShape();
        for (let i = 1; i < movementArray.length; i++) { // Start at 1 to test cur and prior points
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]); // create object to hold current and prior points as well as pixel positions
            if (this.sk.sketchController.testPointIsShowing(p.curPos)) isFatLine = this.testComparePoint(isFatLine, p, view); // test and draw point and return updated isFatLine var
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    /**
     * Holds logic for testing each compare point object that organizes drawing methods and updating isFatLine var
     * NOTE: In web browsers lines must be segmented/ended to change thickness or stroke
     * @param  {boolean} isFatLine
     * @param  {ComparePoint} p
     * @param  {integer} view
     */
    testComparePoint(isFatLine, p, view) {
        if (view === this.sk.SPACETIME) this.testPointForBug(p.curPos);
        if (this.testDrawFloorPlanStops(view, p.curPoint)) {
            if (!p.priorPoint.isStopped) this.drawStopCircle(p.curPos); // only draw stopped point once
        } else {
            if (this.testDrawFatLine(p)) {
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
     * Holds current and prior MovementPoint objects and also pixel position objects for each point
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint 
     * @param  {MovementPoint} priorPoint 
     */
    createComparePoint(view, curPoint, priorPoint) {
        return {
            curPoint,
            curPos: this.sk.sketchController.getScaledPos(curPoint, view),
            priorPoint,
            priorPos: this.sk.sketchController.getScaledPos(priorPoint, view)
        }
    }
    /**
     * Holds logic for testing whether to draw stops on the floor plan
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint
     */
    testDrawFloorPlanStops(view, curPoint) {
        return (view === this.sk.PLAN && curPoint.isStopped && this.sk.gui.getCurSelectTab() !== 3);
    }
    /**
     * Holds logic for testing current point based on selectMode
     * @param  {ComparePoint} p
     */
    testDrawFatLine(p) {
        if (this.sk.gui.getCurSelectTab() === 1) return this.sk.gui.overCursor(p.curPos.floorPlanXPos, p.curPos.floorPlanYPos);
        else if (this.sk.gui.getCurSelectTab() === 2) return this.sk.gui.overSlicer(p.curPos.floorPlanXPos, p.curPos.floorPlanYPos);
        else return p.curPoint.isStopped;
    }

    drawStopCircle(curPos) {
        this.sk.fill(this.style.shade);
        this.sk.circle(curPos.viewXPos, curPos.floorPlanYPos, 9);
        this.sk.noFill();
    }

    drawFatLine(isFatLine, p) {
        if (isFatLine) this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos); // if already drawing in highlight mode, continue it
        else this.startNewLine(p.priorPos, this.style.fatStroke); // if not drawing in highlight mode, begin it
    }

    drawThinLine(isFatLine, p) {
        if (isFatLine) this.startNewLine(p.priorPos, this.style.thinStroke); // if drawing in highlight mode, end it
        else this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos);
    }

    /**
     * Ends and begins a new line with styles, NOTE: draws two vertices to indicate starting and ending points
     * @param  {curPos Object from getScaledPos} pos
     * @param  {Integer} weight
     */
    startNewLine(pos, weight) {
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos); // draw cur point twice to mark end point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(this.style.shade);
        this.sk.beginShape();
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos); // draw cur point twice to mark starting point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos);
    }

    testPointForBug(curPos) {
        const [timePos, xPos, yPos] = [curPos.selTimelineXPos, curPos.floorPlanXPos, curPos.floorPlanYPos];
        if (this.sk.sketchController.mode.isAnimate) this.recordBug(timePos, xPos, yPos, null); // always return true to set last/most recent point as the bug
        else if (this.sk.sketchController.mode.isVideoPlay) {
            const selTime = this.sk.sketchController.mapFromVideoToSelectedTime();
            if (this.compareValuesBySpacing(selTime, timePos, this.bug.lengthToCompare)) this.recordBug(timePos, xPos, yPos, Math.abs(selTime - timePos));
        } else if (this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY) && this.compareValuesBySpacing(this.sk.mouseX, timePos, this.bug.lengthToCompare)) this.recordBug(this.sk.mouseX, xPos, yPos, Math.abs(this.sk.mouseX - timePos));
    }

    compareValuesBySpacing(value1, value2, spacing) {
        return value1 >= value2 - spacing && value1 <= value2 + spacing;
    }

    resetBug() {
        this.bug.xPos = null;
        this.bug.yPos = null;
        this.bug.timePos = null;
        this.bug.lengthToCompare = this.sk.width;
        this.bug.isSelected = false;
    }

    recordBug(timePos, xPos, yPos, lengthToCompare) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
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
        this.sk.ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }
}