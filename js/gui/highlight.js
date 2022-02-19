class Highlight {

    constructor() {
        this.curXTop = null;
        this.curYTop = null;
        this.highlightArray = [];
    }

    // Called on mousePressed and overCanvas and in highlight mode
    startHighlight(mouseX, mouseY) {
        this.curXTop = mouseX;
        this.curYTop = mouseY;
    }

    // on mouseRelease and in highlight mode
    addHighlight(mouseX, mouseY) {
        this.highlightArray.push(this.createHighlightRect(mouseX, mouseY));
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

    getHighlightArray() {
        return this.highlightArray;
    }
}