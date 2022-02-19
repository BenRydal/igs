class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getTop());
    }

    updateGUI() {
        this.timelinePanel.draw();
        this.timelinePanel.updateSlicer(this.sk.sketchController.handle3D.getIsShowing());
        this.fpContainer.updateSelectors(this.sk.sketchController.getCurSelectTab());
    }
}