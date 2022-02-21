class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getTop());
        this.highlight = new Highlight(this.sk, this.timelinePanel.getTop());
    }

    updateGUI(is3DMode, curSelectTab) {
        this.timelinePanel.draw();
        this.timelinePanel.updateSlicer(is3DMode);
        this.fpContainer.updateSelectors(curSelectTab);
        this.highlight.draw();
    }
}