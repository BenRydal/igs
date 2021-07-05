/**
 * Drawing methods are implemented through super class and 2 sub classes DrawDataMovement and DrawDataConversation
 * DrawData holds test methods used by both sub classes
 */
class DrawData {

    constructor() {
        this.PLAN = 0; // two drawing mode constants
        this.SPACETIME = 1;
        this.NO_DATA = -1;
    }
    /**
     * Returns true if value is within pixel range of timeline
     * @param  {Number/Float} timeValue
     */
    overTimeline(pixelValue) {
        return pixelValue >= keys.timeline.selectStart && pixelValue <= keys.timeline.selectEnd;
    }

    /**
     * Returns true if value is within floor plan pixel display container 
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= keys.floorPlan.width) && (yPos >= 0 && yPos <= keys.floorPlan.height);
    }
    /**
     * Returns true if mouse cursor near xPos and yPos parameters
     * NOTE: core.floorPlan SelectorSize set globally
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overCursor(xPos, yPos) {
        return keys.overCircle(xPos, yPos, keys.floorPlan.selectorSize);
    }

    /**
     * If mouse is over floor plan, returns true if mouse cursor near xPos and yPos parameters
     * Always returns true if mouse is not over the floor plan
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    overFloorPlanAndCursor(xPos, yPos) {
        return !this.overFloorPlan(mouseX, mouseY) || (this.overFloorPlan(mouseX, mouseY) && keys.overCircle(xPos, yPos, keys.floorPlan.selectorSize));
    }

    /**
     * If not mode.isAnimate mode, always return true
     * If mode.isAnimate mode, return true only if time parameter is less than global mode.isAnimate counter
     * @param  {Number/Float} timeValue
     */
    testAnimation(timeValue) {
        if (mode.isAnimate) {
            const reMapTime = map(timeValue, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds);
            return animationCounter > reMapTime;
        } else return true;
    }
}

class DrawDataMovement extends DrawData {

    constructor() {
        super();
        this.bug = { // represents user selection dot drawn in both floor plan and space-time views
            xPos: this.NO_DATA, // number/float values
            yPos: this.NO_DATA,
            timePos: this.NO_DATA,
            size: width / 50,
            lengthToCompare: keys.timeline.length // used to compare data points to find closest bug value
        };
        this.smallPathWeight = 3;
        this.largePathWeight = 6;
        this.colorGray = 150;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        // if overMap draw selection of movement and gray scale the rest
        if (keys.overRect(0, 0, keys.floorPlan.width, keys.floorPlan.height)) {
            this.drawWithCursorHighlight(this.PLAN, path.movement, path.color);
            this.drawWithCursorHighlight(this.SPACETIME, path.movement, path.color);
        } else {
            this.draw(this.PLAN, path.movement, path.color);
            this.draw(this.SPACETIME, path.movement, path.color);
        }
        if (this.bug.xPos != this.NO_DATA) this.drawBug(path.color); // if selected, draw bug
    }

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
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledPixelTime, curPoint.scaledXPos, curPoint.scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        this.startEndShape(priorPoint, this.largePathWeight, shade);
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        stop_Mode = true;
                    }
                } else {
                    if (stop_Mode) { // if drawing in stop mode, end it
                        this.startEndShape(priorPoint, this.smallPathWeight, shade);
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        stop_Mode = false;
                    } else {
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
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
        strokeWeight(this.smallPathWeight);
        stroke(this.colorGray);
        noFill(); // important for curve drawing
        let over_Cursor_Mode = false;
        beginShape();
        for (const point of path) {
            let curPoint = this.getScaledMovementPointValues(point, view);
            if (super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime)) {
                if (super.overCursor(curPoint.scaledXPos, curPoint.scaledYPos)) {
                    if (over_Cursor_Mode) { // if already drawing in cursor mode, continue it
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view == this.SPACETIME) this.testPointForBug(curPoint.scaledPixelTime, curPoint.scaledXPos, curPoint.scaledYPos);
                    } else { // if not in drawing cursor mode, begin it
                        this.startEndShape(curPoint, this.largePathWeight, shade);
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        over_Cursor_Mode = true;
                    }
                } else {
                    if (over_Cursor_Mode) { // if drawing in cursor mode, end it
                        this.startEndShape(curPoint, this.smallPathWeight, this.colorGray);
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
                        over_Cursor_Mode = false;
                    } else {
                        curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                        if (view === this.SPACETIME) this.testPointForBug(curPoint.scaledSpaceTimeXPos, curPoint.scaledXPos, curPoint.scaledYPos);
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
        const pixelTime = map(point.time, 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
        const scaledPixelTime = map(pixelTime, keys.timeline.selectStart, keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end);
        const scaledXPos = point.xPos * keys.floorPlan.width / core.floorPlan.inputPixelWidth;
        const scaledYPos = point.yPos * keys.floorPlan.height / core.floorPlan.inputPixelHeight;
        let scaledSpaceTimeXPos;
        if (view === this.PLAN) scaledSpaceTimeXPos = scaledXPos;
        else if (view === this.SPACETIME) scaledSpaceTimeXPos = scaledPixelTime;
        return {
            pixelTime,
            scaledPixelTime,
            scaledXPos,
            scaledYPos,
            scaledSpaceTimeXPos
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
     * Tests for 3 modes: mode.isAnimate, video and mouse over space-time view
     * For current mode, tests parameter values to set/record bug correctly
     * @param  {Number/Float} scaledTimeToTest
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (mode.isAnimate) this.recordBug(scaledTimeToTest, xPos, yPos); // always return true to set last/most recent point as the bug
        else if (mode.isVideoPlay) {
            // Separate this test out from 3 mode tests to make sure if this is not true know other mode tests are run when video is playing
            if (this.testVideoForBugPoint(scaledTimeToTest)) this.recordBug(scaledTimeToTest, xPos, yPos);
        } else if (keys.overRect(keys.timeline.start, 0, keys.timeline.length, keys.timeline.height) && this.testMouseForBugPoint(scaledTimeToTest)) this.recordBug(mouseX, xPos, yPos);
        return false;
    }

    testVideoForBugPoint(scaledTimeToTest) {
        const videoX = map(core.videoPlayer.getCurrentTime(), 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
        const scaledVideoX = map(videoX, keys.timeline.selectStart, keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end);
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
        this.bug.xPos = this.NO_DATA;
        this.bug.yPos = this.NO_DATA;
        this.bug.timePos = this.NO_DATA;
        this.bug.lengthToCompare = keys.timeline.length;
    }

    recordBug(timePos, xPos, yPos) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
        this.bug.timePos = timePos;
        bugTimePosForVideoScrubbing = timePos;
    }

    drawBug(shade) {
        stroke(0);
        strokeWeight(5);
        fill(shade);
        ellipse(this.bug.xPos, this.bug.yPos, this.bug.size, this.bug.size);
        ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }
}

class DrawDataConversation extends DrawData {

    constructor() {
        super();

        this.conversationBubble = { // represents user selected conversation
            isSelected: false,
            point: this.NO_DATA, // stores one ConversationPoint object for selected conversation turn
            view: this.PLAN // view indicating if user selected conversation in floor plan or space-time views
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
        if (this.conversationBubble.isSelected) this.drawTextBox();
    }

    /**
     * Organizes tests and drawing for conversation points
     * @param  {[] ConversationPoint} points
     * @param  {Char} pathName
     */
    setRects(conversation, pathName) {
        for (const point of conversation) {
            const curPoint = this.getScaledConversationPointValues(point);
            if (this.testConversationPointToDraw(curPoint)) {
                const curSpeaker = this.getSpeakerFromSpeakerList(point.speaker); // get speaker object from global list equivalent to the current speaker of point
                if (this.testSpeakerToDraw(curSpeaker, pathName)) this.drawRects(point, curSpeaker.color); // draws all rects
            }
        }
    }
    /**
     * Test if point is in user view
     * @param  {ConversationPoint} curPoint
     */
    testConversationPointToDraw(curPoint) {
        return super.overTimeline(curPoint.pixelTime) && super.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && super.testAnimation(curPoint.pixelTime) && super.overFloorPlanAndCursor(curPoint.scaledXPos, curPoint.scaledYPos);
    }
    /**
     * Tests whether to draw selected speaker
     * Speaker must be showing and either program on all talk mode or speaker matches pathname
     * @param  {Char} speaker
     * @param  {Char} pathName
     */
    testSpeakerToDraw(speaker, pathName) {
        return speaker != null && speaker.show && (mode.isAllTalk || speaker.name === pathName);
    }

    /**
     * Returns scaled values for conversation point
     * @param  {ConversationPoint} point
     */
    getScaledConversationPointValues(point) {
        const pixelTime = map(point.time, 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
        const scaledTime = map(pixelTime, keys.timeline.selectStart, keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end);
        const scaledXPos = point.xPos * keys.floorPlan.width / core.floorPlan.inputPixelWidth; // scale to floor plan image file
        const scaledYPos = point.yPos * keys.floorPlan.height / core.floorPlan.inputPixelHeight; // scale to floor plan image file
        return {
            pixelTime,
            scaledTime,
            scaledXPos,
            scaledYPos
        };
    }

    /**
     * Returns speaker object based from global speaker list if it matches passed character paramater
     * Returns null if no match found
     * @param  {Char} curSpeaker
     */
    getSpeakerFromSpeakerList(curSpeaker) {
        for (const speaker of core.speakerList) {
            if (speaker.name === curSpeaker) return speaker;
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
        const rectWidth = map(keys.timeline.selectEnd - keys.timeline.selectStart, 0, keys.timeline.length, this.rect.maxPixelWidth, this.rect.minPixelWidth); // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectLength = textWidth(point.talkTurn);
        if (rectLength < this.rect.minPixelHeight) rectLength = this.rect.minPixelHeight; // if current turn is small set it to the minimum height
        const curPoint = this.getScaledConversationPointValues(point);
        let yPos;
        if (mode.isAlignTalk) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = curPoint.scaledYPos - rectLength;
        // ***** TEST SET TEXT
        if (keys.overRect(curPoint.scaledXPos, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, this.PLAN); // if over plan
        else if (keys.overRect(curPoint.scaledTime, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, this.SPACETIME); // if over spacetime
        // ***** DRAW CUR RECT
        fill(curColor);
        rect(curPoint.scaledXPos, yPos, rectWidth, rectLength); // this.PLAN VIEW
        rect(curPoint.scaledTime, yPos, rectWidth, rectLength); // this.SPACETIME VIEW
    }

    /**
     * Records user selected conversation
     * NOTE: Also sets stroke/strokeweight to highlight selected rectangle in drawRects method
     * @param  {ConversationPoint} pointToDraw
     * @param  {Integer} view
     */
    recordConversationBubble(pointToDraw, view) {
        this.conversationBubble.isSelected = true;
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
        if (this.conversationBubble.view === this.PLAN) xPos = constrain(curPoint.scaledXPos - textBox.width / 2, textBox.boxSpacing, width - textBox.width - textBox.boxSpacing);
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
//         let pixelTime = map(point.time, 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
//         let scaledTime = map(pixelTime, keys.timeline.selectStart, keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end);
//         let scaledXPos = point.xPos * keys.floorPlan.width / core.inputFloorPlanPixelWidth; // scale to floor plan image file
//         let scaledYPos = point.yPos * keys.floorPlan.height / core.inputFloorPlanPixelHeight; // scale to floor plan image file
//         if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime)) {
//             if (view == this.PLAN) curveVertex(scaledXPos, scaledYPos);
//             else if (view == this.SPACETIME) {
//                 curveVertex(scaledTime, scaledYPos);
//                 this.testPointForBug(scaledTime, scaledXPos, scaledYPos);
//             }
//         }
//     }
//     endShape();
// }