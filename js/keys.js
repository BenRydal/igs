class Keys {

    constructor(sketch) {
        this.sketch = sketch;
        this.timeline = {
            start: this.sketch.width * 0.4638,
            end: this.sketch.width * 0.9638,
            selectStart: this.sketch.width * 0.4638,
            selectEnd: this.sketch.width * 0.9638,
            spacing: 25,
            padding: 20,
            doublePadding: 40,
            length: this.sketch.width * 0.9638 - this.sketch.width * 0.4638,
            height: this.sketch.height * .81,
            top: this.sketch.height * .81 - 25,
            bottom: this.sketch.height * .81 + 25,
            thickness: 50,
            isLockedLeft: false,
            isLockedRight: false
        }
        this.floorPlan = {
            width: this.timeline.start - (this.sketch.width - this.timeline.end),
            height: this.timeline.height,
            selectorSize: 100
        }
        this.panel = {
            titleHeight: this.timeline.bottom + (this.timeline.height / 40),
            keyHeight: this.timeline.bottom + (this.timeline.height / 12),
            xPos: this.timeline.start,
            spacing: this.sketch.width / 71,
            isMovement: true // toggle between showing movement/conversation keys
        }
        this.keyTextSize = this.sketch.width / 70;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
    }

    drawKeys(pathList, speakerList) {
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(this.keyTextSize);
        this.drawPanelTitles();
        if (this.panel.isMovement) this.drawPanelKeys(pathList);
        else this.drawPanelKeys(speakerList);
        this.drawTimeline();
        if (this.overFloorPlan(this.sketch.mouseX, this.sketch.mouseY)) this.drawFloorPlanSelector();
        if (this.overSpaceTimeView(this.sketch.mouseX, this.sketch.mouseY)) this.drawSlicer();
        if (this.sketch.sketchController.mode.isIntro) this.drawIntroMsg();
    }

    drawPanelTitles() {
        this.sketch.noStroke();
        this.sketch.fill(this.panel.isMovement ? 0 : 150);
        this.sketch.text("Movement", this.timeline.start, this.panel.titleHeight);
        this.sketch.fill(0);
        this.sketch.text(" | ", this.timeline.start + this.sketch.textWidth("Movement"), this.panel.titleHeight);
        this.sketch.fill(!this.panel.isMovement ? 0 : 150);
        this.sketch.text("Conversation", this.timeline.start + this.sketch.textWidth("Movement | "), this.panel.titleHeight);
    }

    // Loop through speakers and set fill/stroke in this for all if showing/not showing
    drawPanelKeys(list) {
        let currXPos = this.panel.xPos;
        this.sketch.strokeWeight(5);
        for (const person of list) {
            this.sketch.stroke(person.color);
            this.sketch.noFill();
            this.sketch.rect(currXPos, this.panel.keyHeight, this.panel.spacing, this.panel.spacing);
            if (person.isShowing) {
                this.sketch.fill(person.color);
                this.sketch.rect(currXPos, this.panel.keyHeight, this.panel.spacing, this.panel.spacing);
            }
            this.sketch.fill(0);
            this.sketch.noStroke();
            this.sketch.text(person.name, currXPos + 1.3 * this.panel.spacing, this.panel.keyHeight);
            currXPos += (2 * this.panel.spacing) + this.sketch.textWidth(person.name);
        }
    }

    drawTimeline() {
        this.drawSelectionRect();
        this.drawAxis();
        this.drawSelectors();
        this.drawEndLabels();
        this.drawCenterLabel();
    }

    drawSelectionRect() {
        this.sketch.fill(150, 150);
        this.sketch.noStroke();
        if (this.sketch.sketchController.mode.isAnimate) this.drawRect(this.timeline.selectStart, this.timeline.top, this.sketch.sketchController.mapFromTotalToPixelTime(this.sketch.sketchController.animationCounter), this.timeline.bottom);
        else this.drawRect(this.timeline.selectStart, this.timeline.top, this.timeline.selectEnd, this.timeline.bottom);
    }

    drawAxis() {
        this.sketch.stroke(0);
        this.sketch.strokeWeight(1);
        this.sketch.line(this.timeline.start, this.timeline.height, this.timeline.end, this.timeline.height);
    }

    drawSelectors() {
        this.sketch.strokeWeight(4);
        this.sketch.line(this.timeline.selectStart, this.timeline.top, this.timeline.selectStart, this.timeline.bottom);
        this.sketch.line(this.timeline.selectEnd, this.timeline.top, this.timeline.selectEnd, this.timeline.bottom);
    }

    drawEndLabels() {
        this.sketch.noStroke();
        this.sketch.fill(0);
        const leftLabel = Math.floor(this.sketch.sketchController.mapFromPixelToTotalTime(this.timeline.selectStart) / 60);
        const rightLabel = Math.ceil(this.sketch.sketchController.mapFromPixelToTotalTime(this.timeline.selectEnd) / 60);
        this.sketch.text(leftLabel, this.timeline.start + this.timeline.spacing, this.timeline.height);
        this.sketch.text(rightLabel, this.timeline.end - this.timeline.spacing - this.sketch.textWidth(rightLabel), this.timeline.height);
    }

    drawCenterLabel() {
        this.sketch.textAlign(this.sketch.CENTER);
        if (this.overSpaceTimeView(this.sketch.mouseX, this.sketch.mouseY)) {
            const mapMouseX = this.sketch.sketchController.mapFromPixelToSelectedTime(this.sketch.mouseX);
            const timeInSeconds = this.sketch.sketchController.mapFromPixelToTotalTime(mapMouseX);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds - minutes * 60);
            const label = minutes + " minutes  " + seconds + " seconds";
            this.sketch.text(label, this.timeline.start + this.timeline.length / 2, this.timeline.height);
        } else this.sketch.text("MINUTES", this.timeline.start + this.timeline.length / 2, this.timeline.height);
        this.sketch.textAlign(this.sketch.LEFT); // reset
    }

    drawFloorPlanSelector() {
        this.sketch.noFill();
        this.sketch.strokeWeight(3);
        this.sketch.stroke(0);
        this.sketch.circle(this.sketch.mouseX, this.sketch.mouseY, this.floorPlan.selectorSize);
    }

    drawSlicer() {
        this.sketch.fill(0);
        this.sketch.stroke(0);
        this.sketch.strokeWeight(2);
        this.sketch.line(this.sketch.mouseX, 0, this.sketch.mouseX, this.timeline.height);
    }

    drawIntroMsg() {
        this.sketch.rectMode(this.sketch.CENTER);
        this.sketch.stroke(0);
        this.sketch.strokeWeight(1);
        this.sketch.fill(255, 240);
        this.sketch.rect(this.sketch.width / 2, this.sketch.height / 2.5, this.sketch.width / 1.75 + 50, this.sketch.height / 1.75 + 50);
        this.sketch.fill(0);
        this.sketch.textSize(this.keyTextSize);
        this.sketch.text(this.introMsg, this.sketch.width / 2, this.sketch.height / 2.5, this.sketch.width / 1.75, this.sketch.height / 1.75);
        this.sketch.rectMode(this.sketch.CORNER);
    }

    drawRect(xPos, yPos, width, height) {
        this.sketch.rect(xPos, yPos, width - xPos, height - yPos);
    }

    handleKeys(paths, speakerList) {
        this.overMovementConversationButtons();
        if (this.panel.isMovement) this.overPathKeys(paths);
        else this.overSpeakerKeys(speakerList);
    }

    overMovementConversationButtons() {
        this.sketch.textSize(this.keyTextSize);
        let currXPos = this.timeline.start;
        if (this.overRect(currXPos, this.panel.titleHeight, this.panel.spacing + this.sketch.textWidth("Movement"), this.panel.spacing)) this.panel.isMovement = true;
        else if (this.overRect(currXPos + this.sketch.textWidth("Movement | "), this.panel.titleHeight, this.panel.spacing + this.sketch.textWidth("Conversation"), this.panel.spacing)) this.panel.isMovement = false;
    }


    overSpeakerKeys(speakerList) {
        this.sketch.textSize(this.keyTextSize);
        let currXPos = this.panel.xPos;
        for (const speaker of speakerList) {
            let nameWidth = this.sketch.textWidth(speaker.name); // set nameWidth to pixel width of speaker code
            if (this.overRect(currXPos, this.panel.keyHeight, this.panel.spacing + nameWidth, this.panel.spacing)) this.sketch.sketchController.setSpeakerShow(speaker);
            currXPos += this.panel.spacing + nameWidth + this.panel.spacing;
        }
    }

    overPathKeys(pathList) {
        this.sketch.textSize(this.keyTextSize);
        let currXPos = this.panel.xPos;
        for (const path of pathList) {
            const nameWidth = this.sketch.textWidth(path.name); // set nameWidth to pixel width of path name
            if (this.overRect(currXPos, this.panel.keyHeight, this.panel.spacing + nameWidth, this.panel.spacing)) this.sketch.sketchController.setPathShow(path);
            currXPos += this.panel.spacing + nameWidth + this.panel.spacing;
        }
    }

    /**
     * updates selectStart/end vars and is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        if (this.timeline.isLockedLeft || (!this.timeline.isLockedRight && this.overSelector(this.timeline.selectStart))) {
            this.timeline.isLockedLeft = true;
            this.timeline.selectStart = this.sketch.constrain(this.sketch.mouseX, this.timeline.start, this.timeline.end);
            if (this.timeline.selectStart > this.timeline.selectEnd - this.timeline.doublePadding) this.timeline.selectStart = this.timeline.selectEnd - this.timeline.doublePadding; // prevents overstriking
        } else if (this.timeline.isLockedRight || this.overSelector(this.timeline.selectEnd)) {
            this.timeline.isLockedRight = true;
            this.timeline.selectEnd = this.sketch.constrain(this.sketch.mouseX, this.timeline.start, this.timeline.end);
            if (this.timeline.selectEnd < this.timeline.selectStart + this.timeline.doublePadding) this.timeline.selectEnd = this.timeline.selectStart + this.timeline.doublePadding; // prevents overstriking
        }
    }

    overCircle(x, y, diameter) {
        return this.sketch.sqrt(this.sketch.sq(x - this.sketch.mouseX) + this.sketch.sq(y - this.sketch.mouseY)) < diameter / 2;
    }

    overRect(x, y, boxWidth, boxHeight) {
        return this.sketch.mouseX >= x && this.sketch.mouseX <= x + boxWidth && this.sketch.mouseY >= y && this.sketch.mouseY <= y + boxHeight;
    }

    overSpaceTimeView(xPos, yPos) {
        return (xPos >= this.timeline.start && xPos <= this.timeline.end) && (yPos >= 0 && yPos <= this.timeline.top);
    }

    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= this.floorPlan.width) && (yPos >= 0 && yPos <= this.floorPlan.height);
    }

    overCursor(xPos, yPos) {
        return this.overCircle(xPos, yPos, this.floorPlan.selectorSize);
    }

    overFloorPlanAndCursor(xPos, yPos) {
        return !this.overFloorPlan(this.sketch.mouseX, this.sketch.mouseY) || (this.overFloorPlan(this.sketch.mouseX, this.sketch.mouseY) && this.overCursor(xPos, yPos));
    }

    overTimelineAxis(pixelValue) {
        return pixelValue >= this.timeline.selectStart && pixelValue <= this.timeline.selectEnd;
    }

    overSelector(selector) {
        return this.overRect(selector - this.timeline.padding, this.timeline.top, this.timeline.doublePadding, this.timeline.thickness);
    }

    overTimelineAxisRegion() {
        return this.overRect(this.timeline.start - this.timeline.doublePadding, this.timeline.top, this.timeline.length + this.timeline.doublePadding, this.timeline.thickness);
    }
}