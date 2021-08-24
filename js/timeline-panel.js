class TimelinePanel {

    constructor(sketch) {
        this.sk = sketch;
        this.start = this.sk.width * 0.4638;
        this.end = this.sk.width * 0.9638;
        this.selectStart = this.sk.width * 0.4638;
        this.selectEnd = this.sk.width * 0.9638;
        this.spacing = 25;
        this.padding = 20;
        this.doublePadding = 40;
        this.length = this.sk.width * 0.9638 - this.sk.width * 0.4638;
        this.height = this.sk.height * .81;
        this.top = this.sk.height * .81 - 25;
        this.bottom = this.sk.height * .81 + 25;
        this.thickness = 50;
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
        if (this.sk.sketchController.mode.isAnimate) this.drawRect(this.selectStart, this.top, this.sk.sketchController.mapFromTotalToPixelTime(this.sk.sketchController.animationCounter), this.bottom);
        else this.drawRect(this.selectStart, this.top, this.selectEnd, this.bottom);
    }

    drawRect(xPos, yPos, width, height) {
        this.sk.rect(xPos, yPos, width - xPos, height - yPos);
    }

    drawAxis() {
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.line(this.start, this.height, this.end, this.height);
    }

    drawSelectors() {
        this.sk.strokeWeight(4);
        this.sk.line(this.selectStart, this.top, this.selectStart, this.bottom);
        this.sk.line(this.selectEnd, this.top, this.selectEnd, this.bottom);
    }

    drawEndLabels() {
        this.sk.noStroke();
        this.sk.fill(0);
        const leftLabel = Math.floor(this.sk.sketchController.mapFromPixelToTotalTime(this.selectStart) / 60);
        const rightLabel = Math.ceil(this.sk.sketchController.mapFromPixelToTotalTime(this.selectEnd) / 60);
        this.sk.text(leftLabel, this.start + this.spacing, this.height);
        this.sk.text(rightLabel, this.end - this.spacing - this.sk.textWidth(rightLabel), this.height);
    }

    drawCenterLabel() {
        this.sk.textAlign(this.sk.CENTER);
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) {
            const mapMouseX = this.sk.sketchController.mapFromPixelToSelectedTime(this.sk.mouseX);
            const timeInSeconds = this.sk.sketchController.mapFromPixelToTotalTime(mapMouseX);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds - minutes * 60);
            const label = minutes + " minutes  " + seconds + " seconds";
            this.sk.text(label, this.start + this.length / 2, this.height);
        } else this.sk.text("MINUTES", this.start + this.length / 2, this.height);
        this.sk.textAlign(this.sk.LEFT); // reset
    }

    drawSlicer() {
        this.sk.fill(0);
        this.sk.stroke(0);
        this.sk.strokeWeight(2);
        this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.height);
    }

    handleTimeline() {
        if (this.isLockedLeft || (!this.isLockedRight && this.overSelector(this.selectStart))) {
            this.isLockedLeft = true;
            this.selectStart = this.sk.constrain(this.sk.mouseX, this.start, this.end);
            if (this.selectStart > this.selectEnd - this.doublePadding) this.selectStart = this.selectEnd - this.doublePadding; // prevents overstriking
        } else if (this.isLockedRight || this.overSelector(this.selectEnd)) {
            this.isLockedRight = true;
            this.selectEnd = this.sk.constrain(this.sk.mouseX, this.start, this.end);
            if (this.selectEnd < this.selectStart + this.doublePadding) this.selectEnd = this.selectStart + this.doublePadding; // prevents overstriking
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
        return this.overRect(selector - this.padding, this.top, this.doublePadding, this.thickness);
    }

    overTimelineAxisRegion() {
        return this.overRect(this.start - this.doublePadding, this.top, this.length + this.doublePadding, this.thickness);
    }

    overTimelineAxis(pixelValue) {
        return pixelValue >= this.selectStart && pixelValue <= this.selectEnd;
    }

    overSpaceTimeView(xPos, yPos) {
        return (xPos >= this.start && xPos <= this.end) && (yPos >= 0 && yPos <= this.top);
    }
}