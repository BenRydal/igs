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
        this.setPaths(path);
        if (this.bug.xPos != null) this.drawBug(path.color); // if selected, draw bug
    }

    setPaths(path) {
        switch (this.sk.gui.getCurSelectTab()) {
            case 0:
                this.setPathStrokeWeights(1, 9);
                this.setDraw(path, "testStops");
                break;
            case 1:
                this.setPathStrokeWeights(1, 9);
                this.setDraw(path, "testCursor");
                break;
            case 2:
                this.setPathStrokeWeights(1, 9);
                this.setDraw(path, "testSlicer");
                break;
            case 3:
                this.setPathStrokeWeights(1, 0);
                this.setDraw(path, "testStops");
                break;
            case 4:
                this.setPathStrokeWeights(0, 9);
                this.setDraw(path, "testStops");
                break;
        }
    }

    setPathStrokeWeights(small, large) {
        this.smallPathWeight = small;
        this.largePathWeight = large;
    }

    setDraw(path, highlightMethod) {
        this.draw(this.sk.PLAN, path.movement, path.color, highlightMethod);
        this.draw(this.sk.SPACETIME, path.movement, path.color, highlightMethod);
    }

    /**
     * Organizes path drawing depending on view (floor plan or space-time)
     * Path is separated into segments depending on test/highlight method (e.g., stops, cursor, slicer)
     * NOTE: Due to browser drawing methods, paths must be separated/segmented to change thickness or stroke
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     * @param  {string} test
     */
    draw(view, movementArray, shade, test) {
        this.setLineStyle(shade);
        let isHighlightMode = false; // mode controls how paths are segmented (begun/ended)
        this.sk.beginShape();
        // Start at 1 to test current and prior points for drawing start/end vertices correctly
        for (let i = 1; i < movementArray.length; i++) {
            const curPoint = this.sk.sketchController.getScaledPointValues(movementArray[i], view); // get current and prior points for comparison
            const priorPoint = this.sk.sketchController.getScaledPointValues(movementArray[i - 1], view);
            if (this.sk.sketchController.testPointIsShowing(curPoint)) {
                if (view === this.sk.SPACETIME) this.testPointForBug(curPoint.scaledTime, curPoint.scaledXPos, curPoint.scaledYPos);
                if (this.highlightTestMethod(test, curPoint, movementArray[i])) {
                    isHighlightMode = this.highlightTestPassed(isHighlightMode, curPoint, priorPoint, shade);
                } else {
                    isHighlightMode = this.highlightTestFailed(view, isHighlightMode, curPoint, priorPoint, shade);
                }
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    highlightTestMethod(test, curPoint, point) {
        if (test === "testCursor") return this.sk.gui.overCursor(curPoint.scaledXPos, curPoint.scaledYPos);
        else if (test === "testSlicer") return this.sk.gui.overSlicer(curPoint.scaledXPos, curPoint.scaledYPos);
        else return this.testIsStopped(point);
    }

    highlightTestPassed(isHighlightMode, curPoint, priorPoint, shade) {
        if (isHighlightMode) this.sk.vertex(curPoint.scaledPlanOrTimeXPos, curPoint.scaledYPos); // if already drawing in highlight mode, continue it
        else this.startEndShape(priorPoint, this.largePathWeight, shade); // if not drawing in highlight mode, begin it
        return true;
    }

    highlightTestFailed(view, isHighlightMode, curPoint, priorPoint, shade) {
        if (isHighlightMode) {
            // this conditional fixes safari bug when drawing stops/curves with same x/y positions in the floor plan view
            if (view === this.sk.PLAN) this.startEndShape(curPoint, this.smallPathWeight, shade); // if drawing in highlight mode, end it
            else this.startEndShape(priorPoint, this.smallPathWeight, shade); // if drawing in highlight mode, end it
        } else this.sk.vertex(curPoint.scaledPlanOrTimeXPos, curPoint.scaledYPos);
        return false;
    }

    testIsStopped(point) {
        return point.isStopped;
    }

    setLineStyle(lineColor) {
        this.sk.strokeWeight(this.smallPathWeight);
        this.sk.stroke(lineColor);
        this.sk.noFill(); // important for curve drawing
    }

    /**
     * Ends and begins a new drawing shape
     * Draws two vertices to indicate starting and ending points
     * Sets correct strokeweight and this.sk.stroke depending on parameters for new shape
     * @param  {Object returned from getScaledPointValues} scaledPoint
     * @param  {Integer} weight
     * @param  {Color} shade
     */
    startEndShape(scaledPoint, weight, shade) {
        this.sk.vertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark end point
        this.sk.vertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(shade);
        this.sk.beginShape();
        this.sk.vertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark starting point
        this.sk.vertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos);
    }

    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (this.sk.sketchController.mode.isAnimate) this.recordBug(scaledTimeToTest, xPos, yPos, null); // always return true to set last/most recent point as the bug
        else if (this.sk.sketchController.mode.isVideoPlay) {
            const selTime = this.sk.sketchController.mapFromVideoToSelectedTime();
            if (this.compareValuesBySpacing(selTime, scaledTimeToTest, this.bug.lengthToCompare)) this.recordBug(scaledTimeToTest, xPos, yPos, Math.abs(selTime - scaledTimeToTest));
        } else if (this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY) && this.compareValuesBySpacing(this.sk.mouseX, scaledTimeToTest, this.bug.lengthToCompare)) this.recordBug(this.sk.mouseX, xPos, yPos, Math.abs(this.sk.mouseX - scaledTimeToTest));
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