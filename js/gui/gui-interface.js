class GUI {

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
            slicerSize: 25,
            selectorSize: 100
        }
        this.dataPanelContainer = {
            xPos: 10,
            headerYPos: this.timelineContainer.bottom,
            tabsYPos: this.timelineContainer.bottom + 60
        }
        this.timeline = new TimelinePanel(this.sk, this.timelineContainer);
        this.dataPanel = new DataPanel(this.sk, this.dataPanelContainer);
        this.keyTextSize = this.sk.width / 70;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the top buttons to animate data, visualize conversation in different ways, and interact with video data by clicking anywhere in the space-time view to play & pause video. For more information see: benrydal.com/software/igs";
    }

    drawKeys(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.DRAWGUI, pathList, speakerList); // pass these to dynamically update
        this.timeline.draw();
        if (this.overFloorPlan(this.sk.mouseX, this.sk.mouseY)) this.drawHighlightSelectors();
        if (this.sk.sketchController.mode.isIntro) this.drawIntroMsg();
    }

    drawHighlightSelectors() {
        if (this.testSelectModeForRegion()) this.drawFloorPlanCursorSelector();
        else if (this.testSelectModeForSlice()) this.drawFloorPlanSlicerSelector();
    }

    testSelectModeForRegion() {
        return this.getCurSelectTab() === 1;
    }

    testSelectModeForSlice() {
        return this.getCurSelectTab() === 2;
    }

    setSelectorStroke() {
        this.sk.noFill();
        this.sk.strokeWeight(3);
        this.sk.stroke(0);
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

    /**
     * Updates user select start/end vars and is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        this.timeline.handleTimeline();
    }

    handleResetTimelineLock() {
        this.timeline.resetTimelineLock();
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



    getCurSelectTab() {
        return this.dataPanel.getCurSelectTab();
    }

    // TODO: consider moving to drawData? deal with selectorSize constants maybe?
    overCursor(xPos, yPos) {
        return this.sk.overCircle(xPos, yPos, this.floorPlanContainer.selectorSize);
    }

    overSlicer(xPos, yPos) {
        return this.sk.overRect(xPos - this.floorPlanContainer.slicerSize, 0, (2 * this.floorPlanContainer.slicerSize), this.timelineContainer.height);
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

    overSpaceTimeView(xPos, yPos) {
        return this.timeline.overSpaceTimeView(xPos, yPos);
    }

    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= this.floorPlanContainer.width) && (yPos >= 0 && yPos <= this.floorPlanContainer.height);
    }

    overTimelineAxis(pixelValue) {
        return pixelValue >= this.getCurTimelineSelectStart() && pixelValue <= this.getCurTimelineSelectEnd();
    }
}