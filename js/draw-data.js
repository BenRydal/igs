/**
 * Drawing methods are implemented through super class and 2 sub classes DrawDataMovement and DrawDataConversation
 * DrawData holds test methods used by both sub classes
 */
class DrawData {

    /**
     * Returns true if value is within pixel range of timeline
     * @param  {Number/Float} timeValue
     */
    overTimeline(pixelValue) {
        return pixelValue >= keys.curPixelTimeMin && pixelValue <= keys.curPixelTimeMax;
    }

    /**
     * Returns true if value is within floor plan pixel display container 
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= keys.displayFloorPlanWidth) && (yPos >= 0 && yPos <= keys.displayFloorPlanHeight);
    }
    /**
     * Returns true if mouse cursor near xPos and yPos parameters
     * NOTE: core.floorPlan SelectorSize set globally
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overCursor(xPos, yPos) {
        return handlers.overCircle(xPos, yPos, keys.floorPlanCursorSelectSize);
    }

    /**
     * If mouse is over floor plan, returns true if mouse cursor near xPos and yPos parameters
     * Always returns true if mouse is not over the floor plan
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overFloorPlanAndCursor(xPos, yPos) {
        return !this.overFloorPlan(mouseX, mouseY) || (this.overFloorPlan(mouseX, mouseY) && handlers.overCircle(xPos, yPos, keys.floorPlanCursorSelectSize));
    }

    /**
     * If not core.isModeAnimate mode, always return true
     * If core.isModeAnimate mode, return true only if time parameter is less than global core.isModeAnimate counter
     * @param  {Number/Float} timeValue
     */
    testAnimation(timeValue) {
        if (core.isModeAnimate) {
            let reMapTime = map(timeValue, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds);
            return core.animationCounter > reMapTime;
        } else return true;
    }
}

class DrawDataMovement extends DrawData {

    constructor() {
        super();
        /**
         * Bug represents location dot drawn in floor plan and space-time views
         * @Float xPos, yPos, timePos, size, lengthToCompare
         */
        this.bug = {
            xPos: NO_DATA,
            yPos: NO_DATA,
            timePos: NO_DATA,
            size: width / 50,
            lengthToCompare: keys.timelineLength // used to compare data points to find closest bug value
        };
        this.smallPathWeight = 3;
        this.largePathWeight = 6;
        this.colorGray = 150;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        // if overMap draw selection of movement and gray scale the rest
        if (handlers.overRect(0, 0, keys.displayFloorPlanWidth, keys.displayFloorPlanHeight)) {
            this.drawWithCursorHighlight(PLAN, path.movement, path.color);
            this.drawWithCursorHighlight(SPACETIME, path.movement, path.color);
        } else {
            this.draw(PLAN, path.movement, path.color);
            this.draw(SPACETIME, path.movement, path.color);
        }
        if (this.bug.xPos != NO_DATA) this.drawBug(path.color); // if selected, draw bug
    }

    /**
     * Simplest drawing method.
     * Draws movement path with no change in stroke color or weight
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    // draw(view, points, shade) {
    //     strokeWeight(pathWeight);
    //     stroke(shade);
    //     noFill(); // important for curve drawing
    //     beginShape();
    //     for (let i = 0; i < points.length; i++) {
    //         let point = points[i];
    //         let pixelTime = map(point.time, 0, core.totalTimeInSeconds, keys.timelineStart, keys.timelineEnd);
    //         let scaledTime = map(pixelTime, keys.curPixelTimeMin, keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd);
    //         let scaledXPos = point.xPos * keys.displayFloorPlanWidth / core.inputFloorPlanPixelWidth; // scale to floor plan image file
    //         let scaledYPos = point.yPos * keys.displayFloorPlanHeight / core.inputFloorPlanPixelHeight; // scale to floor plan image file
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

    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments of stops with thick line thickness and moving of thinner line thickness
     * Due to drawing methods in browsers, core.paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    draw(view, path, shade) {
        strokeWeight(this.smallPathWeight); // set small pathweight to start
        stroke(shade);
        noFill(); // important for curve drawing
        let stop_Mode = false; // mode indicating if stopped or moving measured by change from last point
        beginShape();
        // Start at 1 to test current and prior points for drawing
        for (let i = 1; i < path.length; i++) {
            let curPoint = this.getScaledMovementPointValues(path[i], view); // get current and prior points for comparison
            let priorPoint = this.getScaledMovementPointValues(path[i - 1], view);
            if (super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime)) {
                if (curPoint.scaledXPos === priorPoint.scaledXPos && curPoint.scaledYPos === priorPoint.scaledYPos) {
                    if (stop_Mode) { // if already drawing in stop mode, continue it
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledPixelTime, curPoint.scaledXPos, curPoint.scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        this.startEndShape(priorPoint, this.largePathWeight, shade);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        stop_Mode = true;
                    }
                } else {
                    if (stop_Mode) { // if drawing in stop mode, end it
                        this.startEndShape(priorPoint, this.smallPathWeight, shade);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        stop_Mode = false;
                    } else {
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        endShape(); // endshape in case still drawing
    }

    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments over cursor with thick line/highlight and not over cursor with thin line and grey color
     * Due to drawing methods in browsers, core.paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    drawWithCursorHighlight(view, path, shade) {
        strokeWeight(this.smallPathWeight); // set small pathweight to start
        stroke(this.colorGray); // start with gray color
        noFill(); // important for curve drawing
        let over_Cursor_Mode = false;
        beginShape();
        for (let i = 0; i < path.length; i++) {
            let curPoint = this.getScaledMovementPointValues(path[i], view);
            if (super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime)) {
                if (super.overCursor(curPoint.scaledXPos, curPoint.scaledYPos)) {
                    if (over_Cursor_Mode) { // if already drawing in cursor mode, continue it
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(curPoint.scaledPixelTime, curPoint.scaledXPos, curPoint.scaledYPos);
                    } else { // if not in drawing cursor mode, begin it
                        this.startEndShape(curPoint, this.largePathWeight, shade);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        over_Cursor_Mode = true;
                    }
                } else {
                    if (over_Cursor_Mode) { // if drawing in cursor mode, end it
                        this.startEndShape(curPoint, this.smallPathWeight, this.colorGray);
                        if (view === SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        over_Cursor_Mode = false;
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
     * @param  {MovementPoint} point
     * @param  {Integer} view
     */
    getScaledMovementPointValues(point, view) {
        const pixel = map(point.time, 0, core.totalTimeInSeconds, keys.timelineStart, keys.timelineEnd);
        const scaledPixel = map(pixel, keys.curPixelTimeMin, keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd);
        const scaledX = point.xPos * keys.displayFloorPlanWidth / core.inputFloorPlanPixelWidth;
        const scaledY = point.yPos * keys.displayFloorPlanHeight / core.inputFloorPlanPixelHeight;
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
     * @param  {Object returned from getScaledMovementPointValues} scaledPoint
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
     * Tests for 3 modes: core.isModeAnimate, video and mouse over space-time view
     * For current mode, tests parameter values to set/record bug correctly
     * @param  {Number/Float} scaledTimeToTest
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (core.isModeAnimate) this.recordBug(scaledTimeToTest, xPos, yPos); // always return true to set last/most recent point as the bug
        else if (core.isModeVideoPlaying) {
            // Separate this test out from 3 mode tests to make sure if this is not true know other mode tests are run when video is playing
            if (this.testVideoForBugPoint(scaledTimeToTest)) this.recordBug(scaledTimeToTest, xPos, yPos);
        } else if (handlers.overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight) && this.testMouseForBugPoint(scaledTimeToTest)) this.recordBug(mouseX, xPos, yPos);
        return false;
    }

    testVideoForBugPoint(scaledTimeToTest) {
        const videoX = map(videoPlayer.getCurrentTime(), 0, core.totalTimeInSeconds, keys.timelineStart, keys.timelineEnd);
        const scaledVideoX = map(videoX, keys.curPixelTimeMin, keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd);
        if (scaledVideoX >= scaledTimeToTest - this.bug.lengthToCompare && scaledVideoX <= scaledTimeToTest + this.bug.lengthToCompare) {
            this.bug.lengthToCompare = Math.abs(scaledVideoX - scaledTimeToTest);
            return true;
        } else return false;
    }

    testMouseForBugPoint(scaledTimeToTest) {
        if (mouseX >= scaledTimeToTest - this.bug.lengthToCompare && mouseX <= scaledTimeToTest + this.bug.lengthToCompare) {
            this.bug.lengthToCompare = Math.abs(mouseX - scaledTimeToTest);
            return true;
        } else return false;
    }

    resetBug() {
        this.bug.xPos = NO_DATA;
        this.bug.yPos = NO_DATA;
        this.bug.timePos = NO_DATA;
        this.bug.lengthToCompare = keys.timelineLength;
    }

    recordBug(timePos, xPos, yPos) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
        this.bug.timePos = timePos;
        core.bugTimePosForVideoScrubbing = timePos;
    }

    drawBug(shade) {
        stroke(0);
        strokeWeight(5);
        fill(shade);
        ellipse(this.bug.xPos, this.bug.yPos, this.bug.size, this.bug.size);
        ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }

    drawSlicer() {
        fill(0);
        stroke(0);
        strokeWeight(2);
        line(mouseX, 0, mouseX, keys.timelineHeight);
    }
}

class DrawDataConversation extends DrawData {

    constructor() {
        super();
        /**
         * Conversation bubble represents user selected conversation comprised of 
         * @boolean selected, @ConversationPoint and @integer view
         */
        this.conversationBubble = {
            selected: false,
            point: NO_DATA, // stores one ConversationPoint object for selected conversation turn
            view: PLAN // view indicating if user selected conversation in floor plan or space-time views
        };
        /**
         * Rect represents key parameters used in drawRects method to scale rectangles
         * @Number for each parameter
         */
        this.rect = {
            minPixelHeight: 3, // for really short conversation turns set a minimum pixel height
            minPixelWidth: map(core.totalTimeInSeconds, 0, 3600, 10, 1, true), // map to inverse, values constrained between 10 and 1 (pixels)
            maxPixelWidth: 10
        };
    }

    /**
     * Organizes drawing of conversation rects
     * @param  {Path} path
     */
    setData(path) {
        this.setRects(path.conversation, path.name);
    }
    /**
     * Organizes drawing of single text/textbox for a selected conversation
     * NOTE: this is called after all conversation rects are drawn so it is displayed on top visually
     */
    setConversationBubble() {
        if (this.conversationBubble.selected) this.drawTextBox();
    }

    /**
     * Tests if current point is in the viewing space
     * If it is, determines whether it is drawn depending on 2 modes:
     * (1) Draws all visible rects regardless of speaker (all conversation)
     * (2) Draws only rects where speaker of particular conversation turn matches the specific pathName of the Path that holds this particular list of ConversationPoint objects
     * @param  {[] ConversationPoint} points
     * @param  {Char} pathName
     */
    setRects(points, pathName) {
        for (let i = 0; i < points.length; i++) {
            const curPoint = this.getScaledConversationPointValues(points[i]);
            if (super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime) && super.overFloorPlanAndCursor(curPoint.scaledXPos, curPoint.scaledYPos)) {
                let curSpeaker = this.getSpeakerFromSpeakerList(points[i].speaker); // get speaker object from global list equivalent to the current speaker of point
                if (curSpeaker != null && curSpeaker.show) {
                    if (core.isModeAllTalkOnPath) this.drawRects(points[i], curSpeaker.color); // draws all rects
                    else {
                        if (curSpeaker.name === pathName) this.drawRects(points[i], curSpeaker.color); // draws rects only for speaker matching path
                    }
                }
            }
        }
    }

    /**
     * Returns scaled values for conversation point
     * @param  {ConversationPoint} point
     */
    getScaledConversationPointValues(point) {
        const pixel = map(point.time, 0, core.totalTimeInSeconds, keys.timelineStart, keys.timelineEnd);
        const scaledPixel = map(pixel, keys.curPixelTimeMin, keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd);
        const scaledX = point.xPos * keys.displayFloorPlanWidth / core.inputFloorPlanPixelWidth; // scale to floor plan image file
        const scaledY = point.yPos * keys.displayFloorPlanHeight / core.inputFloorPlanPixelHeight; // scale to floor plan image file
        return {
            pixelTime: pixel,
            scaledTime: scaledPixel,
            scaledXPos: scaledX,
            scaledYPos: scaledY
        };
    }

    /**
     * Returns speaker object based from global speaker list if it matches passed character paramater
     * Returns null if no match found
     * @param  {Char} curSpeaker
     */
    getSpeakerFromSpeakerList(curSpeaker) {
        for (let i = 0; i < core.speakerList.length; i++) {
            if (core.speakerList[i].name === curSpeaker) return core.speakerList[i];
        }
        return null;
    }

    /**
     * Draws properly scaled and colored rectangled for conversation turn of a ConversationPoint
     * Also tests if conversation turn has been selected by user and sends to recordConversationBubble if so
     * NOTE: A call to recordConversationBubble also results in highlighting current rect stroke in this method
     * @param  {ConversationPoint} point
     * @param  {Color} curColor
     */
    drawRects(point, curColor) {
        // ***** SET FONTS/STROKES/CONSTANTS
        noStroke(); // reset if setDrawText is called previously in loop
        textFont(font_Lato, keys.keyTextSize);
        textSize(1); // Controls measurement of pixels in a string that corredponds to vertical pixel height of rectangle.
        const rectWidth = map(keys.curPixelTimeMax - keys.curPixelTimeMin, 0, keys.timelineLength, this.rect.maxPixelWidth, this.rect.minPixelWidth); // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectLength = textWidth(point.talkTurn);
        if (rectLength < this.rect.minPixelHeight) rectLength = this.rect.minPixelHeight; // if current turn is small set it to the minimum height
        const curPoint = this.getScaledConversationPointValues(point);
        let yPos;
        if (core.isModeAlignTalkTop) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = curPoint.scaledYPos - rectLength;
        // ***** TEST SET TEXT
        if (handlers.overRect(curPoint.scaledXPos, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, PLAN); // if over plan
        else if (handlers.overRect(curPoint.scaledTime, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, SPACETIME); // if over spacetime
        // ***** DRAW CUR RECT
        fill(curColor);
        rect(curPoint.scaledXPos, yPos, rectWidth, rectLength); // PLAN VIEW
        rect(curPoint.scaledTime, yPos, rectWidth, rectLength); // SPACETIME VIEW
    }

    /**
     * Records user selected conversation
     * NOTE: Also sets stroke/strokeweight to highlight selected rectangle in drawRects method
     * @param  {ConversationPoint} pointToDraw
     * @param  {Integer} view
     */
    recordConversationBubble(pointToDraw, view) {
        this.conversationBubble.selected = true;
        this.conversationBubble.point = pointToDraw;
        this.conversationBubble.view = view;
        stroke(0);
        strokeWeight(4);
    }

    /**
     * Draws textbox and cartoon "bubble" for user selected conversation
     * Sets box dimensions based on size of conversation turn/text
     */
    drawTextBox() {
        // ***** SET FONTS/STROKES/CONSTANTS
        const curPoint = this.getScaledConversationPointValues(this.conversationBubble.point); // get scaled values for selected point
        const textBox = {
            width: width / 3, // width of text and textbox drawn
            textLeading: width / 57, // textbox leading
            boxSpacing: width / 141, // general textBox spacing variable
            rectSpacing: width / 28.2, // distance from text rectangle of textbox
        }
        textBox.height = textBox.textLeading * (ceil(textWidth(this.conversationBubble.point.talkTurn) / textBox.width)); // lines of talk in a text box rounded up
        textFont(font_Lato, keys.keyTextSize);
        textLeading(textBox.textLeading);
        let xPos; // set xPos, constrain prevents drawing off screen
        if (this.conversationBubble.view === PLAN) xPos = constrain(curPoint.scaledXPos - textBox.width / 2, textBox.boxSpacing, width - textBox.width - textBox.boxSpacing);
        else xPos = constrain(curPoint.scaledTime - textBox.width / 2, 0, width - textBox.width - textBox.boxSpacing);
        let yPos, yDif;
        if (mouseY < height / 2) { //if top half of screen, text box below rectangle
            yPos = mouseY + textBox.rectSpacing;
            yDif = -textBox.boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            yPos = mouseY - textBox.rectSpacing - textBox.height;
            yDif = textBox.height + textBox.boxSpacing;
        }
        // ***** DRAW TEXTBOX
        stroke(0); //set color to black
        strokeWeight(1);
        fill(255, 200); // transparency for textbox
        rect(xPos - textBox.boxSpacing, yPos - textBox.boxSpacing, textBox.width + 2 * textBox.boxSpacing, textBox.height + 2 * textBox.boxSpacing);
        fill(0);
        text(this.conversationBubble.point.speaker + ": " + this.conversationBubble.point.talkTurn, xPos, yPos, textBox.width, textBox.height); // text
        // ***** DRAW CARTOON BUBBLE
        stroke(255);
        strokeWeight(2);
        line(mouseX - textBox.rectSpacing, yPos + yDif, mouseX - textBox.rectSpacing / 2, yPos + yDif); // white line to hide black rect under cartoon bubble
        stroke(0);
        strokeWeight(1);
        line(mouseX, mouseY, mouseX - textBox.rectSpacing, yPos + yDif);
        line(mouseX, mouseY, mouseX - textBox.rectSpacing / 2, yPos + yDif);
    }
}