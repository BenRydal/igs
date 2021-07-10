class Keys {

    constructor(sketch) {
        this.sk = sketch;
        this.timeline = {
            start: this.sk.width * 0.4638,
            end: this.sk.width * 0.9638,
            selectStart: this.sk.width * 0.4638,
            selectEnd: this.sk.width * 0.9638,
            spacing: 25,
            padding: 20,
            doublePadding: 40,
            length: this.sk.width * 0.9638 - this.sk.width * 0.4638,
            height: this.sk.height * .81,
            top: this.sk.height * .81 - 25,
            bottom: this.sk.height * .81 + 25,
            thickness: 50,
            isLockedLeft: false,
            isLockedRight: false
        }
        this.floorPlan = {
            width: this.timeline.start - (this.sk.width - this.timeline.end),
            height: this.timeline.height,
            selectorSize: 100
        }
        this.panel = {
            titleHeight: this.timeline.bottom + (this.timeline.height / 40),
            keyHeight: this.timeline.bottom + (this.timeline.height / 12),
            xPos: this.timeline.start,
            spacing: this.sk.width / 71,
            isMovement: true // toggle between showing movement/conversation keys
        }
        this.keyTextSize = this.sk.width / 70;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
    }

    drawKeys(pathList, speakerList) {
        this.sk.textAlign(this.sk.LEFT, this.sk.TOP);
        this.sk.textSize(this.keyTextSize);
        this.drawPanelTitles();
        if (this.panel.isMovement) this.drawPanelKeys(pathList);
        else this.drawPanelKeys(speakerList);
        this.drawTimeline();
        if (this.overFloorPlan(this.sk.mouseX, this.sk.mouseY)) this.drawFloorPlanSelector();
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.drawSlicer();
        if (this.sk.sketchController.mode.isIntro) this.drawIntroMsg();
    }

    drawPanelTitles() {
        this.sk.noStroke();
        this.sk.fill(this.panel.isMovement ? 0 : 150);
        this.sk.text("Movement", this.timeline.start, this.panel.titleHeight);
        this.sk.fill(0);
        this.sk.text(" | ", this.timeline.start + this.sk.textWidth("Movement"), this.panel.titleHeight);
        this.sk.fill(!this.panel.isMovement ? 0 : 150);
        this.sk.text("Conversation", this.timeline.start + this.sk.textWidth("Movement | "), this.panel.titleHeight);
    }

    // Loop through speakers and set fill/stroke in this for all if showing/not showing
    drawPanelKeys(list) {
        let currXPos = this.panel.xPos;
        this.sk.strokeWeight(5);
        for (const person of list) {
            this.sk.stroke(person.color);
            this.sk.noFill();
            this.sk.rect(currXPos, this.panel.keyHeight, this.panel.spacing, this.panel.spacing);
            if (person.isShowing) {
                this.sk.fill(person.color);
                this.sk.rect(currXPos, this.panel.keyHeight, this.panel.spacing, this.panel.spacing);
            }
            this.sk.fill(0);
            this.sk.noStroke();
            this.sk.text(person.name, currXPos + 1.3 * this.panel.spacing, this.panel.keyHeight);
            currXPos += (2 * this.panel.spacing) + this.sk.textWidth(person.name);
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
        this.sk.fill(150, 150);
        this.sk.noStroke();
        if (this.sk.sketchController.mode.isAnimate) this.drawRect(this.timeline.selectStart, this.timeline.top, this.sk.sketchController.mapFromTotalToPixelTime(this.sk.sketchController.animationCounter), this.timeline.bottom);
        else this.drawRect(this.timeline.selectStart, this.timeline.top, this.timeline.selectEnd, this.timeline.bottom);
    }

    drawAxis() {
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.line(this.timeline.start, this.timeline.height, this.timeline.end, this.timeline.height);
    }

    drawSelectors() {
        this.sk.strokeWeight(4);
        this.sk.line(this.timeline.selectStart, this.timeline.top, this.timeline.selectStart, this.timeline.bottom);
        this.sk.line(this.timeline.selectEnd, this.timeline.top, this.timeline.selectEnd, this.timeline.bottom);
    }

    drawEndLabels() {
        this.sk.noStroke();
        this.sk.fill(0);
        const leftLabel = Math.floor(this.sk.sketchController.mapFromPixelToTotalTime(this.timeline.selectStart) / 60);
        const rightLabel = Math.ceil(this.sk.sketchController.mapFromPixelToTotalTime(this.timeline.selectEnd) / 60);
        this.sk.text(leftLabel, this.timeline.start + this.timeline.spacing, this.timeline.height);
        this.sk.text(rightLabel, this.timeline.end - this.timeline.spacing - this.sk.textWidth(rightLabel), this.timeline.height);
    }

    drawCenterLabel() {
        this.sk.textAlign(this.sk.CENTER);
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) {
            const mapMouseX = this.sk.sketchController.mapFromPixelToSelectedTime(this.sk.mouseX);
            const timeInSeconds = this.sk.sketchController.mapFromPixelToTotalTime(mapMouseX);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds - minutes * 60);
            const label = minutes + " minutes  " + seconds + " seconds";
            this.sk.text(label, this.timeline.start + this.timeline.length / 2, this.timeline.height);
        } else this.sk.text("MINUTES", this.timeline.start + this.timeline.length / 2, this.timeline.height);
        this.sk.textAlign(this.sk.LEFT); // reset
    }

    drawFloorPlanSelector() {
        this.sk.noFill();
        this.sk.strokeWeight(3);
        this.sk.stroke(0);
        this.sk.circle(this.sk.mouseX, this.sk.mouseY, this.floorPlan.selectorSize);
    }

    drawSlicer() {
        this.sk.fill(0);
        this.sk.stroke(0);
        this.sk.strokeWeight(2);
        this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.timeline.height);
    }

    drawIntroMsg() {
        this.sk.rectMode(this.sk.CENTER);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.fill(255, 240);
        this.sk.rect(this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75 + 50, this.sk.height / 1.75 + 50);
        this.sk.fill(0);
        this.sk.textSize(this.keyTextSize);
        this.sk.text(this.introMsg, this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75, this.sk.height / 1.75);
        this.sk.rectMode(this.sk.CORNER);
    }

    drawRect(xPos, yPos, width, height) {
        this.sk.rect(xPos, yPos, width - xPos, height - yPos);
    }

    handleKeys(paths, speakerList) {
        this.overMovementConversationButtons();
        if (this.panel.isMovement) this.overPathKeys(paths);
        else this.overSpeakerKeys(speakerList);
    }

    overMovementConversationButtons() {
        this.sk.textSize(this.keyTextSize);
        let currXPos = this.timeline.start;
        if (this.overRect(currXPos, this.panel.titleHeight, this.panel.spacing + this.sk.textWidth("Movement"), this.panel.spacing)) this.panel.isMovement = true;
        else if (this.overRect(currXPos + this.sk.textWidth("Movement | "), this.panel.titleHeight, this.panel.spacing + this.sk.textWidth("Conversation"), this.panel.spacing)) this.panel.isMovement = false;
    }

    overPathKeys(pathList) {
        this.sk.textSize(this.keyTextSize);
        let currXPos = this.panel.xPos;
        for (const path of pathList) {
            const nameWidth = this.sk.textWidth(path.name); // set nameWidth to pixel width of path name
            if (this.overRect(currXPos, this.panel.keyHeight, this.panel.spacing + nameWidth, this.panel.spacing)) this.setPathShow(path);
            currXPos += this.panel.spacing + nameWidth + this.panel.spacing;
        }
    }

    overSpeakerKeys(speakerList) {
        this.sk.textSize(this.keyTextSize);
        let currXPos = this.panel.xPos;
        for (const speaker of speakerList) {
            let nameWidth = this.sk.textWidth(speaker.name); // set nameWidth to pixel width of speaker code
            if (this.overRect(currXPos, this.panel.keyHeight, this.panel.spacing + nameWidth, this.panel.spacing)) this.setSpeakerShow(speaker);
            currXPos += this.panel.spacing + nameWidth + this.panel.spacing;
        }
    }

    /**
     * NOTE: these setters are modifying core vars but this still seems to be best solution
     */
    setSpeakerShow(speaker) {
        speaker.isShowing = !speaker.isShowing;
    }

    setPathShow(path) {
        path.isShowing = !path.isShowing;
    }

    /**
     * updates selectStart/end vars and is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        if (this.timeline.isLockedLeft || (!this.timeline.isLockedRight && this.overSelector(this.timeline.selectStart))) {
            this.timeline.isLockedLeft = true;
            this.timeline.selectStart = this.sk.constrain(this.sk.mouseX, this.timeline.start, this.timeline.end);
            if (this.timeline.selectStart > this.timeline.selectEnd - this.timeline.doublePadding) this.timeline.selectStart = this.timeline.selectEnd - this.timeline.doublePadding; // prevents overstriking
        } else if (this.timeline.isLockedRight || this.overSelector(this.timeline.selectEnd)) {
            this.timeline.isLockedRight = true;
            this.timeline.selectEnd = this.sk.constrain(this.sk.mouseX, this.timeline.start, this.timeline.end);
            if (this.timeline.selectEnd < this.timeline.selectStart + this.timeline.doublePadding) this.timeline.selectEnd = this.timeline.selectStart + this.timeline.doublePadding; // prevents overstriking
        }
    }

    overCircle(x, y, diameter) {
        return this.sk.sqrt(this.sk.sq(x - this.sk.mouseX) + this.sk.sq(y - this.sk.mouseY)) < diameter / 2;
    }

    overRect(x, y, boxWidth, boxHeight) {
        return this.sk.mouseX >= x && this.sk.mouseX <= x + boxWidth && this.sk.mouseY >= y && this.sk.mouseY <= y + boxHeight;
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
        return !this.overFloorPlan(this.sk.mouseX, this.sk.mouseY) || (this.overFloorPlan(this.sk.mouseX, this.sk.mouseY) && this.overCursor(xPos, yPos));
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