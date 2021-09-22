class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.dataPanel = new DataPanel(this.sk, this.timelinePanel.getBottom());
        this.fpContainer = new FloorPlanContainer(this.sk, this.getTimelineStart(), this.getTimelineEnd(), this.getTimelineHeight());
        this.keyTextSize = this.sk.width / 70;
    }

    drawGUI(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.DRAWGUI, pathList, speakerList); // pass these to dynamically update
        this.timelinePanel.draw();
        this.fpContainer.updateSelectors(this.getCurSelectTab());

        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.updateTimelineSlicer();
        if (this.sk.sketchController.mode.isIntro) this.sk.translateCanvasForText(this.drawIntroMsg.bind(this));
    }

    drawIntroMsg() {
        const introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan and a timeline and can be viewed in 2D or 3D. Use the top menu to visualize different sample datasets or upload your own data. Use the top and bottom left buttons as well as the timeline to selectively study displayed data. For example, you can animate data, visualize conversation in different ways, and interact with video data by clicking anywhere on the timeline to play & pause video. For more information see: benrydal.com/software/igs";
        this.sk.rectMode(this.sk.CENTER);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.fill(255, 240);
        this.sk.rect(this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75 + 50, this.sk.height / 1.75 + 50);
        this.sk.fill(0);
        this.sk.textSize(this.keyTextSize);
        this.sk.text(introMsg, this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75, this.sk.height / 1.75);
        this.sk.rectMode(this.sk.CORNER);
    }

    updateTimelineSlicer() {
        if (this.sk.sketchController.handle3D.getIsShowing()) this.timelinePanel.drawShortSlicer();
        else this.timelinePanel.drawLongSlicer();
    }

    update3DSlicerRect() {
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.timelinePanel.draw3DSlicerRect(this.getFloorPlanContainer(), this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX)); // pass mapped mouseX as zPos
    }

    handleDataPanel(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.HANDLEGUI, pathList, speakerList);
    }

    handleTimeline() {
        this.timelinePanel.handleTimeline();
    }

    handleResetTimelineLock() {
        this.timelinePanel.resetTimelineLock();
    }

    setRotateLeft() {
        this.sk.sketchController.setRotateLeft();
    }

    setRotateRight() {
        this.sk.sketchController.setRotateRight();
    }

    // NOTE: this setter is modifying core vars but this still seems to be best solution
    setCoreData(personFromList) {
        personFromList.isShowing = !personFromList.isShowing;
    }

    getCurSelectTab() {
        return this.dataPanel.getCurSelectTab();
    }

    getTimelineStart() {
        return this.timelinePanel.getStart();
    }

    getTimelineEnd() {
        return this.timelinePanel.getEnd();
    }

    getTimelineLength() {
        return this.timelinePanel.getLength();
    }

    getCurTimelineSelectStart() {
        return this.timelinePanel.getSelectStart();
    }

    getCurTimelineSelectEnd() {
        return this.timelinePanel.getSelectEnd();
    }

    getTimelineHeight() {
        return this.timelinePanel.getHeight();
    }

    getFloorPlanContainer() {
        return this.fpContainer.getContainer();
    }

    overSpaceTimeView(xPos, yPos) {
        return this.timelinePanel.overSpaceTimeView(xPos, yPos);
    }

    overTimelineAxis(pixelValue) {
        return this.timelinePanel.overTimelineAxis(pixelValue);
    }

    overCursor(xPos, yPos) {
        return this.fpContainer.overCursor(xPos, yPos);
    }

    overSlicer(xPos, yPos) {
        return this.fpContainer.overSlicer(xPos, yPos);
    }

    overFloorPlan(xPos, yPos) {
        return this.fpContainer.overFloorPlan(xPos, yPos);
    }
}