/**
 * Drawing methods are implemented through super class and 2 sub classes drawDataMovement and drawDataConversation
 * DrawData holds test methods used by both sub classes
 */
class DrawData {

    constructor() {}
    /**
     * Returns true if value is within pixel range of timeline
     * @param  {Number/Float} timeValue
     */
    overTimeline(pixelValue) {
        return pixelValue >= currPixelTimeMin && pixelValue <= currPixelTimeMax;
    }

    /**
     * Returns true if value is within floor plan pixel display container 
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= displayFloorPlanWidth) && (yPos >= 0 && yPos <= displayFloorPlanHeight);
    }
    /**
     * Returns true if mouse cursor near xPos and yPos parameters
     * NOTE: floorPlan SelectorSize set globally
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overCursor(xPos, yPos) {
        return overCircle(xPos, yPos, floorPlanCursorSelectSize);
    }

    /**
     * If mouse is over floor plan, returns true if mouse cursor near xPos and yPos parameters
     * Always returns true if mouse is not over the floor plan
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overFloorPlanAndCursor(xPos, yPos) {
        return !this.overFloorPlan(mouseX, mouseY) || (this.overFloorPlan(mouseX, mouseY) && overCircle(xPos, yPos, floorPlanCursorSelectSize));
    }

    /**
     * If not animation mode, always return true
     * If animation mode, return true only if time parameter is less than global animation counter
     * @param  {Number/Float} timeValue
     */
    testAnimation(timeValue) {
        if (animation) {
            let reMapTime = map(timeValue, timelineStart, timelineEnd, 0, totalTimeInSeconds);
            return animationCounter > reMapTime;
        } else return true;
    }
}

class DrawDataMovement extends DrawData {

    constructor() {
        super();
        this.bugXPos = -1;
        this.bugYPos = -1;
        this.bugTimePos = -1;
        this.bugSize = width / 50;
        this.bugSpacingComparison = timelineLength;
        this.smallPathWeight = 3;
        this.largePathWeight = 6;
        this.colorGray = 150;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        // if overMap draw selection of movement and gray scale the rest
        if (overRect(0, 0, displayFloorPlanWidth, displayFloorPlanHeight)) {
            this.drawWithCursorHighlight(PLAN, path.movement, path.color);
            this.drawWithCursorHighlight(SPACETIME, path.movement, path.color);
        } else {
            this.draw(PLAN, path.movement, path.color);
            this.draw(SPACETIME, path.movement, path.color);
        }
        if (this.bugXPos != -1) this.drawBug(path.color); // if selected, draw bug
    }

    // // Main draw method to draw movement paths, also sets bug values
    // draw(view, points, shade) {
    //     strokeWeight(pathWeight);
    //     stroke(shade);
    //     noFill(); // important for curve drawing
    //     beginShape();
    //     for (let i = 0; i < points.length; i++) {
    //         let point = points[i];
    //         let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
    //         let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
    //         let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
    //         let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
    //         if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime)) {
    //             if (view == PLAN) curveVertex(scaledXPos, scaledYPos);
    //             else if (view == SPACETIME) {
    //                 curveVertex(scaledTime, scaledYPos);
    //                 this.testPointForBug(scaledTime, scaledXPos, scaledYPos);
    //             }
    //         }
    //     }
    //     endShape();
    // }

    // Main draw method to draw movement paths, also sets bug values


    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments of stops with thick line thickness and moving of thinner line thickness
     * Due to drawing methods in browsers, paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    draw(view, path, shade) {
        strokeWeight(this.smallPathWeight); // set small pathweight to start
        stroke(shade);
        noFill(); // important for curve drawing
        let drawStopPointMode = false; // mode indicating if stopped or moving measured by change from last point
        beginShape();
        // Start at 1 to test current and prior points for drawing
        for (let i = 1; i < path.length; i++) {
            let curPoint = this.getScaledPointValues(path[i], view);
            let priorPoint = this.getScaledPointValues(path[i - 1], view);
            if (super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime)) {
                if (curPoint.scaledXPos === priorPoint.scaledXPos && curPoint.scaledYPos === priorPoint.scaledYPos) {
                    if (drawStopPointMode) { // if already drawing in stop mode, continue it
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledPixelTime, curPoint.scaledXPos, curPoint.scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        this.startEndShape(priorPoint, this.largePathWeight, shade);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        drawStopPointMode = true;
                    }
                } else {
                    if (drawStopPointMode) { // if drawing in stop mode, end it
                        this.startEndShape(priorPoint, this.smallPathWeight, shade);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        drawStopPointMode = false;
                    } else {
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        endShape(); // endshape in case still drawing
    }

    // Main draw method to draw movement paths, also sets bug values
    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments over cursor with thick line/highlight and not over cursor with thin line and grey color
     * Due to drawing methods in browsers, paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    drawWithCursorHighlight(view, path, shade) {
        strokeWeight(this.smallPathWeight); // set small pathweight to start
        stroke(this.colorGray); // start with gray color
        noFill(); // important for curve drawing
        let drawOverCursorPointMode = false;
        beginShape();
        for (let i = 0; i < path.length; i++) {
            let curPoint = this.getScaledPointValues(path[i], view);
            if (super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime)) {
                if (super.overCursor(curPoint.scaledXPos, curPoint.scaledYPos)) {
                    if (drawOverCursorPointMode) { // if already drawing in cursor mode, continue it
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(curPoint.scaledPixelTime, curPoint.scaledXPos, curPoint.scaledYPos);
                    } else { // if not in drawing cursor mode, begin it
                        this.startEndShape(curPoint, this.largePathWeight, shade);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        drawOverCursorPointMode = true;
                    }
                } else {
                    if (drawOverCursorPointMode) { // if drawing in cursor mode, end it
                        this.startEndShape(curPoint, this.smallPathWeight, this.colorGray);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        drawOverCursorPointMode = false;
                    } else {
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        endShape();
    }
    /**
     * Returns scaled values for movement point
     * NOTE: view determines which space-time xPos is returned
     * @param  {Point_Movement} point
     * @param  {Integer} view
     */
    getScaledPointValues(point, view) {
        const pixel = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        const scaledPixel = map(pixel, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        const scaledX = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth;
        const scaledY = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight;
        let scaledSpaceTimeX;
        if (view === PLAN) scaledSpaceTimeX = scaledX;
        else if (view === SPACETIME) scaledSpaceTimeX = scaledPixel;
        return {
            pixelTime: pixel,
            scaledPixelTime: scaledPixel,
            scaledXPos: scaledX,
            scaledYPos: scaledY,
            scaledSpaceTimeXPos: scaledSpaceTimeX
        };
    }
    /**
     * Ends and begins a new drawing shape
     * Draws two vertices to indicate starting and ending points
     * Sets correct strokeweight and stroke depending on parameters for new shape
     * @param  {Object returned from getScaledPointValues} scaledPoint
     * @param  {Integer} weight
     * @param  {Color} shade
     */
    startEndShape(scaledPoint, weight, shade) {
        curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark end point
        curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos);
        endShape(); // then end shape
        strokeWeight(weight); // set large strokeWeight for not moving/stopped
        stroke(shade);
        beginShape(); // begin new shape
        curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark starting point
        curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos);
    }

    /**
     * Tests for 3 modes: animation, video and mouse over space-time view
     * For current mode, tests parameter values to set/record bug correctly
     * @param  {Number/Float} scaledTimeToTest
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (animation) this.recordBug(scaledTimeToTest, xPos, yPos); // always return true to set last/most recent point as the bug
        else if (videoIsPlaying) {
            // Separate this test out from 3 mode tests to make sure if this is not true know other mode tests are run when video is playing
            if (this.testVideoForBugPoint(scaledTimeToTest)) this.recordBug(scaledTimeToTest, xPos, yPos);
        } else if (overRect(timelineStart, 0, timelineLength, timelineHeight) && this.testMouseForBugPoint(scaledTimeToTest)) this.recordBug(mouseX, xPos, yPos);
        return false;
    }

    testVideoForBugPoint(scaledTimeToTest) {
        const videoX = map(videoPlayer.getCurrentTime(), 0, totalTimeInSeconds, timelineStart, timelineEnd);
        const scaledVideoX = map(videoX, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        if (scaledVideoX >= scaledTimeToTest - this.bugSpacingComparison && scaledVideoX <= scaledTimeToTest + this.bugSpacingComparison) {
            this.bugSpacingComparison = Math.abs(scaledVideoX - scaledTimeToTest); // 
            return true;
        } else return false;
    }

    testMouseForBugPoint(scaledTimeToTest) {
        if (mouseX >= scaledTimeToTest - this.bugSpacingComparison && mouseX <= scaledTimeToTest + this.bugSpacingComparison) {
            this.bugSpacingComparison = Math.abs(mouseX - scaledTimeToTest);
            return true;
        } else return false;
    }

    resetBug() {
        this.bugXPos = -1;
        this.bugYPos = -1;
        this.bugTimePos = -1;
        this.bugSpacingComparison = timelineLength;
    }
    recordBug(timePos, xPos, yPos) {
        this.bugXPos = xPos;
        this.bugYPos = yPos;
        this.bugTimePos = timePos;
        bugTimePosForVideoScrubbing = timePos;
    }

    drawBug(shade) {
        stroke(0);
        strokeWeight(5);
        fill(shade);
        ellipse(this.bugXPos, this.bugYPos, this.bugSize, this.bugSize);
        ellipse(this.bugTimePos, this.bugYPos, this.bugSize, this.bugSize);
    }

    drawSlicer() {
        fill(0);
        stroke(0);
        strokeWeight(2);
        line(mouseX, 0, mouseX, timelineHeight);
    }
}

class DrawDataConversation extends DrawData {

    constructor() {
        super();
        this.conversationIsSelected = false;
        this.conversationToDraw = 0; //stores the Point_Conversation object
        this.view = 0
    }

    setData(path) {
        this.setRects(path.conversation, path.name); // if path has conversation
    }

    setConversationBubble() {
        if (this.conversationIsSelected) this.drawTextBox(); // done last to be overlaid on top
    }

    numOfPaths() {
        let numOfPaths = 0; // determine how many paths are being drawn
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            if (path.show == true) numOfPaths++;
        }
        return numOfPaths;
    }

    // Test if point is showing and send to draw Rect depending on conversation mode
    setRects(points, pathName) {
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
            let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
            if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime) && super.overFloorPlanAndCursor(scaledXPos, scaledYPos)) {
                let curSpeaker = this.getSpeakerObject(points[i].speaker); // get speaker object equivalent to character
                if (curSpeaker.show) {
                    if (allConversation) this.drawRects(point, curSpeaker.color); // draws all rects
                    else {
                        if (curSpeaker.name === pathName) this.drawRects(point, curSpeaker.color); // draws rects only for speaker matching path
                    }
                }
            }
        }
    }

    drawRects(point, curColor) {
        noStroke(); // reset if setDrawText is called previously in loop
        textFont(font_Lato, keyTextSize);
        textSize(1); // determines how many pixels a string is which corresponds to vertical height of rectangle
        let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        let minRectHeight = 3; // for really short conversation turns set a minimum        
        let rectWidthMin = map(totalTimeInSeconds, 0, 3600, 10, 1, true); // map to inverse, values constrained between 10 and 1 (pixels)
        let rectWidthMax = 10;
        // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectWidth = map(currPixelTimeMax - currPixelTimeMin, 0, timelineLength, rectWidthMax, rectWidthMin);
        let rectLength = textWidth(point.talkTurn);
        if (rectLength < minRectHeight) rectLength = minRectHeight; // set small strings to minimum
        let xPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
        let yPos;
        if (conversationPositionTop) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight - rectLength;
        // setText sets stroke/strokeWeight to highlight rect if selected
        if (overRect(xPos, yPos, rectWidth, rectLength)) this.setText(point, PLAN); // if over plan
        else if (overRect(scaledTime, yPos, rectWidth, rectLength)) this.setText(point, SPACETIME); // if over spacetime
        fill(curColor); // Set color
        rect(xPos, yPos, rectWidth, rectLength); // Plan
        rect(scaledTime, yPos, rectWidth, rectLength); // Spacetime
    }

    // Returns speaker object based on string/character
    getSpeakerObject(s) {
        for (let i = 0; i < speakerList.length; i++) {
            if (speakerList[i].name === s) return speakerList[i];
        }
        return null; // Update with error handling here
    }

    setText(num, view) {
        this.conversationIsSelected = true;
        this.conversationToDraw = num;
        this.view = view;
        stroke(0);
        strokeWeight(4);
    }

    drawTextBox() {

        let textBoxWidth = width / 3; // width of text and textbox drawn
        let textSpacing = width / 57; // textbox leading
        let boxSpacing = width / 141; // general textBox spacing variable
        let boxDistFromRect = width / 28.2; // distance from text rectangle of textbox

        textFont(font_Lato, keyTextSize);
        textLeading(textSpacing);
        let point = this.conversationToDraw;
        let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        let textBoxHeight = textSpacing * (ceil(textWidth(point.talkTurn) / textBoxWidth)); // lines of talk in a text box rounded up
        let xPos; // set xPos, constrain prevents drawing off screen
        if (this.view == PLAN) xPos = constrain((point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth) - textBoxWidth / 2, boxSpacing, width - textBoxWidth - boxSpacing);
        else xPos = constrain(scaledTime - textBoxWidth / 2, 0, width - textBoxWidth - boxSpacing);
        let yPos, yDif;
        if (mouseY < height / 2) { //if top half of screen, text box below rectangle
            yPos = mouseY + boxDistFromRect;
            yDif = -boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            yPos = mouseY - boxDistFromRect - textBoxHeight;
            yDif = textBoxHeight + boxSpacing;
        }
        // textbox
        stroke(0); //set color to black
        strokeWeight(1);
        fill(255, 200); // transparency for textbox
        rect(xPos - boxSpacing, yPos - boxSpacing, textBoxWidth + 2 * boxSpacing, textBoxHeight + 2 * boxSpacing);
        fill(0);
        text(point.speaker + ": " + point.talkTurn, xPos, yPos, textBoxWidth, textBoxHeight); // text
        // conversation bubble
        stroke(255);
        strokeWeight(2);
        line(mouseX - boxDistFromRect, yPos + yDif, mouseX - boxDistFromRect / 2, yPos + yDif);
        stroke(0);
        strokeWeight(1);
        line(mouseX, mouseY, mouseX - boxDistFromRect, yPos + yDif);
        line(mouseX, mouseY, mouseX - boxDistFromRect / 2, yPos + yDif);
    }
}