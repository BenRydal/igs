class DrawDataMovement {

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
                this.setPathStrokeWeights(1, 10);
                this.setNormalDrawing(path);
                break;
            case 1:
                this.setPathStrokeWeights(1, 10);
                this.setHighlightDrawing(path, this.sk.gui.overCursor.bind(this.sk.gui));
                break;
            case 2:
                this.setPathStrokeWeights(1, 10);
                this.setHighlightDrawing(path, this.sk.gui.overSlicer.bind(this.sk.gui));
                break;
            case 3:
                this.setPathStrokeWeights(1, 0);
                this.setNormalDrawing(path);
                break;
            case 4:
                this.setPathStrokeWeights(0, 10);
                this.setNormalDrawing(path);
                break;
        }
    }

    setPathStrokeWeights(small, large) {
        this.smallPathWeight = small;
        this.largePathWeight = large;
    }

    setNormalDrawing(path) {
        this.draw(this.sk.PLAN, path.movement, path.color);
        this.draw(this.sk.SPACETIME, path.movement, path.color);
    }

    setHighlightDrawing(path, highlightMethod) {
        this.drawWithCursorHighlight(this.sk.PLAN, path.movement, path.color, highlightMethod);
        this.drawWithCursorHighlight(this.sk.SPACETIME, path.movement, path.color, highlightMethod);
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
        let isStopMode = false; // mode indicating if stopped or moving measured by change from last point
        this.sk.beginShape();
        // Start at 1 to test current and prior points for drawing
        for (let i = 1; i < path.length; i++) {
            const curPoint = this.sk.sketchController.getScaledPointValues(path[i], view); // get current and prior points for comparison
            const priorPoint = this.sk.sketchController.getScaledPointValues(path[i - 1], view);
            if (this.sk.sketchController.testMovementPointToDraw(curPoint)) {
                if (view === this.sk.SPACETIME) this.testPointForBug(curPoint.scaledTime, curPoint.scaledXPos, curPoint.scaledYPos);
                if (this.pointsHaveSamePosition(curPoint, priorPoint)) {
                    if (isStopMode) { // if already drawing in stop mode, continue it
                        this.sk.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        this.startEndShape(priorPoint, this.largePathWeight, shade);
                        isStopMode = true;
                    }
                } else {
                    if (isStopMode) { // if drawing in stop mode, end it
                        this.startEndShape(priorPoint, this.smallPathWeight, shade);
                        isStopMode = false;
                    } else {
                        this.sk.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    pointsHaveSamePosition(curPoint, priorPoint) {
        return (curPoint.scaledXPos === priorPoint.scaledXPos && curPoint.scaledYPos === priorPoint.scaledYPos);
    }
    /**
     * Draws path in floor plan OR space-time view
     * Path is separated into segments over cursor with thick line/highlight and not over cursor with thin line and grey color
     * Due to drawing methods in browsers, paths must be separated/segmented to draw different thicknesses or strokes
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     */
    drawWithCursorHighlight(view, path, shade, highlightMethod) {
        this.setLineStyle(this.colorGray);
        let isHighlightMode = false;
        this.sk.beginShape();
        for (const point of path) {
            const curPoint = this.sk.sketchController.getScaledPointValues(point, view);
            if (this.sk.sketchController.testMovementPointToDraw(curPoint)) {
                if (view === this.sk.SPACETIME) this.testPointForBug(curPoint.scaledTime, curPoint.scaledXPos, curPoint.scaledYPos);
                if (highlightMethod(curPoint.scaledXPos, curPoint.scaledYPos)) {
                    if (isHighlightMode) { // if already drawing in cursor mode, continue it
                        this.sk.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    } else { // if not in drawing cursor mode, begin it
                        this.startEndShape(curPoint, this.largePathWeight, shade);
                        isHighlightMode = true;
                    }
                } else {
                    if (isHighlightMode) { // if drawing in cursor mode, end it
                        this.startEndShape(curPoint, this.smallPathWeight, this.colorGray);
                        isHighlightMode = false;
                    } else {
                        this.sk.curveVertex(curPoint.scaledSpaceTimeXPos, curPoint.scaledYPos);
                    }
                }
            }
        }
        this.sk.endShape();
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
        this.sk.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark end point
        this.sk.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(shade);
        this.sk.beginShape();
        this.sk.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark starting point
        this.sk.curveVertex(scaledPoint.scaledSpaceTimeXPos, scaledPoint.scaledYPos);
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

class DrawDataConversation {

    constructor(sketch) {
        this.sk = sketch;
        this.conversationBubble = { // represents user selected conversation
            isSelected: false,
            point: null, // stores one ConversationPoint object for selected conversation turn
            view: this.sk.PLAN // view indicating if user selected conversation in floor plan or space-time views
        };
        this.rect = { // Rect represents key parameters used in drawRects method to scale rectangles
            minPixelHeight: 3, // for really short conversation turns set a minimum pixel height
            minPixelWidth: this.sk.sketchController.mapConversationRectRange(),
            maxPixelWidth: 10
        };
    }


    // TODO: figure out way to draw "first or lsat" conversation rect for each stop/move test
    // TODO: test conversation/movement methods in sk controller--move here?
    // TODO: testRegion/Slice methods--remove eventually?
    /**
     * Organizes drawing of conversation rects
     * @param  {Path} path
     * @param  {[Speaker]} speakerList
     */
    setData(path, speakerList) {
        for (const point of path.conversation) {
            const curPoint = this.sk.sketchController.getScaledPointValues(point, null);
            if (this.sk.sketchController.testConversationPointToDraw(curPoint) && this.testSelectMode(curPoint, point)) {
                const curSpeaker = this.getSpeakerFromSpeakerList(point.speaker, speakerList); // get speaker object from global list equivalent to the current speaker of point
                if (this.testSpeakerToDraw(curSpeaker, path.name)) this.drawRects(point, curSpeaker.color); // draws all rects
            }
        }
    }

    testSelectMode(curPoint, point) {
        switch (this.sk.gui.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                return this.sk.gui.overCursor(curPoint.scaledXPos, curPoint.scaledYPos);
            case 2:
                return this.sk.gui.overSlicer(curPoint.scaledXPos, curPoint.scaledYPos);
            case 3:
                return !point.isStopped;
            case 4:
                return point.isStopped;
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
        return speaker != null && speaker.isShowing && (this.sk.sketchController.mode.isAllTalk || speaker.name === pathName);
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
     * NOTE: A call to recordConversationBubble also results in highlighting current rect this.sk.stroke in this method
     * @param  {ConversationPoint} point
     * @param  {Color} curColor
     */
    drawRects(point, curColor) {
        this.sk.noStroke(); // reset if setDrawText is called previously in loop
        this.sk.textSize(1); // Controls measurement of pixels in a string that corredponds to vertical pixel height of rectangle.
        const rectWidth = this.sk.sketchController.mapRectInverse(this.rect.maxPixelWidth, this.rect.minPixelWidth); // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectLength = this.sk.textWidth(point.talkTurn);
        if (rectLength < this.rect.minPixelHeight) rectLength = this.rect.minPixelHeight; // if current turn is small set it to the minimum height
        const curPoint = this.sk.sketchController.getScaledPointValues(point, null);
        let yPos;
        if (this.sk.sketchController.mode.isAlignTalk) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = curPoint.scaledYPos - rectLength;
        // ***** TEST SET TEXT
        if (this.sk.overRect(curPoint.scaledXPos, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, this.sk.PLAN); // if over plan
        else if (this.sk.overRect(curPoint.scaledTime, yPos, rectWidth, rectLength)) this.recordConversationBubble(point, this.sk.SPACETIME); // if over spacetime
        // ***** DRAW CUR RECT
        this.sk.fill(curColor);
        this.sk.rect(curPoint.scaledXPos, yPos, rectWidth, rectLength); // this.sk.PLAN VIEW
        this.sk.rect(curPoint.scaledTime, yPos, rectWidth, rectLength); // this.sk.SPACETIME VIEW
        this.sk.textSize(this.sk.gui.keyTextSize); // reset
    }

    /**
     * Records user selected conversation
     * NOTE: Also sets this.sk.stroke/strokeweight to highlight selected rectangle in drawRects method
     * @param  {ConversationPoint} pointToDraw
     * @param  {Integer} view
     */
    recordConversationBubble(pointToDraw, view) {
        this.conversationBubble.isSelected = true;
        this.conversationBubble.point = pointToDraw;
        this.conversationBubble.view = view;
        this.sk.stroke(0);
        this.sk.strokeWeight(4);
    }

    /**
     * Draws textbox and cartoon "bubble" for user selected conversation
     * Sets box dimensions based on size of conversation turn/text
     */
    drawTextBox(point) {
        this.sk.textSize(this.sk.gui.keyTextSize);
        const textBox = this.addTextBoxParams(this.getTextBoxParams(), point.talkTurn);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.fill(255, 200);
        this.sk.rect(textBox.xPos - textBox.boxSpacing, textBox.yPos - textBox.boxSpacing, textBox.width + 2 * textBox.boxSpacing, textBox.height + (2 * textBox.boxSpacing));
        this.sk.fill(0);
        this.sk.text(point.speaker + ": " + point.talkTurn, textBox.xPos, textBox.yPos, textBox.width, textBox.height); // text
        // Cartoon bubble lines
        this.sk.stroke(255);
        this.sk.strokeWeight(2);
        this.sk.line(this.sk.mouseX - textBox.rectSpacing, textBox.yPos + textBox.yDif, this.sk.mouseX - textBox.rectSpacing / 2, textBox.yPos + textBox.yDif); // white line to hide black rect under cartoon bubble
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.line(this.sk.mouseX, this.sk.mouseY, this.sk.mouseX - textBox.rectSpacing, textBox.yPos + textBox.yDif);
        this.sk.line(this.sk.mouseX, this.sk.mouseY, this.sk.mouseX - textBox.rectSpacing / 2, textBox.yPos + textBox.yDif);
    }

    getTextBoxParams() {
        return {
            width: this.sk.width / 3, // width of text and textbox drawn
            textLeading: this.sk.width / 57, // textbox leading
            boxSpacing: this.sk.width / 141, // general textBox spacing variable
            rectSpacing: this.sk.width / 28.2, // distance from text rectangle of textbox
        }
    }

    addTextBoxParams(textBox, talkTurn) {
        textBox.height = textBox.textLeading * (Math.ceil(this.sk.textWidth(talkTurn) / textBox.width));
        textBox.xPos = this.sk.constrain(this.sk.mouseX - textBox.width / 2, textBox.boxSpacing, this.sk.width - textBox.width - (2 * textBox.boxSpacing));
        if (this.sk.mouseY < this.sk.height / 2) { //if top half of screen, text box below rectangle
            textBox.yPos = this.sk.mouseY + textBox.rectSpacing;
            textBox.yDif = -textBox.boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            textBox.yPos = this.sk.mouseY - textBox.rectSpacing - textBox.height;
            textBox.yDif = textBox.height + textBox.boxSpacing;
        }
        return textBox;
    }
}