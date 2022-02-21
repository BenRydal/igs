class Highlight {

    constructor(sketch) {
        this.sk = sketch;
        this.curXTop = null;
        this.curYTop = null;
        this.highlightArray = [];
    }

    updateHighlightArray(mouseX, mouseY) {
        if (this.isHighlighting()) this.highlightArray.push(this.createHighlightRect(mouseX, mouseY));
        this.endHighlight();
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
            //if (xPos >= highlightRect.xPos && xPos <= highlightRect.xPos + highlightRect.width && yPos >= highlightRect.yPos && yPos <= highlightRect.yPos + highlightRect.height) return true;
        }
        return false;
    }

    // Called on mousePressed and overCanvas and in highlight mode
    startHighlight(mouseX, mouseY) {
        this.curXTop = mouseX;
        this.curYTop = mouseY;
    }

    // on mouseRelease and in highlight mode
    endHighlight() {
        this.curXTop = null;
        this.curYTop = null;
    }

    createHighlightRect(mouseX, mouseY) {
        return {
            xPos: this.curXTop,
            yPos: this.curYTop,
            width: mouseX - this.curXTop,
            height: mouseY - this.curYTop
        }
    }

    isHighlighting() {
        return this.curXTop !== null && this.curYTop !== null;
    }

    // called by clicking on highlight button OR NONE button??
    resetHighlightArray() {
        this.highlightArray = [];
    }
}