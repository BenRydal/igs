class Keys {

    constructor(sketch) {
        this.sk = sketch;
        this.timelineHeight = this.sk.height * .85;
        this.timelineThickness = 70;
        this.timelineContainer = {
            start: this.sk.width * 0.5,
            end: this.sk.width * 0.975,
            height: this.timelineHeight,
            thickness: this.timelineThickness,
            top: this.timelineHeight - this.timelineThickness / 2,
            bottom: this.timelineHeight + this.timelineThickness / 2
        }
        this.floorPlanContainer = {
            width: this.timelineContainer.start - (this.sk.width - this.timelineContainer.end),
            height: this.timelineContainer.height,
            selectorSize: 100
        }
        this.dataPanelContainer = {
            xPos: 10,
            headerYPos: this.timelineContainer.bottom,
            dataYPos: this.timelineContainer.bottom + 60
        }
        this.timeline = new TimelinePanel(this.sk, this.timelineContainer);
        this.dataPanel = new DataPanel(this.sk, this.dataPanelContainer);
        this.keyTextSize = this.sk.width / 70;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the top buttons to animate data, visualize conversation in different ways, and interact with video data by clicking anywhere in the space-time view to play & pause video. For more information see: benrydal.com/software/igs";
    }

    drawKeys(pathList, speakerList, curSelectMode) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize("draw", pathList, speakerList, curSelectMode); // pass these to dynamically update
        this.timeline.draw();
        if (this.sk.sketchController.testSelectModeForRegion() && this.overFloorPlan(this.sk.mouseX, this.sk.mouseY)) this.drawFloorPlanSelector();
        if (this.sk.sketchController.mode.isIntro) this.drawIntroMsg();
    }

    drawFloorPlanSelector() {
        this.sk.noFill();
        this.sk.strokeWeight(3);
        this.sk.stroke(0);
        this.sk.circle(this.sk.mouseX, this.sk.mouseY, this.floorPlanContainer.selectorSize);
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

    handleKeys(pathList, speakerList, curSelectMode) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize("handle", pathList, speakerList, curSelectMode);
    }

    getTimelineStart() {
        return this.timelineContainer.start;
    }

    getTimelineEnd() {
        return this.timelineContainer.end;
    }

    getCurTimelineSelectStart() {
        return this.timeline.getCurTimelineSelectStart();
    }

    getCurTimelineSelectEnd() {
        return this.timeline.getCurTimelineSelectEnd();
    }

    /**
     * Updates user select start/end vars and is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        this.timeline.handleTimeline();
    }

    handleResetTimelineLock() {
        this.timeline.resetTimelineLock();
    }

    // TODO:
    setSelectMode(value) {
        this.sk.sketchController.setSelectMode(value);
    }

    setRotateLeft() {
        this.sk.sketchController.setRotateLeft();
    }

    setRotateRight() {
        this.sk.sketchController.setRotateRight();
    }
    /**
     * NOTE: this setter is modifying core vars but this still seems to be best solution
     */
    setCoreData(personFromList) {
        personFromList.isShowing = !personFromList.isShowing;
    }

    // TODO: consider moving overCircle and Rect to main??
    overCircle(x, y, diameter) {
        return this.sk.sqrt(this.sk.sq(x - this.sk.mouseX) + this.sk.sq(y - this.sk.mouseY)) < diameter / 2;
    }

    overRect(x, y, boxWidth, boxHeight) {
        return this.sk.mouseX >= x && this.sk.mouseX <= x + boxWidth && this.sk.mouseY >= y && this.sk.mouseY <= y + boxHeight;
    }

    overSpaceTimeView(xPos, yPos) {
        return this.timeline.overSpaceTimeView(xPos, yPos);
    }

    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= this.floorPlanContainer.width) && (yPos >= 0 && yPos <= this.floorPlanContainer.height);
    }

    overCursor(xPos, yPos) {
        return this.overCircle(xPos, yPos, this.floorPlanContainer.selectorSize);
    }

    overTimelineAxis(pixelValue) {
        return pixelValue >= this.getCurTimelineSelectStart() && pixelValue <= this.getCurTimelineSelectEnd();
    }
}