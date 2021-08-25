class TimelinePanel {

    constructor(sketch, timelineContainer) {
        this.sk = sketch;
        this.tc = timelineContainer;
        this.selectStart = this.tc.start;
        this.selectEnd = this.tc.end;
        this.length = this.tc.end - this.tc.start;
        this.padding = this.tc.thickness / 4;
        this.doublePadding = this.tc.thickness / 2;
        this.isLockedLeft = false;
        this.isLockedRight = false;
    }

    draw() {
        this.drawSelectionRect();
        this.drawAxis();
        this.drawSelectors();
        this.drawEndLabels();
        this.drawCenterLabel();
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.drawSlicer();
    }

    drawSelectionRect() {
        this.sk.fill(150, 150);
        this.sk.noStroke();
        if (this.sk.sketchController.mode.isAnimate) this.drawRect(this.selectStart, this.tc.top, this.sk.sketchController.mapFromTotalToPixelTime(this.sk.sketchController.animationCounter), this.tc.bottom);
        else this.drawRect(this.selectStart, this.tc.top, this.selectEnd, this.tc.bottom);
    }

    drawRect(xPos, yPos, width, height) {
        this.sk.rect(xPos, yPos, width - xPos, height - yPos);
    }

    drawAxis() {
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.line(this.tc.start, this.tc.height, this.tc.end, this.tc.height);
    }

    drawSelectors() {
        this.sk.strokeWeight(4);
        this.sk.line(this.selectStart, this.tc.top, this.selectStart, this.tc.bottom);
        this.sk.line(this.selectEnd, this.tc.top, this.selectEnd, this.tc.bottom);
    }

    drawEndLabels() {
        this.sk.noStroke();
        this.sk.fill(0);
        const leftLabel = Math.floor(this.sk.sketchController.mapFromPixelToTotalTime(this.selectStart) / 60);
        const rightLabel = Math.ceil(this.sk.sketchController.mapFromPixelToTotalTime(this.selectEnd) / 60);
        this.sk.text(leftLabel, this.tc.start + this.padding, this.tc.height);
        this.sk.text(rightLabel, this.tc.end - this.padding - this.sk.textWidth(rightLabel), this.tc.height);
    }

    drawCenterLabel() {
        this.sk.textAlign(this.sk.CENTER);
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) {
            const mapMouseX = this.sk.sketchController.mapFromPixelToSelectedTime(this.sk.mouseX);
            const timeInSeconds = this.sk.sketchController.mapFromPixelToTotalTime(mapMouseX);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds - minutes * 60);
            const label = minutes + " minutes  " + seconds + " seconds";
            this.sk.text(label, this.tc.start + this.length / 2, this.tc.height);
        } else this.sk.text("MINUTES", this.tc.start + this.length / 2, this.tc.height);
        this.sk.textAlign(this.sk.LEFT); // reset
    }

    drawSlicer() {
        this.sk.fill(0);
        this.sk.stroke(0);
        this.sk.strokeWeight(2);
        this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.tc.height);
    }

    handleTimeline() {
        if ((this.isLockedLeft || this.isLockedRight) || this.overTimelineAxisRegion()) {
            if (this.isLockedLeft || (!this.isLockedRight && this.overSelector(this.selectStart))) {
                this.isLockedLeft = true;
                this.selectStart = this.sk.constrain(this.sk.mouseX, this.tc.start, this.tc.end);
                if (this.selectStart > this.selectEnd - this.doublePadding) this.selectStart = this.selectEnd - this.doublePadding; // prevents overstriking
            } else if (this.isLockedRight || this.overSelector(this.selectEnd)) {
                this.isLockedRight = true;
                this.selectEnd = this.sk.constrain(this.sk.mouseX, this.tc.start, this.tc.end);
                if (this.selectEnd < this.selectStart + this.doublePadding) this.selectEnd = this.selectStart + this.doublePadding; // prevents overstriking
            }
        }
    }

    resetTimelineLock() {
        this.isLockedLeft = false;
        this.isLockedRight = false;
    }

    // TODO: move to main.js?
    overRect(x, y, boxWidth, boxHeight) {
        return this.sk.mouseX >= x && this.sk.mouseX <= x + boxWidth && this.sk.mouseY >= y && this.sk.mouseY <= y + boxHeight;
    }

    overSelector(selector) {
        return this.overRect(selector - this.padding, this.tc.top, this.doublePadding, this.tc.thickness);
    }

    overTimelineAxisRegion() {
        return this.overRect(this.tc.start - this.doublePadding, this.tc.top, this.length + this.doublePadding, this.tc.thickness);
    }

    overTimelineAxis(pixelValue) {
        return pixelValue >= this.selectStart && pixelValue <= this.selectEnd;
    }

    overSpaceTimeView(xPos, yPos) {
        return (xPos >= this.tc.start && xPos <= this.tc.end) && (yPos >= 0 && yPos <= this.tc.top);
    }

    getCurTimelineSelectStart() {
        return this.selectStart;
    }

    getCurTimelineSelectEnd() {
        return this.selectEnd;
    }
}