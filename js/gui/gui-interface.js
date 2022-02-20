class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getTop());
        this.highlight = new Highlight();
    }

    updateGUI() {
        this.timelinePanel.draw();
        this.timelinePanel.updateSlicer(this.sk.sketchController.handle3D.getIs3DMode());
        this.fpContainer.updateSelectors(this.sk.sketchController.getCurSelectTab());
        // if (this.sk.sketchController.getCurSelectTab() === 5 && this.highlight.isHighlighting()) {
        //     this.sk.noFill();
        //     this.sk.stroke(0);
        //     this.sk.strokeWeight(1);
        //     this.sk.rect(this.highlight.curXTop, this.highlight.curYTop, this.sk.mouseX - this.highlight.curXTop, this.sk.mouseY - this.highlight.curYTop);
        // }
        // TODO: temp!
        if (this.sk.sketchController.getCurSelectTab() === 5) {
            this.sk.noFill();
            this.sk.stroke(0);
            this.sk.strokeWeight(1);
            if (this.highlight.isHighlighting()) this.sk.rect(this.highlight.curXTop, this.highlight.curYTop, this.sk.mouseX - this.highlight.curXTop, this.sk.mouseY - this.highlight.curYTop);
            this.sk.stroke(150);
            for (const highlightRect of this.highlight.highlightArray) {
                this.sk.rect(highlightRect.xPos, highlightRect.yPos, highlightRect.width, highlightRect.height);
            }
        }
    }
}