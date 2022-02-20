class Highlight {

    constructor() {
        this.curXTop = null;
        this.curYTop = null;
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
}