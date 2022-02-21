class Highlight {

    constructor(sketch, bottomBounds) {
        this.sk = sketch;
        this.curXTop = null; // top corner of highlight region
        this.curYTop = null;
        this.highlightArray = []; // holds highlightRect objects
        this.bounds = { // currently Canvas boundary
            xPos: 0,
            yPos: 0,
            width: sketch.width,
            height: bottomBounds
        }
    }

    /**
     * Record top corner of highlight region if mousePressed within Canvas boundary
     */
    handleMousePressed() {
        if (this.overBounds()) {
            this.curXTop = this.sk.mouseX;
            this.curYTop = this.sk.mouseY;
        }
    }

    /**
     * Update highlightArray if mouseReleased within Canvas boundary
     * NOTE: if option key is held, multiple highlightRects can be added to highlightArray
     * Always reset curX/Y top
     */
    handleMouseRelease() {
        if (this.overBounds()) {
            if (!(this.sk.keyIsPressed && this.sk.keyCode === this.sk.OPTION)) this.resetHighlightArray();
            if (this.isHighlighting()) this.updateHighlightArray(this.sk.mouseX, this.sk.mouseY);
        }
        this.curXTop = null;
        this.curYTop = null;
    }

    updateHighlightArray(mouseX, mouseY) {
        this.highlightArray.push(this.createHighlightRect(mouseX, mouseY));
    }

    createHighlightRect(mouseX, mouseY) {
        return {
            xPos: this.curXTop,
            yPos: this.curYTop,
            width: mouseX - this.curXTop,
            height: mouseY - this.curYTop
        }
    }

    draw() {
        this.sk.noFill();
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        if (this.isHighlighting()) this.sk.rect(this.curXTop, this.curYTop, this.sk.mouseX - this.curXTop, this.sk.mouseY - this.curYTop);
        this.sk.stroke(150);
        for (const highlightRect of this.highlightArray) {
            this.sk.rect(highlightRect.xPos, highlightRect.yPos, highlightRect.width, highlightRect.height);
        }
    }

    // TODO:
    overHighlightArray(xPos, yPos, xPosTime) {
        if (!this.highlightArray.length) return true;
        for (const highlightRect of this.highlightArray) {
            if (((xPos >= highlightRect.xPos && xPos <= highlightRect.xPos + highlightRect.width) || (xPosTime >= highlightRect.xPos && xPosTime <= highlightRect.xPos + highlightRect.width)) && yPos >= highlightRect.yPos && yPos <= highlightRect.yPos + highlightRect.height) return true;
        }
        return false;
    }

    isHighlighting() {
        return this.curXTop !== null && this.curYTop !== null;
    }

    resetHighlightArray() {
        this.highlightArray = [];
    }

    overBounds() {
        return this.sk.overRect(this.bounds.xPos, this.bounds.yPos, this.bounds.width, this.bounds.height);
    }
}