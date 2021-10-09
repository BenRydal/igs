class DrawConversation {

    constructor(sketch) {
        this.sk = sketch;
        this.testPoint = new TestPoint(this.sk);
        this.colorByPaths = this.testPoint.getColorMode(); // boolean indicating whether to color by paths or codes
        this.conversationBubble = { // represents user selected conversation
            isSelected: false,
            point: null, // stores one ConversationPoint object for selected conversation turn
            view: this.sk.PLAN // view indicating if user selected conversation in floor plan or space-time views
        };
        this.rect = { // represents rectangles drawn for conversation turns
            minPixelLength: 3, // set minimum pixel length for really short conversation turns
            pixelWidth: this.sk.sketchController.getCurConversationRectWidth() // width needs to be dynamically updated when new data is loaded and timeline scaling is changed by user
        };
    }

    /**
     * Organizes drawing of conversation rects
     * @param  {Path} path
     * @param  {[Speaker]} speakerList
     */
    setData(path, speakerList) {
        for (const point of path.conversation) {
            const curPos = this.getScaledConversationPos(point);
            if (this.testPoint.isShowingInGUI(curPos.timelineXPos) && this.testPoint.selectModeForConversation(curPos.floorPlanXPos, curPos.floorPlanYPos, point.isStopped) && this.testPoint.isShowingInCodeList(point.codes.array)) {
                const curSpeaker = this.getSpeakerFromSpeakerList(point.speaker, speakerList); // get speaker object from global list equivalent to the current speaker of point
                if (this.testSpeakerToDraw(curSpeaker, path.name)) {
                    if (this.colorByPaths) this.organizeRectDrawing(point, curPos, curSpeaker.color);
                    else this.organizeRectDrawing(point, curPos, point.codes.color);
                }
            }
        }
    }

    /**
     * Organizes drawing of single text/textbox for a selected conversation
     * Must be translated to show above all other visual elements with WEBGL renderer
     * NOTE: this is called after all conversation rects are drawn so it is displayed on top visually
     */
    setConversationBubble() {
        if (this.conversationBubble.isSelected) this.sk.translateCanvasForText(this.drawTextBox.bind(this, this.conversationBubble.point));
    }

    /**
     * Organizes drawing of properly scaled and colored rectangles for conversation turn of a ConversationPoint
     * @param  {ConversationPoint} point
     * @param  {curPos} curPos
     * @param  {Color} curColor
     */
    organizeRectDrawing(point, curPos, curColor) {
        this.sk.noStroke(); // reset if recordConversationBubble is called previously over2DRects
        this.sk.fill(curColor);
        if (this.sk.sketchController.handle3D.getIsShowing()) {
            this.drawFloorPlanRects(curPos);
            this.drawSpaceTime3DRects(curPos);
        } else {
            this.over2DRects(point, curPos);
            this.drawFloorPlanRects(curPos);
            this.drawSpaceTime2DRects(curPos);
        }
    }

    /**
     * NOTE: if recordConversationBubble is called, that method also sets new strokeWeight to highlight the curRect
     */
    over2DRects(point, curPos) {
        if (this.sk.overRect(curPos.floorPlanXPos, curPos.yPos, this.rect.pixelWidth, curPos.rectLength)) this.recordConversationBubble(point, this.sk.PLAN);
        else if (this.sk.overRect(curPos.selTimelineXPos, curPos.yPos, this.rect.pixelWidth, curPos.rectLength)) this.recordConversationBubble(point, this.sk.SPACETIME);
    }

    drawFloorPlanRects(curPos) {
        this.sk.rect(curPos.floorPlanXPos, curPos.yPos, this.rect.pixelWidth, curPos.rectLength);
    }

    drawSpaceTime2DRects(curPos) {
        this.sk.rect(curPos.selTimelineXPos, curPos.yPos, this.rect.pixelWidth, curPos.rectLength);
    }

    drawSpaceTime3DRects(curPos) {
        const translateZoom = Math.abs(this.sk.sketchController.handle3D.getCurTranslatePos().zoom);
        if (this.sk.sketchController.mode.isAlignTalk) this.sk.quad(0, translateZoom, curPos.selTimelineXPos, curPos.rectLength, translateZoom, curPos.selTimelineXPos, curPos.rectLength, translateZoom, curPos.selTimelineXPos + this.rect.pixelWidth, 0, translateZoom, curPos.selTimelineXPos + this.rect.pixelWidth);
        else this.sk.quad(curPos.floorPlanXPos, curPos.yPos, curPos.selTimelineXPos, curPos.floorPlanXPos + curPos.rectLength, curPos.yPos, curPos.selTimelineXPos, curPos.floorPlanXPos + curPos.rectLength, curPos.yPos, curPos.selTimelineXPos + this.rect.pixelWidth, curPos.floorPlanXPos, curPos.yPos, curPos.selTimelineXPos + this.rect.pixelWidth);
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
        const textBox = this.addTextBoxParams(this.getTextBoxParams(), point.talkTurn);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.fill(255, 200);
        this.sk.rect(textBox.xPos - textBox.boxSpacing, textBox.yPos - textBox.boxSpacing, textBox.width + 2 * textBox.boxSpacing, textBox.height + (2 * textBox.boxSpacing));
        // Draw Text
        this.sk.fill(0);
        this.sk.text(point.speaker + ": " + point.talkTurn, textBox.xPos, textBox.yPos, textBox.width, textBox.height);
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
            width: this.sk.width / 3,
            textLeading: this.sk.width / 57,
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

    getScaledConversationPos(point) {
        const pos = this.testPoint.getSharedPosValues(point);
        const rectLength = this.getRectLength(point.talkTurn);
        return {
            timelineXPos: pos.timelineXPos,
            selTimelineXPos: pos.selTimelineXPos,
            floorPlanXPos: pos.floorPlanXPos,
            floorPlanYPos: pos.floorPlanYPos,
            rectLength,
            yPos: this.getYPos(pos.floorPlanYPos, rectLength)
        };
    }
    /**
     * Sets length of each conversation turn in GUI display based on textSize method
     * @param  {String} talkTurn
     */
    getRectLength(talkTurn) {
        this.sk.textSize(1); // Controls measurement of pixels in a string that corresponds to vertical pixel height of rectangle.
        let rectLength = this.sk.textWidth(talkTurn);
        if (rectLength < this.rect.minPixelLength) rectLength = this.rect.minPixelLength; // if current turn is small set it to the minimum height
        this.sk.textSize(this.sk.GUITEXTSIZE); // reset text size
        return rectLength;
    }

    // Adjusts positioning of rects correctly for align and 3D views
    getYPos(floorPlanYPos, rectLength) {
        if (this.sk.sketchController.mode.isAlignTalk) return 0;
        else if (this.sk.sketchController.handle3D.getIsShowing()) return floorPlanYPos; // REMOVED subtract rectLength
        else return floorPlanYPos - rectLength;
    }
}