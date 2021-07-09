class SketchController {

    constructor(sketch) {
        this.sketch = sketch;
        this.mode = {
            isAnimate: false,
            isAlignTalk: false,
            isAllTalk: true,
            isIntro: true,
            isVideoPlay: false,
            isVideoShow: false
        }
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    updateLoop() {
        if (this.mode.isAnimate || this.mode.isVideoPlay) this.sketch.loop();
        else this.sketch.noLoop();
    }

    startLoop() {
        this.sketch.loop();
    }

    overLoadFloorPlanButton(fileLocation) {
        this.sketch.core.updateFloorPlan(fileLocation);
    }

    overLoadMovementButton(fileList) {
        this.sketch.processData.handleMovementFiles(fileList);
    }

    overLoadConversationButton(file) {
        this.sketch.processData.handleConversationFile(file);
    }

    overLoadVideoButton(fileLocation) {
        this.sketch.core.updateVideo('File', {
            fileName: fileLocation
        });
    }

    overVideoButton() {
        if (testData.dataIsLoaded(this.sketch.core.videoPlayer)) this.toggleVideoShowHide();
    }

    overAnimateButton() {
        if (this.mode.isAnimate) this.animationCounter = this.mapFromPixelToTotalTime(this.sketch.keys.timeline.selectEnd);
        else this.animationCounter = this.mapFromPixelToTotalTime(this.sketch.keys.timeline.selectStart);
        this.setIsAnimate(!this.mode.isAnimate);
    }

    overClearButton() {
        this.sketch.core.clearAllData();
    }

    handleMousePressed() {
        if (this.testVideoToPlay() && this.sketch.keys.overSpaceTimeView(this.sketch.mouseX, this.sketch.mouseY)) this.playPauseMovie();
        this.sketch.keys.handleKeys(this.sketch.core.paths, this.sketch.core.speakerList);
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate && ((this.sketch.keys.timeline.isLockedLeft || this.sketch.keys.timeline.isLockedRight) || this.sketch.keys.overTimelineAxisRegion())) this.sketch.keys.handleTimeline();
    }

    handleMouseReleased() {
        this.sketch.keys.timeline.isLockedLeft = false;
        this.sketch.keys.timeline.isLockedRight = false;
    }

    updateAnimation() {
        if (this.mode.isAnimate) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapFromPixelToTotalTime(this.sketch.keys.timeline.selectEnd) - this.mapFromPixelToTotalTime(this.sketch.keys.timeline.selectStart); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (this.animationCounter < this.mapFromPixelToTotalTime(this.sketch.keys.timeline.selectEnd)) this.animationCounter += animationIncrementValue;
            else this.setIsAnimate(false);
        }
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            this.sketch.core.videoPlayer.updatePos(this.sketch.mouseX, this.sketch.mouseY, 100);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) {
            const vPos = Math.floor(this.sketch.map(this.bugTimeForVideoScrub, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end, this.mapFromPixelToVideoTime(this.sketch.keys.timeline.selectStart), this.mapFromPixelToVideoTime(this.sketch.keys.timeline.selectEnd)));
            this.sketch.core.videoPlayer.seekTo(vPos);
        } else if (this.sketch.keys.overSpaceTimeView(this.sketch.mouseX, this.sketch.mouseY)) {
            const vPos = Math.floor(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(this.sketch.mouseX)));
            this.sketch.core.videoPlayer.seekTo(vPos);
            this.sketch.core.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    toggleVideoShowHide() {
        if (this.mode.isVideoShow) {
            this.sketch.core.videoPlayer.pause();
            this.sketch.core.videoPlayer.hide();
            this.setVideoPlay(false);
            this.setVideoShow(false);
        } else {
            this.sketch.core.videoPlayer.show();
            this.setVideoShow(true);
        }
    }

    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            this.sketch.core.videoPlayer.pause();
            this.setVideoPlay(false);
        } else {
            const tPos = this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(this.sketch.mouseX));
            this.sketch.core.videoPlayer.play();
            this.sketch.core.videoPlayer.seekTo(tPos);
            this.setVideoPlay(true);
        }
    }

    loadUserData() {
        this.setIntro(false); // Hide intro msg if showing
        this.sketch.core.clearAllData();
    }
    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.setIntro(false); // Hide intro msg if showing
        this.sketch.core.updateVideo(params[4], params[5]);
        this.sketch.core.updateFloorPlan(params[0] + params[1]);
        this.sketch.processData.handleExampleConversationFile(params[0], params[2]);
        this.sketch.processData.handleExampleMovementFiles(params[0], params[3]);
    }

    getScaledPointValues(point, view) {
        const pixelTime = this.sketch.map(point.time, 0, this.sketch.core.totalTimeInSeconds, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
        const scaledTime = this.sketch.map(pixelTime, this.sketch.keys.timeline.selectStart, this.sketch.keys.timeline.selectEnd, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
        const scaledXPos = point.xPos * this.sketch.keys.floorPlan.width / this.sketch.core.floorPlan.inputPixelWidth;
        const scaledYPos = point.yPos * this.sketch.keys.floorPlan.height / this.sketch.core.floorPlan.inputPixelHeight;
        let scaledSpaceTimeXPos;
        if (view === this.sketch.PLAN) scaledSpaceTimeXPos = scaledXPos;
        else if (view === this.sketch.SPACETIME) scaledSpaceTimeXPos = scaledTime;
        else scaledSpaceTimeXPos = this.sketch.NO_DATA;
        return {
            pixelTime,
            scaledTime,
            scaledXPos,
            scaledYPos,
            scaledSpaceTimeXPos
        };
    }

    testMovementPointToDraw(curPoint) {
        return this.sketch.keys.overTimelineAxis(curPoint.pixelTime) && this.sketch.keys.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime);
    }
    /**
     * Test if point is in user view
     * @param  {ConversationPoint} curPoint
     */
    testConversationPointToDraw(curPoint) {
        return this.sketch.keys.overTimelineAxis(curPoint.pixelTime) && this.sketch.keys.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime) && this.sketch.keys.overFloorPlanAndCursor(curPoint.scaledXPos, curPoint.scaledYPos);
    }

    /**
     * @param  {Number/Float} timeValue
     */
    testAnimation(value) {
        if (this.mode.isAnimate) return this.animationCounter > this.mapFromPixelToTotalTime(value);
        else return true;
    }

    testVideoToPlay() {
        return testData.dataIsLoaded(this.sketch.core.videoPlayer) && this.mode.isVideoShow && !this.mode.isAnimate && this.sketch.keys.overSpaceTimeView(this.sketch.mouseX, this.sketch.mouseY);
    }

    // map to inverse, values constrained between 10 and 1 (pixels)
    mapConversationRectRange() {
        return this.sketch.map(this.sketch.core.totalTimeInSeconds, 0, 3600, 10, 1, true)
    }

    mapFromPixelToTotalTime(value) {
        return this.sketch.map(value, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end, 0, this.sketch.core.totalTimeInSeconds);
    }

    mapFromTotalToPixelTime(value) {
        return this.sketch.map(value, 0, this.sketch.core.totalTimeInSeconds, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
    }

    mapFromPixelToVideoTime(value) {
        return Math.floor(this.sketch.map(value, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end, 0, Math.floor(this.sketch.core.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    mapFromPixelToSelectedTime(value) {
        return this.sketch.map(value, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end, this.sketch.keys.timeline.selectStart, this.sketch.keys.timeline.selectEnd);
    }

    mapFromVideoToSelectedTime() {
        const timelinePos = this.sketch.map(this.sketch.core.videoPlayer.getCurrentTime(), 0, this.sketch.core.totalTimeInSeconds, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
        return this.sketch.map(timelinePos, this.sketch.keys.timeline.selectStart, this.sketch.keys.timeline.selectEnd, this.sketch.keys.timeline.start, this.sketch.keys.timeline.end);
    }

    setSpeakerShow(speaker) {
        speaker.isShowing = !speaker.isShowing;
    }

    setPathShow(path) {
        path.isShowing = !path.isShowing;
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
}