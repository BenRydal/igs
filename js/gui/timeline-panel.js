class TimelinePanel {

    constructor(sketch) {
        this.sk = sketch;
        this.start = this.sk.width * 0.5;
        this.end = this.sk.width * 0.975;
        this.height = this.sk.height * .85;
        this.thickness = this.sk.height / 15;
        this.top = this.height - this.thickness / 2;
        this.bottom = this.height + this.thickness / 2;
        this.selectStart = this.start;
        this.selectEnd = this.end;
        this.length = this.end - this.start;
        this.padding = this.thickness / 4;
        this.doublePadding = this.thickness / 2;
        this.isLockedLeft = false;
        this.isLockedRight = false;
    }

    draw() {
        this.drawSelectionRect();
        this.drawAxis();
        this.drawSelectors();
        this.drawEndLabels();
        this.drawCenterLabel();
    }

    drawSelectionRect() {
        this.sk.fill(200);
        this.sk.noStroke();
        if (this.sk.sketchController.getIsAnimate()) this.drawRect(this.selectStart, this.top, this.sk.sketchController.mapTotalTimeToPixelTime(this.sk.sketchController.animationCounter), this.bottom);
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
        this.sk.strokeWeight(7);
        this.sk.line(this.selectStart, this.top, this.selectStart, this.bottom);
        this.sk.line(this.selectEnd, this.top, this.selectEnd, this.bottom);
    }

    drawEndLabels() {
        this.sk.noStroke();
        this.sk.fill(0);
        const leftLabel = Math.floor(this.sk.sketchController.mapPixelTimeToTotalTime(this.selectStart) / 60);
        const rightLabel = Math.ceil(this.sk.sketchController.mapPixelTimeToTotalTime(this.selectEnd) / 60);
        this.sk.text(leftLabel, this.start + this.padding, this.height);
        this.sk.text(rightLabel, this.end - this.padding - this.sk.textWidth(rightLabel), this.height);
    }

    drawCenterLabel() {
        this.sk.textAlign(this.sk.CENTER);
        if (this.aboveTimeline(this.sk.mouseX, this.sk.mouseY)) {
            const mapMouseX = this.sk.sketchController.mapPixelTimeToSelectTime(this.sk.mouseX);
            const timeInSeconds = this.sk.sketchController.mapPixelTimeToTotalTime(mapMouseX);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds - minutes * 60);
            const label = minutes + " minutes  " + seconds + " seconds";
            this.sk.text(label, this.start + this.length / 2, this.height);
        } else this.sk.text("MINUTES", this.start + this.length / 2, this.height);
        this.sk.textAlign(this.sk.LEFT); // reset
    }

    updateSlicer(isShowing) {
        if (this.aboveTimeline(this.sk.mouseX, this.sk.mouseY)) {
            if (isShowing) this.drawShortSlicer();
            else this.drawLongSlicer();
        }
    }

    setSlicerStroke() {
        this.sk.fill(0);
        this.sk.stroke(0);
        this.sk.strokeWeight(2);
    }

    drawLongSlicer() {
        this.setSlicerStroke();
        this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.height);
    }

    drawShortSlicer() {
        this.setSlicerStroke();
        this.sk.line(this.sk.mouseX, this.top, this.sk.mouseX, this.bottom);
    }

    draw3DSlicerRect(container, zPos) {
        this.sk.fill(255, 50);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.quad(0, 0, zPos, container.width, 0, zPos, container.width, container.height, zPos, 0, container.height, zPos);
    }

    handle() {
        if (this.testUpdate()) {
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
    }

    testUpdate() {
        return ((this.isLockedLeft || this.isLockedRight) || this.overTimeline());
    }

    resetLock() {
        this.isLockedLeft = false;
        this.isLockedRight = false;
    }

    overSelector(selector) {
        return this.sk.overRect(selector - this.padding, this.top, this.doublePadding, this.thickness);
    }

    overAxis(pixelValue) {
        return pixelValue >= this.selectStart && pixelValue <= this.selectEnd;
    }

    overTimeline() {
        return this.sk.overRect(this.start - this.doublePadding, this.top, this.length + this.doublePadding, this.thickness);
    }

    aboveTimeline(xPos, yPos) {
        return (xPos >= this.start && xPos <= this.end) && (yPos >= 0 && yPos <= this.top);
    }

    getBottom() {
        return this.bottom;
    }

    getHeight() {
        return this.height;
    }

    getStart() {
        return this.start;
    }

    getEnd() {
        return this.end;
    }

    getSelectStart() {
        return this.selectStart;
    }

    getSelectEnd() {
        return this.selectEnd;
    }

    getLength() {
        return this.length;
    }
}