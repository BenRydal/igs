class SketchController {

    constructor(sketch) {
        this.sk = sketch;
        this.mode = {
            isAnimate: false,
            isAlignTalk: false,
            isAllTalk: true,
            isIntro: true,
            isVideoPlay: false,
            isVideoShow: false
        }
        this.view3D = new View3D(this.sk);
        this.curFloorPlanRotation = 0; // [0-3] 4 rotation modes none, 90, 180, 270
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    handleView3D() {
        this.view3D.toggleIsShowing();
        this.view3D.setIsTransitioning(true);
        if (this.view3D.getIsShowing) this.setRotateLeft(); // must rotate floor plan to make matching space-time view appear in both 2D and 3D
        else this.setRotateRight();
    }

    update3DTranslation() {
        this.view3D.update3DTranslation();
    }

    update3DCanvas() {
        this.sk.set3DCanvas(this.view3D.getCurPositions());
    }

    translationComplete() {
        return this.view3D.getIsShowing() || this.view3D.getIsTransitioning();
    }




    // ****** P5 HANDLERS ****** //
    updateLoop() {
        if (this.mode.isAnimate || this.mode.isVideoPlay || this.view3D.isTransitioning) this.sk.loop();
        else this.sk.noLoop();
    }

    startLoop() {
        this.sk.loop();
    }

    handleMousePressed() {
        if (this.testVideoToPlay()) this.playPauseMovie();
        else this.sk.gui.handleKeys(this.sk.core.paths, this.sk.core.speakerList);
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate) this.sk.gui.handleTimeline();
    }

    handleMouseReleased() {
        this.sk.gui.handleResetTimelineLock();
    }

    // ****** UPDATE METHODS ****** //
    updateAnimationCounter() {
        if (this.mode.isAnimate) this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.getCurTimelineSelectEnd());
        else this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.getCurTimelineSelectStart());
        this.setIsAnimate(!this.mode.isAnimate);
    }

    updateAnimation() {
        if (this.mode.isAnimate) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapPixelTimeToTotalTime(this.sk.gui.getCurTimelineSelectEnd()) - this.mapPixelTimeToTotalTime(this.sk.gui.getCurTimelineSelectStart()); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (this.animationCounter < this.mapPixelTimeToTotalTime(this.sk.gui.getCurTimelineSelectEnd())) this.animationCounter += animationIncrementValue;
            else this.setIsAnimate(false);
        }
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            this.sk.core.updateVideoPosition(this.sk.mouseX, this.sk.mouseY);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) this.sk.core.updateVideoScrubAnimate(Math.floor(this.sk.map(this.bugTimeForVideoScrub, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), this.mapPixelTimeToVideoTime(this.sk.gui.getCurTimelineSelectStart()), this.mapPixelTimeToVideoTime(this.sk.gui.getCurTimelineSelectEnd()))));
        else if (this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.sk.core.updateVideoScrub(Math.floor(this.mapPixelTimeToVideoTime(this.mapPixelTimeToSelectTime(this.sk.mouseX))));
    }

    toggleVideoShowHide() {
        if (this.mode.isVideoShow) {
            this.sk.core.hideVideo();
            this.setIsVideoPlay(false);
            this.setIsVideoShow(false);
        } else {
            this.sk.core.showVideo();
            this.setIsVideoShow(true);
        }
    }

    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            this.sk.core.pauseVideo();
            this.setIsVideoPlay(false);
        } else {
            this.sk.core.playVideo(this.mapPixelTimeToVideoTime(this.mapPixelTimeToSelectTime(this.sk.mouseX)));
            this.setIsVideoPlay(true);
        }
    }

    // ****** DRAW HELPER METHODS ****** //
    /**
     * Returns properly scaled pixel values to GUI from data points
     * @param  {Movement Or Conversation Point} point
     * @param  {Integer} view
     */

    getScaledPos(point, view) {
        const timelineXPos = this.mapTotalTimeToPixelTime(point.time);
        const selTimelineXPos = this.mapSelectTimeToPixelTime(timelineXPos);
        const [floorPlanXPos, floorPlanYPos] = this.getScaledXYPos(point.xPos, point.yPos);
        return {
            timelineXPos,
            selTimelineXPos,
            floorPlanXPos,
            floorPlanYPos,
            viewXPos: this.getViewXPos(view, floorPlanXPos, selTimelineXPos),
            zPos: this.getZPos(view, selTimelineXPos)
        };
    }

    getViewXPos(view, floorPlanXPos, selTimelineXPos) {
        if (view === this.sk.PLAN) return floorPlanXPos;
        else if (view === this.sk.SPACETIME) {
            if (this.view3D.isShowing === true) return floorPlanXPos;
            else return selTimelineXPos;
        } else return null;
    }

    getZPos(view, selTimelineXPos) {
        if (view === this.sk.PLAN) return 0;
        else {
            if (this.view3D.isShowing) return selTimelineXPos;
            else return 0;
        }
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
     * Organizes floor plan drawing methods with and without rotation
     */
    setFloorPlan() {
        switch (this.getRotationMode()) {
            case 0:
                this.sk.drawFloorPlan(this.sk.gui.floorPlanContainer.width, this.sk.gui.floorPlanContainer.height);
                break;
            case 1:
                this.sk.drawRotatedFloorPlan(this.sk.HALF_PI, this.sk.gui.floorPlanContainer.height, this.sk.gui.floorPlanContainer.width);
                break;
            case 2:
                this.sk.drawRotatedFloorPlan(this.sk.PI, this.sk.gui.floorPlanContainer.width, this.sk.gui.floorPlanContainer.height);
                break;
            case 3:
                this.sk.drawRotatedFloorPlan(-this.sk.HALF_PI, this.sk.gui.floorPlanContainer.height, this.sk.gui.floorPlanContainer.width);
                break;
        }
    }

    /**
     * Test if point is in user view
     * @param  {MovementPoint} curPoint
     */
    testPointIsShowing(curPoint) {
        return this.sk.gui.overTimelineAxis(curPoint.timelineXPos) && this.sk.gui.overFloorPlan(curPoint.floorPlanXPos, curPoint.floorPlanYPos) && this.testAnimation(curPoint.timelineXPos);
    }

    /**
     * @param  {Number/Float} value
     */
    testAnimation(value) {
        if (this.mode.isAnimate) return this.animationCounter > this.mapPixelTimeToTotalTime(value);
        else return true;
    }

    testVideoToPlay() {
        return this.testVideoAndDivAreLoaded() && this.mode.isVideoShow && !this.mode.isAnimate && this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY);
    }

    testVideoAndDivAreLoaded() {
        return (this.sk.testData.dataIsLoaded(this.sk.core.videoPlayer) && this.sk.core.videoDivIsLoaded());
    }

    /**
     * Returns pixel width for drawing conversation rectangles based on curTotalTime of data, user timeline selection, and maxRectWidth
     * NOTE: curScaledRectWidth parameters 0-3600 scale pixels to 1 hour which works well 
     * and the map method maps to the inverse of 1 and maxRectWidth to properly adjust scaling/thickness of rects when user interacts with timeline
     */
    getCurConversationRectWidth() {
        const maxRectWidth = 10;
        const curScaledRectWidth = this.sk.map(this.sk.core.totalTimeInSeconds, 0, 3600, maxRectWidth, 1, true);
        return this.sk.map(this.sk.gui.getCurTimelineSelectEnd() - this.sk.gui.getCurTimelineSelectStart(), 0, this.sk.gui.getTimelineLength(), maxRectWidth, curScaledRectWidth);
    }

    mapVideoTimeToSelectedTime() {
        const timelinePos = this.mapTotalTimeToPixelTime(this.sk.core.videoPlayer.getCurrentTime());
        return this.mapSelectTimeToPixelTime(timelinePos);
    }

    mapPixelTimeToTotalTime(value) {
        return this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), 0, this.sk.core.totalTimeInSeconds);
    }

    mapPixelTimeToVideoTime(value) {
        return Math.floor(this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), 0, Math.floor(this.sk.core.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    mapPixelTimeToSelectTime(value) {
        return this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd());
    }

    mapToSelectTimeThenPixelTime(value) {
        return this.mapSelectTimeToPixelTime(this.mapPixelTimeToSelectTime(value));
    }

    mapSelectTimeToPixelTime(value) {
        if (this.view3D.isShowing) return this.sk.map(value, this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd(), this.sk.height / 10, this.sk.height / 1.6);
        else return this.sk.map(value, this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd(), this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    }

    mapTotalTimeToPixelTime(value) {
        return this.sk.map(value, 0, this.sk.core.totalTimeInSeconds, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    }

    setIsAnimate(value) {
        this.mode.isAnimate = value;
    }

    setIsAlignTalk(value) {
        this.mode.isAlignTalk = value;
    }

    setIsAllTalk(value) {
        this.mode.isAllTalk = value;
    }

    setIsIntro(value) {
        this.mode.isIntro = value;
    }

    setIsVideoPlay(value) {
        this.mode.isVideoPlay = value;
    }

    setIsVideoShow(value) {
        this.mode.isVideoShow = value;
    }

    getRotationMode() {
        return this.curFloorPlanRotation;
    }

    setRotateRight() {
        this.curFloorPlanRotation++;
        if (this.curFloorPlanRotation > 3) this.curFloorPlanRotation = 0;
    }

    setRotateLeft() {
        this.curFloorPlanRotation--;
        if (this.curFloorPlanRotation < 0) this.curFloorPlanRotation = 3;
    }
}