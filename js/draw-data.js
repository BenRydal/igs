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
                this.setDraw(path, "testStops");
                break;
            case 1:
                this.setPathStrokeWeights(1, 10);
                this.setDraw(path, "testCursor");
                break;
            case 2:
                this.setPathStrokeWeights(1, 10);
                this.setDraw(path, "testSlicer");
                break;
            case 3:
                this.setPathStrokeWeights(1, 0);
                this.setDraw(path, "testStops");
                break;
            case 4:
                this.setPathStrokeWeights(0, 10);
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
        // Start at 1 to test current and prior points for drawing
        for (let i = 1; i < movementArray.length; i++) {
            const curPoint = this.sk.sketchController.getScaledPointValues(movementArray[i], view); // get current and prior points for comparison
            const priorPoint = this.sk.sketchController.getScaledPointValues(movementArray[i - 1], view);
            if (this.sk.sketchController.testPointIsShowing(curPoint)) {
                if (view === this.sk.SPACETIME) this.testPointForBug(curPoint.scaledTime, curPoint.scaledXPos, curPoint.scaledYPos);
                if (this.highlightTestMethod(test, curPoint, movementArray[i])) {
                    isHighlightMode = this.highlightTestPassed(isHighlightMode, curPoint, priorPoint, shade);
                } else {
                    isHighlightMode = this.highlightTestFailed(isHighlightMode, curPoint, priorPoint, shade);
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

    // TODO: Please update the var name for scaledSpaceTimexpOS!!!
    highlightTestPassed(isHighlightMode, curPoint, priorPoint, shade) {
        if (isHighlightMode) this.sk.curveVertex(curPoint.scaledPlanOrTimeXPos, curPoint.scaledYPos); // if already drawing in highlight mode, continue it
        else this.startEndShape(priorPoint, this.largePathWeight, shade); // if not drawing in highlight mode, begin it
        return true;
    }

    highlightTestFailed(isHighlightMode, curPoint, priorPoint, shade) {
        if (isHighlightMode) this.startEndShape(priorPoint, this.smallPathWeight, shade); // if drawing in highlight mode, end it
        else this.sk.curveVertex(curPoint.scaledPlanOrTimeXPos, curPoint.scaledYPos);
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
        this.sk.curveVertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark end point
        this.sk.curveVertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(shade);
        this.sk.beginShape();
        this.sk.curveVertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos); // draw cur point twice to mark starting point
        this.sk.curveVertex(scaledPoint.scaledPlanOrTimeXPos, scaledPoint.scaledYPos);
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


    // TODO: testRegion/Slice methods--remove eventually?
    /**
     * Organizes drawing of conversation rects
     * @param  {Path} path
     * @param  {[Speaker]} speakerList
     */
    setData(path, speakerList) {
        for (const point of path.conversation) {
            const curPoint = this.sk.sketchController.getScaledPointValues(point, null);
            if (this.sk.sketchController.testPointIsShowing(curPoint) && this.testSelectMode(curPoint, point)) {
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