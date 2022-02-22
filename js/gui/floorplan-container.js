class FloorPlanContainer {

    constructor(sketch, start, end, height) {
        this.sk = sketch;
        this.width = start - (this.sk.width - end);
        this.height = height;
        this.slicerSize = 25;
        this.selectorSize = 100;
    }

    drawRegionSelector() {
        this.setSelectorStroke();
        this.sk.circle(this.sk.mouseX, this.sk.mouseY, this.selectorSize);
    }

    drawSlicerSelector() {
        this.setSelectorStroke();
        this.sk.line(this.sk.mouseX - this.slicerSize, 0, this.sk.mouseX - this.slicerSize, this.height);
        this.sk.line(this.sk.mouseX + this.slicerSize, 0, this.sk.mouseX + this.slicerSize, this.height);
    }

    setSelectorStroke() {
        this.sk.noFill();
        this.sk.strokeWeight(4);
        this.sk.stroke(0);
    }

    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= this.width) && (yPos >= 0 && yPos <= this.height);
    }

    overCursor(xPos, yPos, xPosTime) {
        return this.sk.overCircle(xPos, yPos, this.selectorSize) || this.sk.overCircle(xPosTime, yPos, this.selectorSize);
    }

    overSlicer(xPos, xPosTime) {
        return this.sk.overRect(xPos - this.slicerSize, 0, (2 * this.slicerSize), this.height) || this.sk.overRect(xPosTime - this.slicerSize, 0, (2 * this.slicerSize), this.height);
    }

    getContainer() {
        return {
            width: this.width,
            height: this.height
        }
    }
}