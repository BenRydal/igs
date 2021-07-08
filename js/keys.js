class Keys {

    constructor() {
        this.timeline = {
            start: width * 0.4638,
            end: width * 0.9638,
            selectStart: width * 0.4638,
            selectEnd: width * 0.9638,
            spacing: 25,
            padding: 20,
            doublePadding: 40,
            length: width * 0.9638 - width * 0.4638,
            height: height * .81,
            top: height * .81 - 25,
            bottom: height * .81 + 25,
            thickness: 50,
            isLockedLeft: false,
            isLockedRight: false
        }
        this.floorPlan = {
            width: this.timeline.start - (width - this.timeline.end),
            height: this.timeline.height,
            selectorSize: 100
        }
        this.panel = {
            titleHeight: this.timeline.bottom + (this.timeline.height / 40),
            keyHeight: this.timeline.bottom + (this.timeline.height / 12),
            xPos: this.timeline.start,
            spacing: width / 71
        }
        this.keyTextSize = width / 70;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
    }

    drawKeys(pathList, speakerList) {
        textAlign(LEFT, TOP);
        textSize(this.keyTextSize);
        this.drawPanelTitles();
        if (sketchController.mode.isMovement) this.drawPanelKeys(pathList);
        else this.drawPanelKeys(speakerList);
        this.drawTimeline();
        if (this.overFloorPlan(mouseX, mouseY)) this.drawFloorPlanSelector();
        if (this.overSpaceTimeView(mouseX, mouseY)) this.drawSlicer();
        if (sketchController.mode.isIntro) this.drawIntroMsg();
    }

    drawPanelTitles() {
        noStroke();
        fill(sketchController.mode.isMovement ? 0 : 150);
        text("Movement", this.timeline.start, this.panel.titleHeight);
        fill(0);
        text(" | ", this.timeline.start + textWidth("Movement"), this.panel.titleHeight);
        fill(!sketchController.mode.isMovement ? 0 : 150);
        text("Conversation", this.timeline.start + textWidth("Movement | "), this.panel.titleHeight);
    }

    // Loop through speakers and set fill/stroke in this for all if showing/not showing
    drawPanelKeys(list) {
        let currXPos = this.panel.xPos;
        strokeWeight(5);
        for (const person of list) {
            stroke(person.color);
            noFill();
            rect(currXPos, this.panel.keyHeight, this.panel.spacing, this.panel.spacing);
            if (person.show) {
                fill(person.color);
                rect(currXPos, this.panel.keyHeight, this.panel.spacing, this.panel.spacing);
            }
            fill(0);
            noStroke();
            text(person.name, currXPos + 1.3 * this.panel.spacing, this.panel.keyHeight);
            currXPos += (2 * this.panel.spacing) + textWidth(person.name);
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
        fill(150, 150);
        noStroke();
        if (sketchController.mode.isAnimate) this.drawRect(this.timeline.selectStart, this.timeline.top, sketchController.mapFromTotalToPixelTime(sketchController.animationCounter), this.timeline.bottom);
        else this.drawRect(this.timeline.selectStart, this.timeline.top, this.timeline.selectEnd, this.timeline.bottom);
    }

    drawAxis() {
        stroke(0);
        strokeWeight(1);
        line(this.timeline.start, this.timeline.height, this.timeline.end, this.timeline.height);
    }

    drawSelectors() {
        strokeWeight(4);
        line(this.timeline.selectStart, this.timeline.top, this.timeline.selectStart, this.timeline.bottom);
        line(this.timeline.selectEnd, this.timeline.top, this.timeline.selectEnd, this.timeline.bottom);
    }

    drawEndLabels() {
        noStroke();
        fill(0);
        const leftLabel = Math.floor(sketchController.mapFromPixelToTotalTime(this.timeline.selectStart) / 60);
        const rightLabel = Math.ceil(sketchController.mapFromPixelToTotalTime(this.timeline.selectEnd) / 60);
        text(leftLabel, this.timeline.start + this.timeline.spacing, this.timeline.height);
        text(rightLabel, this.timeline.end - this.timeline.spacing - textWidth(rightLabel), this.timeline.height);
    }

    drawCenterLabel() {
        textAlign(CENTER);
        if (this.overSpaceTimeView(mouseX, mouseY)) {
            const mapMouseX = sketchController.mapFromPixelToSelectedTime(mouseX);
            const timeInSeconds = sketchController.mapFromPixelToTotalTime(mapMouseX);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds - minutes * 60);
            const label = minutes + " minutes  " + seconds + " seconds";
            text(label, this.timeline.start + this.timeline.length / 2, this.timeline.height);
        } else text("MINUTES", this.timeline.start + this.timeline.length / 2, this.timeline.height);
        textAlign(LEFT); // reset
    }

    drawFloorPlanSelector() {
        noFill();
        strokeWeight(3);
        stroke(0);
        circle(mouseX, mouseY, this.floorPlan.selectorSize);
    }

    drawSlicer() {
        fill(0);
        stroke(0);
        strokeWeight(2);
        line(mouseX, 0, mouseX, this.timeline.height);
    }

    drawIntroMsg() {
        rectMode(CENTER);
        stroke(0);
        strokeWeight(1);
        fill(255, 240);
        rect(width / 2, height / 2.5, width / 1.75 + 50, height / 1.75 + 50);
        fill(0);
        textSize(this.keyTextSize);
        text(this.introMsg, width / 2, height / 2.5, width / 1.75, height / 1.75);
        rectMode(CORNER);
    }

    drawRect(xPos, yPos, width, height) {
        rect(xPos, yPos, width - xPos, height - yPos);
    }

    overCircle(x, y, diameter) {
        return sqrt(sq(x - mouseX) + sq(y - mouseY)) < diameter / 2;
    }

    overRect(x, y, boxWidth, boxHeight) {
        return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
    }

    overSpaceTimeView(xPos, yPos) {
        return (xPos >= this.timeline.start && xPos <= this.timeline.end) && (yPos >= 0 && yPos <= this.timeline.height);
    }

    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= this.floorPlan.width) && (yPos >= 0 && yPos <= this.floorPlan.height);
    }

    overCursor(xPos, yPos) {
        return this.overCircle(xPos, yPos, this.floorPlan.selectorSize);
    }

    overFloorPlanAndCursor(xPos, yPos) {
        return !this.overFloorPlan(mouseX, mouseY) || (this.overFloorPlan(mouseX, mouseY) && this.overCursor(xPos, yPos));
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

    overMovementConversationButtons() {
        textSize(this.keyTextSize);
        let currXPos = this.timeline.start;
        if (this.overRect(currXPos, this.panel.titleHeight, this.panel.spacing + textWidth("Movement"), this.panel.spacing)) sketchController.mode.isMovement = true;
        else if (this.overRect(currXPos + textWidth("Movement | "), this.panel.titleHeight, this.panel.spacing + textWidth("Conversation"), this.panel.spacing)) sketchController.mode.isMovement = false;
    }


    overSpeakerKeys(speakerList) {
        textSize(this.keyTextSize);
        let currXPos = this.panel.xPos;
        for (const speaker of speakerList) {
            let nameWidth = textWidth(speaker.name); // set nameWidth to pixel width of speaker code
            if (this.overRect(currXPos, this.panel.keyHeight, this.panel.spacing + nameWidth, this.panel.spacing)) sketchController.setSpeakerShow(speaker);
            currXPos += this.panel.spacing + nameWidth + this.panel.spacing;
        }
    }

    overPathKeys(pathList) {
        textSize(this.keyTextSize);
        let currXPos = this.panel.xPos;
        for (const path of pathList) {
            const nameWidth = textWidth(path.name); // set nameWidth to pixel width of path name
            if (this.overRect(currXPos, this.panel.keyHeight, this.panel.spacing + nameWidth, this.panel.spacing)) sketchController.setPathShow(path);
            currXPos += this.panel.spacing + nameWidth + this.panel.spacing;
        }
    }

    /**
     * updates selectStart/end vars and is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        if (this.timeline.isLockedLeft || (!this.timeline.isLockedRight && this.overSelector(this.timeline.selectStart))) {
            this.timeline.isLockedLeft = true;
            this.timeline.selectStart = constrain(mouseX, this.timeline.start, this.timeline.end);
            if (this.timeline.selectStart > this.timeline.selectEnd - this.timeline.doublePadding) this.timeline.selectStart = this.timeline.selectEnd - this.timeline.doublePadding; // prevents overstriking
        } else if (this.timeline.isLockedRight || this.overSelector(this.timeline.selectEnd)) {
            this.timeline.isLockedRight = true;
            this.timeline.selectEnd = constrain(mouseX, this.timeline.start, this.timeline.end);
            if (this.timeline.selectEnd < this.timeline.selectStart + this.timeline.doublePadding) this.timeline.selectEnd = this.timeline.selectStart + this.timeline.doublePadding; // prevents overstriking
        }
    }
}