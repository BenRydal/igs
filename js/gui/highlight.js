class Highlight {

    constructor(sketch, bottomBounds) {
        this.sk = sketch;
        this.curXTop = null; // top corner of highlight region
        this.curYTop = null;
        this.highlightArray = []; // holds highlightRect objects which are pixel positions of user drawn rectangles
        this.bounds = { // currently the canvas boundary
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
            if (this.isHighlighting()) this.updateHighlightArray();
        }
        this.curXTop = null;
        this.curYTop = null;
    }

    updateHighlightArray() {
        this.highlightArray.push(this.createHighlightRect(this.sk.mouseX, this.sk.mouseY));
    }

    createHighlightRect(mouseX, mouseY) {
        return {
            xPos: this.curXTop,
            yPos: this.curYTop,
            width: mouseX - this.curXTop,
            height: mouseY - this.curYTop
        }
    }

    setDraw() {
        this.sk.noFill();
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        if (this.isHighlighting()) this.drawCurHighlight();
        this.sk.stroke(150);
        for (const highlightRect of this.highlightArray) this.drawHighlightRects(highlightRect);
    }

    drawCurHighlight() {
        this.sk.rect(this.curXTop, this.curYTop, this.sk.mouseX - this.curXTop, this.sk.mouseY - this.curYTop);
    }

    drawHighlightRects(highlightRect) {
        if (this.sk.handle3D.getIs3DMode() && this.sk.gui.timelinePanel.overAxis(highlightRect.xPos)) {
            this.draw3DHighlightRect(highlightRect);
        } else {
            this.sk.rect(highlightRect.xPos, highlightRect.yPos, highlightRect.width, highlightRect.height);
        }
    }

    draw3DHighlightRect(highlightRect) {
        // Map method maintains highlight rect scaling if user adjusts timeline
        const zPosStart = this.sk.sketchController.mapToSelectTimeThenPixelTime(highlightRect.xPos);
        const zPosEnd = this.sk.sketchController.mapToSelectTimeThenPixelTime(highlightRect.xPos + highlightRect.width);
        const span = this.sk.gui.fpContainer.getContainer().width; // span 3D rects full span of floor plan container
        // top
        this.sk.quad(0, highlightRect.yPos, zPosEnd, span, highlightRect.yPos, zPosEnd, span, highlightRect.yPos + highlightRect.height, zPosEnd, 0, highlightRect.yPos + highlightRect.height, zPosEnd);
        // bottom
        this.sk.quad(0, highlightRect.yPos, zPosStart, span, highlightRect.yPos, zPosStart, span, highlightRect.yPos + highlightRect.height, zPosStart, 0, highlightRect.yPos + highlightRect.height, zPosStart);
        // line connectors
        this.sk.line(0, highlightRect.yPos, zPosEnd, 0, highlightRect.yPos, zPosStart);
        this.sk.line(span, highlightRect.yPos, zPosEnd, span, highlightRect.yPos, zPosStart);
        this.sk.line(0, highlightRect.yPos + highlightRect.height, zPosEnd, 0, highlightRect.yPos + highlightRect.height, zPosStart);
        this.sk.line(span, highlightRect.yPos + highlightRect.height, zPosEnd, span, highlightRect.yPos + highlightRect.height, zPosStart);
    }

    overHighlightArray(xPos, yPos, xPosTime) {
        if (!this.highlightArray.length) return true; // return true if no data
        else {
            for (const highlightRect of this.highlightArray) {
                if (this.overHighlightRect(highlightRect, xPos, yPos, xPosTime)) return true;
            }
            return false;
        }
    }

    overHighlightRect(highlightRect, xPos, yPos, xPosTimeToMap) {
        const xPosTime = this.sk.sketchController.mapSelectTimeToPixelTime2D(xPosTimeToMap); // Map method maintains highlight rect scaling if user adjusts timeline, make sure to test 2D only
        if (this.sk.handle3D.getIs3DMode()) {
            if (this.sk.gui.timelinePanel.overAxis(highlightRect.xPos)) return xPosTime >= highlightRect.xPos && xPosTime <= highlightRect.xPos + highlightRect.width && yPos >= highlightRect.yPos && yPos <= highlightRect.yPos + highlightRect.height;
            else return xPos >= highlightRect.xPos && xPos <= highlightRect.xPos + highlightRect.width && yPos >= highlightRect.yPos && yPos <= highlightRect.yPos + highlightRect.height;
        } else {
            return ((xPos >= highlightRect.xPos && xPos <= highlightRect.xPos + highlightRect.width) || (xPosTime >= highlightRect.xPos && xPosTime <= highlightRect.xPos + highlightRect.width)) && yPos >= highlightRect.yPos && yPos <= highlightRect.yPos + highlightRect.height;
        }
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