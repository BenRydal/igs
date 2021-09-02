class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.bug = { // represents user selection dot drawn in both floor plan and space-time views
            xPos: null, // number/float values
            yPos: null,
            timePos: null,
            size: this.sk.width / 50,
            lengthToCompare: this.sk.width // used to compare data points to find closest bug value
        };
        this.smallPathWeight = null;
        this.largePathWeight = null;
        this.colorGray = 150;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        this.setPathStyles();
        this.setDraw(this.sk.PLAN, path.movement, path.color);
        this.setDraw(this.sk.SPACETIME, path.movement, path.color);
        if (this.bug.xPos != null) this.drawBug(path.color); // if selected, draw bug
    }

    setPathStyles() {
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

    setPathStrokeWeights(small, large) {
        this.smallPathWeight = small;
        this.largePathWeight = large;
    }

    /**
     * Organizes path drawing depending on view (floor plan or space-time)
     * Path is separated into segments depending on test/highlight method (e.g., stops, cursor, slicer)
     * NOTE: Due to browser drawing methods, paths must be separated/segmented to change thickness or stroke
     * @param  {Integer} view
     * @param  {MovementPoint []} movementArray
     * @param  {Color} shade
     */
    setDraw(view, movementArray, shade) {
        let isFatLine = false; // controls how line segmentation
        this.setLineStyle(shade);
        this.sk.beginShape();
        for (let i = 1; i < movementArray.length; i++) { // Start at 1 to test cur and prior points
            const p = this.createComparePoint(view, movementArray[i], movementArray[i - 1]);
            if (this.sk.sketchController.testPointIsShowing(p.curPos)) isFatLine = testComparePoint(isFatLine, p, view, shade);
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    testComparePoint(isFatLine, p, view, shade) {
        if (view === this.sk.SPACETIME) this.testPointForBug(p.curPoint);
        if (this.testDrawStops(view, p.curPoint)) {
            if (!p.priorPoint.isStopped) this.drawStopCircle(p.curPos, shade); // only draw stopped point once
        } else {
            if (this.testSelectMethod(p)) {
                this.drawFatLine(isFatLine, p, shade);
                isFatLine = true;
            } else {
                this.drawThinLine(isFatLine, p, shade);
                isFatLine = false;
            }
        }
        return isFatLine;
    }

    setLineStyle(lineColor) {
        this.sk.strokeWeight(this.smallPathWeight);
        this.sk.stroke(lineColor);
        this.sk.noFill(); // important for curve drawing
    }

    createComparePoint(view, curPoint, priorPoint) {
        return {
            curPoint,
            curPos: this.sk.sketchController.getScaledPos(curPoint, view), // get current and prior points for comparison
            priorPoint,
            priorPos: this.sk.sketchController.getScaledPos(priorPoint, view)
        }
    }

    testDrawStops(view, curPoint) {
        return (view === this.sk.PLAN && curPoint.isStopped && this.sk.gui.getCurSelectTab() !== 3);
    }

    testSelectMethod(p) {
        if (this.sk.gui.getCurSelectTab() === 1) return this.sk.gui.overCursor(p.curPos.floorPlanXPos, p.curPos.floorPlanYPos);
        else if (this.sk.gui.getCurSelectTab() === 2) return this.sk.gui.overSlicer(p.curPos.floorPlanXPos, p.curPos.floorPlanYPos);
        else return p.curPoint.isStopped;
    }

    drawStopCircle(curPos, shade) {
        this.sk.fill(shade);
        this.sk.circle(curPos.viewXPos, curPos.floorPlanYPos, 9);
        this.sk.noFill();
    }

    drawFatLine(isFatLine, p, shade) {
        if (isFatLine) this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos); // if already drawing in highlight mode, continue it
        else this.startNewLine(p.priorPoint, this.largePathWeight, shade); // if not drawing in highlight mode, begin it
    }

    drawThinLine(isFatLine, p, shade) {
        if (isFatLine) this.startNewLine(p.priorPoint, this.smallPathWeight, shade); // if drawing in highlight mode, end it
        else this.sk.vertex(p.curPos.viewXPos, p.curPos.floorPlanYPos);
    }

    /**
     * Ends and begins a new drawing shape
     * Draws two vertices to indicate starting and ending points
     * Sets correct strokeweight and this.sk.stroke depending on parameters for new shape
     * @param  {Object returned from getScaledPos} scaledPoint
     * @param  {Integer} weight
     * @param  {Color} shade
     */
    startNewLine(pos, weight, shade) {
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos); // draw cur point twice to mark end point
        this.sk.vertex(pos.viewXPos, pos.floorPlanYPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(shade);
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
    }

    recordBug(timePos, xPos, yPos, lengthToCompare) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
        this.bug.timePos = timePos;
        this.bug.lengthToCompare = lengthToCompare;
        this.sk.sketchController.bugTimeForVideoScrub = timePos;
    }

    drawBug(shade) {
        this.sk.stroke(0);
        this.sk.strokeWeight(5);
        this.sk.fill(shade);
        this.sk.ellipse(this.bug.xPos, this.bug.yPos, this.bug.size, this.bug.size);
        this.sk.ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }
}