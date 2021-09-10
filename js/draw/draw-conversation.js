class DrawConversation {

    constructor(sketch) {
        this.sk = sketch;
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
            const curPoint = this.sk.sketchController.getScaledPos(point, null);
            if (this.sk.sketchController.testPointIsShowing(curPoint) && this.testSelectMode(curPoint, point)) {
                const curSpeaker = this.getSpeakerFromSpeakerList(point.speaker, speakerList); // get speaker object from global list equivalent to the current speaker of point
                if (this.testSpeakerToDraw(curSpeaker, path.name)) this.organizeRectDrawing(point, curPoint, curSpeaker.color); // draws all rects
            }
        }
    }

    testSelectMode(curPoint, point) {
        switch (this.sk.gui.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                return this.sk.gui.overCursor(curPoint.floorPlanXPos, curPoint.floorPlanYPos);
            case 2:
                return this.sk.gui.overSlicer(curPoint.floorPlanXPos, curPoint.floorPlanYPos);
            case 3:
                return !point.isStopped;
            case 4:
                return point.isStopped;
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
     * Organizes drawing of properly scaled and colored rectangles for conversation turn of a ConversationPoint
     * @param  {ConversationPoint} point
     * @param  {CurPoint} curPoint
     * @param  {Color} curColor
     */
    organizeRectDrawing(point, curPoint, curColor) {
        const curRect = this.getCurRectPos(point, curPoint);
        this.sk.noStroke(); // reset if recordConversationBubble is called previously over2DRects
        this.sk.fill(curColor);
        if (this.sk.sketchController.view3D.isShowing) {
            this.drawFloorPlanRects(curRect);
            this.drawSpaceTime3DRects(curRect);
        } else {
            this.over2DRects(curRect, point);
            this.drawFloorPlanRects(curRect);
            this.drawSpaceTime2DRects(curRect);
        }
    }

    getCurRectPos(point, curPoint) {
        this.sk.textSize(1); // Controls measurement of pixels in a string that corredponds to vertical pixel height of rectangle.
        let rectLength = this.sk.textWidth(point.talkTurn);
        if (rectLength < this.rect.minPixelLength) rectLength = this.rect.minPixelLength; // if current turn is small set it to the minimum height
        let yPos;
        if (this.sk.sketchController.mode.isAlignTalk) yPos = 0;
        else yPos = curPoint.floorPlanYPos - rectLength;
        this.sk.textSize(this.sk.gui.keyTextSize); // reset text size
        return {
            length: rectLength,
            yPos: yPos,
            xPosFloorPlan: curPoint.floorPlanXPos,
            xPosTimeline: curPoint.selTimelineXPos,
            zPos: curPoint.zPos
        }
    }
    /**
     * NOTE: if recordConversationBubble is called, that method also sets new strokeWeight to highlight the curRect
     */
    over2DRects(curRect, point) {
        if (this.sk.overRect(curRect.xPosFloorPlan, curRect.yPos, this.rect.pixelWidth, curRect.length)) this.recordConversationBubble(point, this.sk.PLAN);
        else if (this.sk.overRect(curRect.xPosTimeline, curRect.yPos, this.rect.pixelWidth, curRect.length)) this.recordConversationBubble(point, this.sk.SPACETIME);
    }

    drawFloorPlanRects(curRect) {
        this.sk.rect(curRect.xPosFloorPlan, curRect.yPos, this.rect.pixelWidth, curRect.length);
    }

    drawSpaceTime2DRects(curRect) {
        this.sk.rect(curRect.xPosTimeline, curRect.yPos, this.rect.pixelWidth, curRect.length);
    }

    drawSpaceTime3DRects(curRect) {
        const tempX = 0;
        const tempY = Math.abs(this.sk.sketchController.view3D.zoom);
        if (this.sk.sketchController.mode.isAlignTalk) this.sk.quad(tempX, tempY, curRect.zPos, tempX + curRect.length, tempY, curRect.zPos, tempX + curRect.length, tempY, curRect.zPos + this.rect.pixelWidth, tempX, tempY, curRect.zPos + this.rect.pixelWidth);
        else this.sk.quad(curRect.xPosFloorPlan, curRect.yPos, curRect.zPos, curRect.xPosFloorPlan + curRect.length, curRect.yPos, curRect.zPos, curRect.xPosFloorPlan + curRect.length, curRect.yPos, curRect.zPos + this.rect.pixelWidth, curRect.xPosFloorPlan, curRect.yPos, curRect.zPos + this.rect.pixelWidth);
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
}