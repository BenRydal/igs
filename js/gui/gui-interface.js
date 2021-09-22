class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.dataPanel = new DataPanel(this.sk, this.timelinePanel.getBottom());
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getHeight());
    }
}