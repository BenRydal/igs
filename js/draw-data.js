class DrawDataMovement {

    constructor(sketch) {
        this.sketch = sketch;
        this.bug = { // represents user selection dot drawn in both floor plan and space-time views
            xPos: NO_DATA, // number/float values
            yPos: NO_DATA,
            timePos: NO_DATA,
            size: width / 50,
            lengthToCompare: this.sketch.keys.timeline.length // used to compare data points to find closest bug value
        };
        this.smallPathWeight = 3;
        this.largePathWeight = 6;
        this.colorGray = 150;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        if (this.sketch.keys.overFloorPlan(this.sketch.mouseX, this.sketch.mouseY)) {
            this.drawWithCursorHighlight(this.sketch.PLAN, path.movement, path.color);
            this.drawWithCursorHighlight(this.sketch.SPACETIME, path.movement, path.color);
        } else {
            this.draw(this.sketch.PLAN, path.movement, path.color);
            this.draw(this.sketch.SPACETIME, path.movement, path.color);
        }
        if (this.bug.xPos != NO_DATA) this.drawBug(path.color); // if selected, draw bug
    }

    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments of stops with thick line thickness and moving of thinner line thickness
     * Due to drawing methods in browsers, paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    draw(view, path, shade) {
        this.setLineStyle(shade);
        let stop_Mode = false; // mode indicating if stopped or moving measured by change from last point
        this.sketch.beginShape();
        // Start at 1 to test current and prior points for drawing
        for (let i = 1; i < path.length; i++) {
            const curPoint = this.sketch.sketchController.getScaledPointValues(path[i], view); // get current and prior points for comparison
            const priorPoint = this.sketch.sketchController.getScaledPointValues(path[i - 1], view);
            if (this.sketch.sketchController.testMovementPointToDraw(curPoint)) {
                if (view === this.sketch.SPACETIME) this.testPointForBug(curPoint.scaledTime, curPoint.scaledXPos, curPoint.scaledYPos);
                if (curPoint.scaledXPos === priorPoint.scaledXPos && curPoint.scaledYPos === priorPoint.scaledYPos) {
                    if (stop_Mode) { // if already drawing in stop mode, continue it
                        this.sketch.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        this.startEndShape(priorPoint, this.largePathWeight, shade);
                        stop_Mode = true;
                    }
                } else {
                    if (stop_Mode) { // if drawing in stop mode, end it
                        this.startEndShape(priorPoint, this.smallPathWeight, shade);
                        stop_Mode = false;
                    } else {
                        this.sketch.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        this.sketch.endShape(); // end shape in case still drawing
    }

    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments over cursor with thick line/highlight and not over cursor with thin line and grey color
     * Due to drawing methods in browsers, paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    drawWithCursorHighlight(view, path, shade) {
        this.setLineStyle(this.colorGray);
        let over_Cursor_Mode = false;
        this.sketch.beginShape();
        for (const point of path) {
            const curPoint = this.sketch.sketchController.getScaledPointValues(point, view);
            if (this.sketch.sketchController.testMovementPointToDraw(curPoint)) {
                if (view === this.sketch.SPACETIME) this.testPointForBug(curPoint.scaledTime, curPoint.scaledXPos, curPoint.scaledYPos);
                if (this.sketch.keys.overCursor(curPoint.scaledXPos, curPoint.scaledYPos)) {
                    if (over_Cursor_Mode) { // if already drawing in cursor mode, continue it
                        this.sketch.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    } else { // if not in drawing cursor mode, begin it
                        this.startEndShape(curPoint, this.largePathWeight, shade);
                        over_Cursor_Mode = true;
                    }
                } else {
                    if (over_Cursor_Mode) { // if drawing in cursor mode, end it
                        this.startEndShape(curPoint, this.smallPathWeight, this.colorGray);
                        over_Cursor_Mode = false;
                    } else {
                        this.sketch.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        this.sketch.endShape();
    }

    setLineStyle(lineColor) {
        this.sketch.strokeWeight(this.smallPathWeight);
        this.sketch.stroke(lineColor);
        this.sketch.noFill(); // important for curve drawing
    }

    /**
     * Ends and begins a new drawing shape
     * Draws two vertices to indicate starting and ending points
     * Sets correct strokeweight and this.sketch.stroke depending on parameters for new shape
     * @param  {Object returned from getScaledPointValues} scaledPoint
     * @param  {Integer} weight
     * @param  {Color} shade
     */
    startEndShape(scaledPoint, weight, shade) {
        this.sketch.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark end point
        this.sketch.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos);
        this.sketch.endShape();
        this.sketch.strokeWeight(weight);
        this.sketch.stroke(shade);
        this.sketch.beginShape();
        this.sketch.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark starting point
        this.sketch.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos);
    }

    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (this.sketch.sketchController.mode.isAnimate) this.recordBug(scaledTimeToTest, xPos, yPos, NO_DATA); // always return true to set last/most recent point as the bug
        else if (this.sketch.sketchController.mode.isVideoPlay) {
            const selTime = this.sketch.sketchController.mapFromVideoToSelectedTime();
            if (this.compareValuesBySpacing(selTime, scaledTimeToTest, this.bug.lengthToCompare)) this.recordBug(scaledTimeToTest, xPos, yPos, Math.abs(selTime - scaledTimeToTest));
        } else if (this.sketch.keys.overSpaceTimeView(this.sketch.mouseX, this.sketch.mouseY) && this.compareValuesBySpacing(this.sketch.mouseX, scaledTimeToTest, this.bug.lengthToCompare)) this.recordBug(this.sketch.mouseX, xPos, yPos, Math.abs(this.sketch.mouseX - scaledTimeToTest));
    }

    compareValuesBySpacing(value1, value2, spacing) {
        return value1 >= value2 - spacing && value1 <= value2 + spacing;
    }

    resetBug() {
        this.bug.xPos = NO_DATA;
        this.bug.yPos = NO_DATA;
        this.bug.timePos = NO_DATA;
        this.bug.lengthToCompare = this.sketch.keys.timeline.length;
    }

    recordBug(timePos, xPos, yPos, lengthToCompare) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
        this.bug.timePos = timePos;
        this.bug.lengthToCompare = lengthToCompare;
        this.sketch.sketchController.bugTimeForVideoScrub = timePos;
    }

    drawBug(shade) {
        this.sketch.stroke(0);
        this.sketch.strokeWeight(5);
        this.sketch.fill(shade);
        this.sketch.ellipse(this.bug.xPos, this.bug.yPos, this.bug.size, this.bug.size);
        this.sketch.ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }
}

class DrawDataConversation {

    constructor(sketch) {
        this.sketch = sketch;
        this.conversationBubble = { // represents user selected conversation
            isSelected: false,
            point: NO_DATA, // stores one ConversationPoint object for selected conversation turn
            view: this.sketch.PLAN // view indicating if user selected conversation in floor plan or space-time views
        };
        this.rect = { // Rect represents key parameters used in drawRects method to scale rectangles
            minPixelHeight: 3, // for really short conversation turns set a minimum pixel height
            minPixelWidth: this.sketch.sketchController.mapConversationRectRange(),
            maxPixelWidth: 10
        };
    }

    /**
     * Organizes drawing of conversation rects
     * @param  {Path} path
     * @param  {[Speaker]} speakerList
     */
    setData(path, speakerList) {
        for (const point of path.conversation) {
            const curPoint = this.sketch.sketchController.getScaledPointValues(point, NO_DATA);
            if (this.sketch.sketchController.testConversationPointToDraw(curPoint)) {
                const curSpeaker = this.getSpeakerFromSpeakerList(point.speaker, speakerList); // get speaker object from global list equivalent to the current speaker of point
                if (this.testSpeakerToDraw(curSpeaker, path.name)) this.drawRects(point, curSpeaker.color); // draws all rects
            }
        }
    }
    /**
     * Organizes drawing of single text/textbox for a selected conversation
     * NOTE: this is called after all conversation rects are drawn so it is displayed on top visually
     */
    setConversationBubble() {
        if (this.conversationBubble.isSelected) this.drawTextBox(this.conversationBubble.point);
    }

    /**
     * Tests whether to draw selected speaker
     * Speaker must be showing and either program on all talk mode or speaker matches pathname
     * @param  {Char} speaker
     * @param  {Char} pathName
     */
    testSpeakerToDraw(speaker, pathName) {
        return speaker != null && speaker.isShowing && (this.sketch.sketchController.mode.isAllTalk || speaker.name === pathName);
    }

    /**
     * Returns speaker object based from global speaker list if it matches passed character paramater
     * Returns null if no match found
     * @param  {Char} curSpeaker
     */
    getSpeakerFromSpeakerList(curSpeaker, speakerList) {
        for (const speaker of speakerList) {
            if (speaker.name === curSpeaker) return speaker;
        }
        return null;
    }

    /**
     * Draws properly scaled and colored rectangled for conversation turn of a ConversationPoint
     * Also tests if conversation turn has been selected by user and sends to recordConversationBubble if so
     * NOTE: A call to recordConversationBubble also results in highlighting current rect this.sketch.stroke in this method
     * @param  {ConversationPoint} point
     * @param  {Color} curColor
     */
    drawRects(point, curColor) {
        this.sketch.noStroke(); // reset if setDrawText is called previously in loop
        this.sketch.textSize(1); // Controls measurement of pixels in a string that corredponds to vertical pixel height of rectangle.
        const rectWidth = this.sketch.map(this.sketch.keys.timeline.selectEnd - this.sketch.keys.timeline.selectStart, 0, this.sketch.keys.timeline.length, this.rect.maxPixelWidth, this.rect.minPixelWidth); // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectLength = this.sketch.textWidth(point.talkTurn);
        if (rectLength < this.rect.minPixelHeight) rectLength = this.rect.minPixelHeight; // if current turn is small set it to the minimum height
        const curPoint = this.sketch.sketchController.getScaledPointValues(point, NO_DATA);
        let yPos;
        if (this.sketch.sketchController.mode.isAlignTalk) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = curPoint.scaledYPos - rectLength;
        // ***** TEST SET TEXT
        if (this.sketch.keys.overRect(curPoint.scaledXPos, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, this.sketch.PLAN); // if over plan
        else if (this.sketch.keys.overRect(curPoint.scaledTime, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, this.sketch.SPACETIME); // if over spacetime
        // ***** DRAW CUR RECT
        this.sketch.fill(curColor);
        this.sketch.rect(curPoint.scaledXPos, yPos, rectWidth, rectLength); // this.sketch.PLAN VIEW
        this.sketch.rect(curPoint.scaledTime, yPos, rectWidth, rectLength); // this.sketch.SPACETIME VIEW
        this.sketch.textSize(this.sketch.keys.keyTextSize); // reset
    }

    /**
     * Records user selected conversation
     * NOTE: Also sets this.sketch.stroke/strokeweight to highlight selected rectangle in drawRects method
     * @param  {ConversationPoint} pointToDraw
     * @param  {Integer} view
     */
    recordConversationBubble(pointToDraw, view) {
        this.conversationBubble.isSelected = true;
        this.conversationBubble.point = pointToDraw;
        this.conversationBubble.view = view;
        this.sketch.stroke(0);
        this.sketch.strokeWeight(4);
    }

    /**
     * Draws textbox and cartoon "bubble" for user selected conversation
     * Sets box dimensions based on size of conversation turn/text
     */
    drawTextBox(point) {
        this.sketch.textSize(this.sketch.keys.keyTextSize);
        const textBox = this.addTextBoxParams(this.getTextBoxParams(), point.talkTurn);
        this.sketch.stroke(0);
        this.sketch.strokeWeight(1);
        this.sketch.fill(255, 200);
        this.sketch.rect(textBox.xPos - textBox.boxSpacing, textBox.yPos - textBox.boxSpacing, textBox.width + 2 * textBox.boxSpacing, textBox.height + (2 * textBox.boxSpacing));
        this.sketch.fill(0);
        this.sketch.text(point.speaker + ": " + point.talkTurn, textBox.xPos, textBox.yPos, textBox.width, textBox.height); // text
        // Cartoon bubble lines
        this.sketch.stroke(255);
        this.sketch.strokeWeight(2);
        this.sketch.line(this.sketch.mouseX - textBox.rectSpacing, textBox.yPos + textBox.yDif, this.sketch.mouseX - textBox.rectSpacing / 2, textBox.yPos + textBox.yDif); // white line to hide black rect under cartoon bubble
        this.sketch.stroke(0);
        this.sketch.strokeWeight(1);
        this.sketch.line(this.sketch.mouseX, this.sketch.mouseY, this.sketch.mouseX - textBox.rectSpacing, textBox.yPos + textBox.yDif);
        this.sketch.line(this.sketch.mouseX, this.sketch.mouseY, this.sketch.mouseX - textBox.rectSpacing / 2, textBox.yPos + textBox.yDif);
    }

    getTextBoxParams() {
        return {
            width: this.sketch.width / 3, // width of text and textbox drawn
            textLeading: this.sketch.width / 57, // textbox leading
            boxSpacing: this.sketch.width / 141, // general textBox spacing variable
            rectSpacing: this.sketch.width / 28.2, // distance from text rectangle of textbox
        }
    }

    addTextBoxParams(textBox, talkTurn) {
        textBox.height = textBox.textLeading * (ceil(this.sketch.textWidth(talkTurn) / textBox.width));
        textBox.xPos = constrain(this.sketch.mouseX - textBox.width / 2, textBox.boxSpacing, this.sketch.width - textBox.width - (2 * textBox.boxSpacing));
        if (this.sketch.mouseY < this.sketch.height / 2) { //if top half of screen, text box below rectangle
            textBox.yPos = this.sketch.mouseY + textBox.rectSpacing;
            textBox.yDif = -textBox.boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            textBox.yPos = this.sketch.mouseY - textBox.rectSpacing - textBox.height;
            textBox.yDif = textBox.height + textBox.boxSpacing;
        }
        return textBox;
    }
}

/**
 * Simplest drawing method.
 * Draws movement path with no change in this.sketch.stroke color or weight
 * @param  {Integer} view
 * @param  {Path} path
 * @param  {Color} shade
 */
// draw(view, points, shade) {
//     this.sketch.strokeWeight(pathWeight);
//     this.sketch.stroke(shade);
//     this.sketch.noFill(); // important for curve drawing
//     this.sketch.beginShape();
//     for (let i = 0; i < points.length; i++) {
//         let point = points[i];
//         let pixelTime = map(point.time, 0, core.totalTimeInSeconds, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
//         let scaledTime = map(pixelTime, this.sketch.keys.timeline.selectStart, this.sketch.keys.timeline.selectEnd, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
//         let scaledXPos = point.xPos * this.sketch.keys.floorPlan.width / core.inputFloorPlanPixelWidth; // scale to floor plan image file
//         let scaledYPos = point.yPos * this.sketch.keys.floorPlan.height / core.inputFloorPlanPixelHeight; // scale to floor plan image file
//         if (this.sketch.keys.overTimelineAxis(pixelTime) && this.sketch.keys.overFloorPlan(scaledXPos, scaledYPos) && this.sketch.keys.testAnimation(pixelTime)) {
//             if (view == this.sketch.PLAN) this.sketch.curveVertex(scaledXPos, scaledYPos);
//             else if (view == this.sketch.SPACETIME) {
//                 this.sketch.curveVertex(scaledTime, scaledYPos);
//                 this.testPointForBug(scaledTime, scaledXPos, scaledYPos);
//             }
//         }
//     }
//     this.sketch.endShape();
// }