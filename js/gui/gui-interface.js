class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.dataPanel = new DataPanel(this.sk, this.timelinePanel.getBottom());
        this.floorPlanContainer = {
            width: this.getTimelineStart() - (this.sk.width - this.getTimelineEnd()),
            height: this.getTimelineHeight(),
            slicerSize: 25,
            selectorSize: 100
        }
        this.keyTextSize = this.sk.width / 70;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan and a timeline and can be viewed in 2D or 3D. Use the top menu to visualize different sample datasets or upload your own data. Use the top and bottom left buttons as well as the timeline to selectively study displayed data. For example, you can animate data, visualize conversation in different ways, and interact with video data by clicking anywhere on the timeline to play & pause video. For more information see: benrydal.com/software/igs";
    }

    drawKeys(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.DRAWGUI, pathList, speakerList); // pass these to dynamically update
        this.timelinePanel.draw();
        if (this.overFloorPlan(this.sk.mouseX, this.sk.mouseY)) this.updateFloorPlanSelector();
        if (this.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.updateTimelineSlicer();
        if (this.sk.sketchController.mode.isIntro) this.sk.translateCanvasForText(this.drawIntroMsg.bind(this));
    }

    updateFloorPlanSelector() {
        if (this.getCurSelectTab() === 1) this.drawFloorPlanCursorSelector();
        else if (this.getCurSelectTab() === 2) this.drawFloorPlanSlicerSelector();
    }

    updateTimelineSlicer() {
        if (this.sk.sketchController.view3D.isShowing) {
            this.timelinePanel.draw3DSlicerLine();
            this.sk.sketchController.update3DCanvas(); // must translate canvas to draw slicer in 3D properly
            this.timelinePanel.draw3DSlicerRect(this.floorPlanContainer.width, this.floorPlanContainer.height, this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX)); // pass zPos
            this.sk.pop(); // reset translation
        } else this.timelinePanel.drawSlicer();

    }

    drawFloorPlanCursorSelector() {
        this.setSelectorStroke();
        this.sk.circle(this.sk.mouseX, this.sk.mouseY, this.floorPlanContainer.selectorSize);
    }

    drawFloorPlanSlicerSelector() {
        this.setSelectorStroke();
        this.sk.line(this.sk.mouseX - this.floorPlanContainer.slicerSize, 0, this.sk.mouseX - this.floorPlanContainer.slicerSize, this.floorPlanContainer.height);
        this.sk.line(this.sk.mouseX + this.floorPlanContainer.slicerSize, 0, this.sk.mouseX + this.floorPlanContainer.slicerSize, this.floorPlanContainer.height);
    }

    setSelectorStroke() {
        this.sk.noFill();
        this.sk.strokeWeight(4);
        this.sk.stroke(0);
    }

    drawIntroMsg() {
        this.sk.rectMode(this.sk.CENTER);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.fill(255, 240);
        this.sk.rect(this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75 + 50, this.sk.height / 1.75 + 50);
        this.sk.fill(0);
        this.sk.textSize(this.keyTextSize);
        this.sk.text(this.introMsg, this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75, this.sk.height / 1.75);
        this.sk.rectMode(this.sk.CORNER);
    }

    handleKeys(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.HANDLEGUI, pathList, speakerList);
    }

    // Updates user select start/end vars and is triggered if user already dragging or begins dragging
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

    overSpaceTimeView(xPos, yPos) {
        return this.timelinePanel.overSpaceTimeView(xPos, yPos);
    }

    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= this.floorPlanContainer.width) && (yPos >= 0 && yPos <= this.floorPlanContainer.height);
    }

    overTimelineAxis(pixelValue) {
        return pixelValue >= this.getCurTimelineSelectStart() && pixelValue <= this.getCurTimelineSelectEnd();
    }

    overCursor(xPos, yPos) {
        return this.sk.overCircle(xPos, yPos, this.floorPlanContainer.selectorSize);
    }

    overSlicer(xPos, yPos) {
        return this.sk.overRect(xPos - this.floorPlanContainer.slicerSize, 0, (2 * this.floorPlanContainer.slicerSize), this.getTimelineHeight());
    }
}