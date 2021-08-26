class SketchController {

    constructor(sketch) {
        this.sk = sketch;
        this.mode = {
            isAnimate: false,
            isAlignTalk: false,
            isAllTalk: true,
            isIntro: true,
            isVideoPlay: false,
            isVideoShow: false,
            curRotation: 0, // [0-3] 4 rotation modes none, 90, 180, 270
            curSelect: 0 // [0-4] 5 select modes none, region, slice, moving, stopped
        }
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    // ****** P5 HANDLERS ****** //
    updateLoop() {
        if (this.mode.isAnimate || this.mode.isVideoPlay) this.sk.loop();
        else this.sk.noLoop();
    }

    startLoop() {
        this.sk.loop();
    }

    handleMousePressed() {
        if (this.testVideoToPlay() && this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.playPauseMovie();
        else this.sk.gui.handleKeys(this.sk.core.paths, this.sk.core.speakerList, this.mode.curSelect);
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate) this.sk.gui.handleTimeline();
    }

    handleMouseReleased() {
        this.sk.gui.handleResetTimelineLock();
    }

    // ****** UPDATE METHODS ****** //
    updateAnimationCounter() {
        if (this.mode.isAnimate) this.animationCounter = this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectEnd());
        else this.animationCounter = this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectStart());
        this.setIsAnimate(!this.mode.isAnimate);
    }

    updateAnimation() {
        if (this.mode.isAnimate) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectEnd()) - this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectStart()); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (this.animationCounter < this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectEnd())) this.animationCounter += animationIncrementValue;
            else this.setIsAnimate(false);
        }
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            this.sk.core.videoPlayer.updatePos(this.sk.mouseX, this.sk.mouseY, 100);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) {
            const vPos = Math.floor(this.sk.map(this.bugTimeForVideoScrub, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), this.mapFromPixelToVideoTime(this.sk.gui.getCurTimelineSelectStart()), this.mapFromPixelToVideoTime(this.sk.gui.getCurTimelineSelectEnd())));
            this.sk.core.videoPlayer.seekTo(vPos);
        } else if (this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) {
            const vPos = Math.floor(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(this.sk.mouseX)));
            this.sk.core.videoPlayer.seekTo(vPos);
            this.sk.core.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    toggleVideoShowHide() {
        if (this.mode.isVideoShow) {
            this.sk.core.videoPlayer.pause();
            this.sk.core.videoPlayer.hide();
            this.setVideoPlay(false);
            this.setVideoShow(false);
        } else {
            this.sk.core.videoPlayer.show();
            this.setVideoShow(true);
        }
    }

    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            this.sk.core.videoPlayer.pause();
            this.setVideoPlay(false);
        } else {
            const tPos = this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(this.sk.mouseX));
            this.sk.core.videoPlayer.play();
            this.sk.core.videoPlayer.seekTo(tPos);
            this.setVideoPlay(true);
        }
    }

    // ****** DRAW HELPER METHODS ****** //
    /**
     * Returns properly scaled pixel values to GUI from data points
     * @param  {Movement Or Conversation Point} point
     * @param  {Integer} view
     */
    getScaledPointValues(point, view) {
        const pixelTime = this.mapFromTotalToPixelTime(point.time);
        const scaledTime = this.mapFromSelectPixelToTimeline(pixelTime);
        const [scaledXPos, scaledYPos] = this.getScaledXYPos(point.xPos, point.yPos);
        let scaledSpaceTimeXPos;
        if (view === this.sk.PLAN) scaledSpaceTimeXPos = scaledXPos;
        else if (view === this.sk.SPACETIME) scaledSpaceTimeXPos = scaledTime;
        else scaledSpaceTimeXPos = null;
        return {
            pixelTime,
            scaledTime,
            scaledXPos,
            scaledYPos,
            scaledSpaceTimeXPos
        };
    }

    /**
     * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
     * @param  {Float} xPos
     * @param  {Float} yPos
     */
    getScaledXYPos(xPos, yPos) {
        let scaledXPos, scaledYPos;
        switch (this.getRotationMode()) {
            case 0:
                scaledXPos = xPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.width;
                scaledYPos = yPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.height;
                return [scaledXPos, scaledYPos];
            case 1:
                scaledXPos = this.sk.gui.floorPlanContainer.width - (yPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.height);
                scaledYPos = xPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.width;
                return [scaledXPos, scaledYPos];
            case 2:
                scaledXPos = this.sk.gui.floorPlanContainer.width - (xPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.width);
                scaledYPos = this.sk.gui.floorPlanContainer.height - (yPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.height);
                return [scaledXPos, scaledYPos];
            case 3:
                scaledXPos = yPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.height;
                scaledYPos = this.sk.gui.floorPlanContainer.height - xPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.width;
                return [scaledXPos, scaledYPos];
        }
    }

    /**
     * Organizes floor plan drawing methods depending on floor plan rotaiton mode
     */
    setFloorPlan() {
        switch (this.getRotationMode()) {
            case 0:
                this.sk.drawFloorPlanNoRotate();
                break;
            case 1:
                this.sk.setFloorPlanTranslation();
                this.sk.drawFloorPlan90Rotate();
                break;
            case 2:
                this.sk.setFloorPlanTranslation();
                this.sk.drawFloorPlan180Rotate();
                break;
            case 3:
                this.sk.setFloorPlanTranslation();
                this.sk.drawFloorPlan270Rotate();
                break;
        }
    }

    /**
     * Test if point is in user view
     * @param  {MovementPoint} curPoint
     */
    testMovementPointToDraw(curPoint) {
        return this.sk.gui.overTimelineAxis(curPoint.pixelTime) && this.sk.gui.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime);
    }

    /**
     * Test if point is in user view
     * @param  {ConversationPoint} curPoint
     */
    testConversationPointToDraw(curPoint) {
        return this.sk.gui.overTimelineAxis(curPoint.pixelTime) && this.sk.gui.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime) && this.testSelectMode(curPoint.scaledXPos, curPoint.scaledYPos);
    }

    testSelectMode(xPos, yPos) {
        if (this.testSelectModeForRegion()) return this.sk.gui.overCursor(xPos, yPos);
        else return true;
    }

    /**
     * @param  {Number/Float} value
     */
    testAnimation(value) {
        if (this.mode.isAnimate) return this.animationCounter > this.mapFromPixelToTotalTime(value);
        else return true;
    }

    testVideoToPlay() {
        return this.sk.testData.dataIsLoaded(this.sk.core.videoPlayer) && this.mode.isVideoShow && !this.mode.isAnimate && this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY);
    }

    /**
     * Sets conversation rectangle scaling range (size of rectangles as timeline is rescaled)
     */
    mapConversationRectRange() {
        return this.sk.map(this.sk.core.totalTimeInSeconds, 0, 3600, 10, 1, true); // map to inverse, values constrained between 10 and 1 (pixels)
    }

    // map to inverse of min/max to set rectWidth based on amount of pixel time selected
    mapRectInverse(rectMaxPixelWidth, rectMinPixelWidth) {
        return this.sk.map(this.sk.gui.getCurTimelineSelectEnd() - this.sk.gui.getCurTimelineSelectStart(), 0, this.sk.gui.getTimelineEnd() - this.sk.gui.getTimelineStart(), rectMaxPixelWidth, rectMinPixelWidth);
    }

    mapFromVideoToSelectedTime() {
        const timelinePos = this.mapFromTotalToPixelTime(this.sk.core.videoPlayer.getCurrentTime());
        return this.mapFromSelectPixelToTimeline(timelinePos);
    }

    mapFromPixelToTotalTime(value) {
        return this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), 0, this.sk.core.totalTimeInSeconds);
    }

    mapFromSelectPixelToTimeline(value) {
        return this.sk.map(value, this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd(), this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    }

    mapFromTotalToPixelTime(value) {
        return this.sk.map(value, 0, this.sk.core.totalTimeInSeconds, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    }

    mapFromPixelToVideoTime(value) {
        return Math.floor(this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), 0, Math.floor(this.sk.core.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    mapFromPixelToSelectedTime(value) {
        return this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd());
    }

    setIsAnimate(value) {
        this.mode.isAnimate = value;
    }

    setAlignTalk(value) {
        this.mode.isAlignTalk = value;
    }

    setAllTalk(value) {
        this.mode.isAllTalk = value;
    }

    setIntro(value) {
        this.mode.isIntro = value;
    }

    setVideoPlay(value) {
        this.mode.isVideoPlay = value;
    }

    setVideoShow(value) {
        this.mode.isVideoShow = value;
    }

    // ****** ROTATION METHODS ****** //
    testNoRotation() {
        return this.getRotationMode() === 0;
    }

    getRotationMode() {
        return this.mode.curRotation;
    }

    setRotateRight() {
        this.mode.curRotation++;
        if (this.mode.curRotation > 3) this.mode.curRotation = 0;
    }

    setRotateLeft() {
        this.mode.curRotation--;
        if (this.mode.curRotation < 0) this.mode.curRotation = 3;
    }

    // ****** SELECT METHODS ****** //
    getSelectMode() {
        return this.mode.curSelect;
    }

    setSelectMode(value) {
        this.mode.curSelect = value;
    }
    /**
     * Sets drawing strokeWeights for movement data depending on current selection mode
     */
    getWeightsFromSelectMode() {
        if (this.mode.curSelect === 3) return [1, 0];
        else if (this.mode.curSelect === 4) return [0, 10];
        else return [1, 10];
    }

    testSelectModeForRegion() {
        return this.mode.curSelect === 1;
    }
}