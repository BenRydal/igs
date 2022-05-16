class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getTop());
        this.highlight = new Highlight(this.sk, this.timelinePanel.getTop());
    }

    updateGUI() {
        this.timelinePanel.draw();
        if (this.timelinePanel.overTimeline()) {
            if (this.sk.handle3D.getIs3DMode()) this.timelinePanel.drawShortSlicer();
            else this.timelinePanel.drawLongSlicer();
        }
        if (!this.sk.handle3D.getIs3DModeOrTransitioning()) {
            if (this.sk.sketchController.getCurSelectTab() === 1) this.fpContainer.drawRegionSelector();
            else if (this.sk.sketchController.getCurSelectTab() === 2) this.fpContainer.drawSlicerSelector();
        }
    }

    updateGUIWithTranslation() {
        this.highlight.setDraw();
        if (this.sk.handle3D.getIs3DMode() && this.timelinePanel.overTimeline()) {
            this.timelinePanel.draw3DSlicerRect(this.fpContainer.getContainer(), this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX));
        }
    }
}